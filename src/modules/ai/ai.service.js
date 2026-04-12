import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mongoose from "mongoose";
import { ChatHistory, GeneratedQuiz, TokenUsage } from "./ai.model.js";
import winston from "winston";
import dotenv from "dotenv";

dotenv.config();

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: "ai-service.log" })],
});

// Token pricing (per 1K tokens)
const TOKEN_COSTS = {
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
};

const calculateTokenCost = (promptTokens = 0, completionTokens = 0, model = "gpt-4o-mini") => {
  const costs = TOKEN_COSTS[model] || TOKEN_COSTS["gpt-4o-mini"];
  const inputCost = (promptTokens / 1000) * costs.input;
  const outputCost = (completionTokens / 1000) * costs.output;
  return inputCost + outputCost;
};

// Simple sanitizer to avoid control characters and excessive length
const sanitizeInput = (text) => {
  if (!text) return "";
  return String(text).replace(/\s+/g, " ").trim().slice(0, 5000);
};

// System prompt builder for doubt solver
const buildDoubtSolverSystemPrompt = (lessonContent = "", courseTitle = "") => {
  return `You are an expert tutor for the course: ${courseTitle}. Use ONLY the provided lesson content to answer the student's question. Provide clear, concise explanations and avoid hallucinations. Lesson Content:\n${lessonContent}`;
};

// Track token usage in DB
const trackTokenUsage = async (userId, type, totalTokens, model, referenceId, referenceModel) => {
  try {
    const promptTokens = Math.round(totalTokens * 0.6);
    const completionTokens = Math.round(totalTokens * 0.4);
    const costUSD = calculateTokenCost(promptTokens, completionTokens, model);

    await TokenUsage.create({
      userId: new mongoose.Types.ObjectId(userId),
      type,
      tokensUsed: totalTokens,
      costUSD,
      model,
      referenceId: referenceId ? new mongoose.Types.ObjectId(referenceId) : undefined,
      referenceModel,
    });
  } catch (err) {
    logger.error("Failed to track token usage:", err);
  }
};

// Determine AI provider — Gemini takes priority if key exists
const aiProvider = process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? "gemini" : process.env.OPENAI_API_KEY ? "openai" : process.env.OLLAMA_BASE_URL ? "ollama" : null);
let aiClient = null;
let geminiClient = null;
if (aiProvider === "openai" && process.env.OPENAI_API_KEY) {
  aiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
if (aiProvider === "gemini" && process.env.GEMINI_API_KEY) {
  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}
const buildQuizGeneratorSystemPrompt = () => {
  return `You are an expert quiz designer for educational content. Your task is to generate high-quality multiple-choice questions.

Requirements:
1. Create exactly 5 questions
2. Each question should have exactly 4 options (A, B, C, D)
3. Only one correct answer per question
4. Ensure questions test understanding, not just memorization
5. Include one easy, two medium, and two hard questions
6. Provide clear explanations for correct answers
7. Return ONLY valid JSON, no additional text

Format your response as a valid JSON array with this exact structure:
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Why this answer is correct"
  }
]

Do NOT include markdown code blocks or any text outside the JSON array.`;
};

/**
 * Ask a doubt to AI (Doubt Solver Feature)
 * @param {object} params - Parameters object
 * @returns {object} Response with answer and token usage
 */
export const askDoubt = async ({
  userId,
  courseId,
  lessonId,
  question,
  lessonContent,
  courseTitle,
}) => {
  try {
    // Check if AI provider is configured
    if (!aiProvider) {
      throw new Error("AI is not configured. Please set GEMINI_API_KEY, OPENAI_API_KEY, or OLLAMA_BASE_URL environment variable.");
    }

    // Validate inputs
    const sanitizedQuestion = sanitizeInput(question);

    // Build messages
    const systemPrompt = buildDoubtSolverSystemPrompt(
      lessonContent,
      courseTitle
    );

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: sanitizedQuestion,
      },
    ];

    logger.info("Calling AI API for doubt solver", {
      userId,
      courseId,
      lessonId,
      questionLength: sanitizedQuestion.length,
      provider: aiProvider,
    });

    // Call AI API
    const model = aiProvider === "ollama" ? process.env.OLLAMA_MODEL || "llama2" : process.env.OPENAI_MODEL || "gpt-4o-mini";

    let response;
    if (aiProvider === "gemini") {
      const geminiModel = geminiClient.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
      const prompt = `${systemPrompt}\n\nUser question: ${sanitizedQuestion}`;
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text();
      response = {
        choices: [{ message: { content: text } }],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        model: "gemini-2.0-flash-lite",
      };
    } else if (aiProvider === "ollama") {
      const axios = await import("axios");
      const base = process.env.OLLAMA_BASE_URL;
      try {
        // Primary attempt: /api/chat (chat-style messages)
        const resp = await axios.default.post(`${base}/api/chat`, { model, messages, stream: false });
        const content = resp.data?.choices?.[0]?.message?.content || resp.data?.response || resp.data?.output?.[0]?.content || "";
        response = {
          choices: [{ message: { content } }],
          usage: {
            prompt_tokens: resp.data?.usage?.prompt_tokens || resp.data?.usage?.promptTokens || 0,
            completion_tokens: resp.data?.usage?.completion_tokens || resp.data?.usage?.completionTokens || 0,
            total_tokens: resp.data?.usage?.total_tokens || resp.data?.usage?.totalTokens || 0,
          },
          model,
        };
      } catch (err1) {
        // If the model doesn't fit memory, try to pick a smaller model from /api/tags
        const memoryErr = err1?.response?.data?.error || err1?.response?.data?.message || "";
        if (/(model requires|requires more system memory)/i.test(memoryErr)) {
          try {
            const tagsResp = await axios.default.get(`${base}/api/tags`);
            const models = Array.isArray(tagsResp.data) ? tagsResp.data : tagsResp.data?.models || [];
            // pick smallest by 'size' if available
            let fallbackModel = null;
            if (models.length) {
              models.sort((a, b) => (a.size || 0) - (b.size || 0));
              fallbackModel = models[0].name;
            }
            if (fallbackModel) {
              const respFallback = await axios.default.post(`${base}/api/chat`, { model: fallbackModel, messages, stream: false });
              const content = respFallback.data?.choices?.[0]?.message?.content || respFallback.data?.response || respFallback.data?.output?.[0]?.content || "";
              response = {
                choices: [{ message: { content } }],
                usage: {
                  prompt_tokens: respFallback.data?.usage?.prompt_tokens || respFallback.data?.usage?.promptTokens || 0,
                  completion_tokens: respFallback.data?.usage?.completion_tokens || respFallback.data?.usage?.completionTokens || 0,
                  total_tokens: respFallback.data?.usage?.total_tokens || respFallback.data?.usage?.totalTokens || 0,
                },
                model: fallbackModel,
              };
            }
          } catch (tagErr) {
            // fall through to try /api/generate below
          }
        }

        // If /api/chat failed for other reasons, try /api/generate by concatenating messages
        try {
          const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");
          const resp2 = await axios.default.post(`${base}/api/generate`, { model, input: prompt });
          const content = resp2.data?.output?.[0]?.content || resp2.data?.response || resp2.data?.result?.output?.[0]?.content || "";
          response = {
            choices: [{ message: { content } }],
            usage: {
              prompt_tokens: resp2.data?.usage?.prompt_tokens || resp2.data?.usage?.promptTokens || 0,
              completion_tokens: resp2.data?.usage?.completion_tokens || resp2.data?.usage?.completionTokens || 0,
              total_tokens: resp2.data?.usage?.total_tokens || resp2.data?.usage?.totalTokens || 0,
            },
            model,
          };
        } catch (err2) {
          const status = err2?.response?.status || err1?.response?.status || "unknown";
          const body = JSON.stringify(err2?.response?.data || err1?.response?.data || {});
          const e = new Error(`Ollama request failed: ${status} ${body}`);
          e.cause = err2 || err1;
          throw e;
        }
      }
    } else {
      response = await aiClient.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
      });
    }

    const answer = response.choices[0].message.content;
    const tokensUsed = response.usage.total_tokens;

    // Save to database
    const chatHistory = await ChatHistory.create({
      userId,
      courseId,
      lessonId,
      question: sanitizedQuestion,
      answer,
      tokensUsed: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: tokensUsed,
      },
      model: response.model,
    });

    // Track token usage for cost monitoring
    await trackTokenUsage(
      userId,
      "doubt_solver",
      tokensUsed,
      response.model,
      chatHistory._id,
      "ChatHistory"
    );

    logger.info("Doubt solved successfully", {
      userId,
      chatHistoryId: chatHistory._id,
      tokensUsed,
    });

    return {
      success: true,
      answer,
      tokensUsed: {
        prompt: response.usage.prompt_tokens,
        completion: response.usage.completion_tokens,
        total: tokensUsed,
      },
      chatHistoryId: chatHistory._id,
    };
  } catch (error) {
    logger.error("Error in askDoubt:", error);

    // Handle specific OpenAI errors
    if (error.status === 401) {
      throw new Error("OpenAI authentication failed - check API key");
    } else if (error.status === 429) {
      throw new Error("Rate limit exceeded - please try again later");
    } else if (error.status === 500) {
      throw new Error("OpenAI service unavailable - please try again later");
    }

    throw error;
  }
};

/**
 * Generate quiz questions from lesson content (Quiz Generator Feature)
 * @param {object} params - Parameters object
 * @returns {object} Response with generated questions and token usage
 */
export const generateQuiz = async ({
  userId,
  courseId,
  lessonId,
  lessonContent,
}) => {
  try {
    // Check if AI provider is configured
    if (!aiProvider) {
      throw new Error("AI is not configured. Please set GEMINI_API_KEY, OPENAI_API_KEY, or OLLAMA_BASE_URL environment variable.");
    }

    // Validate input
    if (!lessonContent || typeof lessonContent !== "string") {
      throw new Error("Invalid lesson content");
    }

    if (lessonContent.length > 50000) {
      throw new Error("Lesson content exceeds maximum length of 50000 characters");
    }

    const systemPrompt = buildQuizGeneratorSystemPrompt();

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Generate 5 multiple choice questions based on this lesson content:\n\n${lessonContent}`,
      },
    ];

    logger.info("Calling AI API for quiz generation", {
      userId,
      courseId,
      lessonId,
      contentLength: lessonContent.length,
      provider: aiProvider,
    });

    // Call AI API — Gemini, OpenAI, or Ollama
    const model = aiProvider === "ollama" ? process.env.OLLAMA_MODEL || "llama2" : process.env.OPENAI_MODEL || "gpt-4o-mini";
    let response;

    if (aiProvider === "gemini") {
      // Use Gemini Flash (free tier)
      const geminiModel = geminiClient.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
      const prompt = messages.map(m => m.content).join("\n\n");
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text();
      response = {
        choices: [{ message: { content: text } }],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        model: "gemini-2.0-flash-lite",
      };
    } else if (aiProvider === "ollama") {
      const axios = await import("axios");
      const base = process.env.OLLAMA_BASE_URL;
      try {
        const resp = await axios.default.post(`${base}/api/chat`, { model, messages, stream: false });
        const content = resp.data?.choices?.[0]?.message?.content || resp.data?.response || resp.data?.output?.[0]?.content || "";
        response = {
          choices: [{ message: { content } }],
          usage: {
            prompt_tokens: resp.data?.usage?.prompt_tokens || resp.data?.usage?.promptTokens || 0,
            completion_tokens: resp.data?.usage?.completion_tokens || resp.data?.usage?.completionTokens || 0,
            total_tokens: resp.data?.usage?.total_tokens || resp.data?.usage?.totalTokens || 0,
          },
          model,
        };
      } catch (err1) {
        try {
          const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");
          const resp2 = await axios.default.post(`${base}/api/generate`, { model, input: prompt });
          const content = resp2.data?.output?.[0]?.content || resp2.data?.response || resp2.data?.result?.output?.[0]?.content || "";
          response = {
            choices: [{ message: { content } }],
            usage: {
              prompt_tokens: resp2.data?.usage?.prompt_tokens || resp2.data?.usage?.promptTokens || 0,
              completion_tokens: resp2.data?.usage?.completion_tokens || resp2.data?.usage?.completionTokens || 0,
              total_tokens: resp2.data?.usage?.total_tokens || resp2.data?.usage?.totalTokens || 0,
            },
            model,
          };
        } catch (err2) {
          const status = err2?.response?.status || err1?.response?.status || "unknown";
          const body = JSON.stringify(err2?.response?.data || err1?.response?.data || {});
          const e = new Error(`Ollama request failed: ${status} ${body}`);
          e.cause = err2 || err1;
          throw e;
        }
      }
    } else {
      response = await aiClient.chat.completions.create({
        model,
        messages,
        temperature: 0.5, // Lower temperature for more consistent output
        max_tokens: 2000,
        top_p: 0.9,
      });
    }

    const generatedText = response.choices[0].message.content;

    // Parse JSON safely
    let questions;
    try {
      // Remove markdown code blocks if present
      let jsonText = generatedText;
      if (jsonText.includes("```json")) {
        jsonText = jsonText
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
      } else if (jsonText.includes("```")) {
        jsonText = jsonText
          .replace(/```\n?/g, "")
          .trim();
      }

      questions = JSON.parse(jsonText);

      // Validate questions structure
      if (!Array.isArray(questions)) {
        throw new Error("Generated content is not an array");
      }

      if (questions.length === 0) {
        throw new Error("No questions were generated");
      }

      // Validate each question
      questions.forEach((q, index) => {
        if (
          !q.question ||
          !Array.isArray(q.options) ||
          q.options.length !== 4 ||
          !q.correctAnswer
        ) {
          throw new Error(`Question ${index + 1} has invalid structure`);
        }
      });
    } catch (parseError) {
      logger.error("Failed to parse generated quiz JSON:", {
        error: parseError.message,
        content: generatedText.substring(0, 500),
      });
      throw new Error("Failed to parse generated quiz - invalid format");
    }

    const tokensUsed = response.usage.total_tokens;

    // Save to database
    const generatedQuiz = await GeneratedQuiz.create({
      courseId,
      lessonId,
      createdBy: userId,
      lessonContent: lessonContent.substring(0, 5000), // Store first 5000 chars as preview
      questions,
      tokensUsed: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: tokensUsed,
      },
      model: response.model,
      status: "completed",
    });

    // Track token usage for cost monitoring
    await trackTokenUsage(
      userId,
      "quiz_generator",
      tokensUsed,
      response.model,
      generatedQuiz._id,
      "GeneratedQuiz"
    );

    logger.info("Quiz generated successfully", {
      userId,
      quizId: generatedQuiz._id,
      questionsCount: questions.length,
      tokensUsed,
    });

    return {
      success: true,
      quizId: generatedQuiz._id,
      questions,
      tokensUsed: {
        prompt: response.usage.prompt_tokens,
        completion: response.usage.completion_tokens,
        total: tokensUsed,
      },
    };
  } catch (error) {
    logger.error("Error in generateQuiz:", error);

    // Handle specific OpenAI errors
    if (error.status === 401) {
      throw new Error("OpenAI authentication failed - check API key");
    } else if (error.status === 429) {
      throw new Error("Rate limit exceeded for quiz generation");
    } else if (error.status === 500) {
      throw new Error("OpenAI service unavailable - please try again later");
    }

    throw error;
  }
};

/**
 * Get chat history for a user in a specific lesson
 * @param {string} userId - User ID
 * @param {string} lessonId - Lesson ID
 * @param {number} limit - Number of records to fetch
 * @returns {array} Chat history records
 */
export const getChatHistory = async (userId, lessonId, limit = 50) => {
  try {
    const history = await ChatHistory.find({
      userId,
      lessonId,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return history;
  } catch (error) {
    logger.error("Error fetching chat history:", error);
    throw new Error("Failed to fetch chat history");
  }
};

/**
 * Get generated quizzes for a lesson
 * @param {string} courseId - Course ID
 * @param {string} lessonId - Lesson ID
 * @returns {array} Generated quizzes
 */
export const getLessonQuizzes = async (courseId, lessonId) => {
  try {
    const quizzes = await GeneratedQuiz.find({
      courseId,
      lessonId,
      isPublished: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    return quizzes;
  } catch (error) {
    logger.error("Error fetching lesson quizzes:", error);
    throw new Error("Failed to fetch quizzes");
  }
};

/**
 * Publish a generated quiz
 * @param {string} quizId - Quiz ID
 * @param {string} userId - User ID (to verify ownership)
 * @returns {object} Updated quiz
 */
export const publishQuiz = async (quizId, userId) => {
  try {
    const quiz = await GeneratedQuiz.findById(quizId);

    if (!quiz) {
      throw new Error("Quiz not found");
    }

    if (quiz.createdBy.toString() !== userId) {
      throw new Error("Unauthorized - you can only publish your own quizzes");
    }

    quiz.isPublished = true;
    quiz.publishedAt = new Date();
    await quiz.save();

    logger.info("Quiz published successfully", {
      quizId,
      userId,
    });

    return quiz;
  } catch (error) {
    logger.error("Error publishing quiz:", error);
    throw error;
  }
};

/**
 * Mark doubt solver answer as helpful/unhelpful
 * @param {string} chatHistoryId - Chat history ID
 * @param {boolean} isHelpful - Whether the answer was helpful
 * @param {string} feedback - Optional feedback from user
 * @returns {object} Updated chat history
 */
export const markAnswerFeedback = async (
  chatHistoryId,
  isHelpful,
  feedback = null
) => {
  try {
    const updated = await ChatHistory.findByIdAndUpdate(
      chatHistoryId,
      {
        isHelpful,
        feedback,
      },
      { new: true }
    );

    if (!updated) {
      throw new Error("Chat history not found");
    }

    logger.info("Answer feedback recorded", {
      chatHistoryId,
      isHelpful,
    });

    return updated;
  } catch (error) {
    logger.error("Error marking feedback:", error);
    throw error;
  }
};

/**
 * Get user's AI usage statistics
 * @param {string} userId - User ID
 * @returns {object} Usage statistics
 */
export const getUserAIStats = async (userId) => {
  try {
    const stats = await TokenUsage.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) },
      },
      {
        $group: {
          _id: "$type",
          totalTokens: { $sum: "$tokensUsed" },
          totalCost: { $sum: "$costUSD" },
          count: { $sum: 1 },
        },
      },
    ]);

    const doubtStats = stats.find((s) => s._id === "doubt_solver") || {
      totalTokens: 0,
      totalCost: 0,
      count: 0,
    };
    const quizStats = stats.find((s) => s._id === "quiz_generator") || {
      totalTokens: 0,
      totalCost: 0,
      count: 0,
    };

    return {
      doubtSolver: {
        questionsAsked: doubtStats.count,
        tokensUsed: doubtStats.totalTokens,
        costUSD: doubtStats.totalCost,
      },
      quizGenerator: {
        quizzesGenerated: quizStats.count,
        tokensUsed: quizStats.totalTokens,
        costUSD: quizStats.totalCost,
      },
      total: {
        tokensUsed:
          doubtStats.totalTokens + quizStats.totalTokens,
        costUSD: doubtStats.totalCost + quizStats.totalCost,
      },
    };
  } catch (error) {
    logger.error("Error getting user AI stats:", error);
    throw new Error("Failed to get usage statistics");
  }
};

export default {
  askDoubt,
  generateQuiz,
  getChatHistory,
  getLessonQuizzes,
  publishQuiz,
  markAnswerFeedback,
  getUserAIStats,
};






