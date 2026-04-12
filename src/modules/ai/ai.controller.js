import {
  askDoubt,
  generateQuiz,
  getChatHistory,
  getLessonQuizzes,
  publishQuiz,
  markAnswerFeedback,
  getUserAIStats,
} from "./ai.service.js";
import { GeneratedQuiz } from "./ai.model.js";
import winston from "winston";

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "ai-controller.log" }),
  ],
});

/**
 * POST /api/v1/ai/ask-doubt
 * Student asks a doubt about a lesson
 * Only authenticated students can access
 */
export const askDoubtController = async (req, res) => {
  try {
    const { courseId, lessonId, question, lessonContent, courseTitle } =
      req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!courseId || !lessonId || !question) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: courseId, lessonId, question",
      });
    }

    if (!lessonContent || !courseTitle) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: lessonContent, courseTitle",
      });
    }

    logger.info("Doubt solver request received", {
      userId,
      courseId,
      lessonId,
      questionLength: question.length,
    });

    // Call service
    const result = await askDoubt({
      userId,
      courseId,
      lessonId,
      question,
      lessonContent,
      courseTitle,
    });

    return res.status(200).json({
      success: true,
      data: {
        answer: result.answer,
        tokensUsed: result.tokensUsed,
        chatHistoryId: result.chatHistoryId,
      },
      message: "Doubt solved successfully",
    });
  } catch (error) {
    logger.error("Error in askDoubtController:", error.message);

    // Handle validation errors
    if (error.message.includes("must be")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle OpenAI rate limiting
    if (error.message.includes("Rate limit")) {
      return res.status(429).json({
        success: false,
        message: "Too many requests, please try again later",
      });
    }

    // Handle OpenAI service errors
    if (error.message.includes("unavailable")) {
      return res.status(503).json({
        success: false,
        message: "AI service temporarily unavailable",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to solve doubt",
    });
  }
};

/**
 * POST /api/v1/ai/generate-quiz
 * Teacher generates MCQ quiz from lesson content
 * Only authenticated teachers/admins can access
 */
export const generateQuizController = async (req, res) => {
  try {
    const { courseId, lessonId, lessonContent } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!courseId || !lessonId || !lessonContent) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: courseId, lessonId, lessonContent",
      });
    }

    // Validate lesson content is a string
    if (typeof lessonContent !== "string") {
      return res.status(400).json({
        success: false,
        message: "lessonContent must be a string",
      });
    }

    if (lessonContent.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Lesson content must be at least 10 characters",
      });
    }

    logger.info("Quiz generation request received", {
      userId,
      courseId,
      lessonId,
      contentLength: lessonContent.length,
    });

    // Call service
    const result = await generateQuiz({
      userId,
      courseId,
      lessonId,
      lessonContent,
    });

    return res.status(201).json({
      success: true,
      data: {
        quizId: result.quizId,
        questions: result.questions,
        tokensUsed: result.tokensUsed,
      },
      message: "Quiz generated successfully",
    });
  } catch (error) {
    logger.error("Error in generateQuizController:", error.message);

    // Handle validation errors
    if (error.message.includes("exceeds maximum")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle JSON parsing errors
    if (error.message.includes("Failed to parse")) {
      return res.status(422).json({
        success: false,
        message: error.message,
      });
    }

    // Handle OpenAI rate limiting
    if (error.message.includes("Rate limit")) {
      return res.status(429).json({
        success: false,
        message: "Too many requests, please try again later",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate quiz",
    });
  }
};

/**
 * GET /api/v1/ai/chat-history/:lessonId
 * Get chat history for a specific lesson
 */
export const getChatHistoryController = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    // Validate lessonId
    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: "lessonId is required",
      });
    }

    logger.info("Fetching chat history", {
      userId,
      lessonId,
    });

    const history = await getChatHistory(userId, lessonId, parseInt(limit));

    return res.status(200).json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    logger.error("Error in getChatHistoryController:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch chat history",
    });
  }
};

/**
 * GET /api/v1/ai/quizzes/:courseId/:lessonId
 * Get published quizzes for a lesson
 */
export const getLessonQuizzesController = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    // Validate parameters
    if (!courseId || !lessonId) {
      return res.status(400).json({
        success: false,
        message: "courseId and lessonId are required",
      });
    }

    logger.info("Fetching lesson quizzes", {
      courseId,
      lessonId,
    });

    const quizzes = await getLessonQuizzes(courseId, lessonId);

    return res.status(200).json({
      success: true,
      data: quizzes,
      count: quizzes.length,
    });
  } catch (error) {
    logger.error("Error in getLessonQuizzesController:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch quizzes",
    });
  }
};

/**
 * PATCH /api/v1/ai/quiz/:quizId/publish
 * Publish a generated quiz
 */
export const publishQuizController = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;

    // Validate quizId
    if (!quizId) {
      return res.status(400).json({
        success: false,
        message: "quizId is required",
      });
    }

    logger.info("Publishing quiz", {
      quizId,
      userId,
    });

    const quiz = await publishQuiz(quizId, userId);

    return res.status(200).json({
      success: true,
      data: quiz,
      message: "Quiz published successfully",
    });
  } catch (error) {
    logger.error("Error in publishQuizController:", error.message);

    // Handle authorization errors
    if (error.message.includes("Unauthorized")) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    // Handle not found errors
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to publish quiz",
    });
  }
};

/**
 * POST /api/v1/ai/feedback/:chatHistoryId
 * Mark an answer as helpful or not helpful
 */
export const markFeedbackController = async (req, res) => {
  try {
    const { chatHistoryId } = req.params;
    const { isHelpful, feedback } = req.body;

    // Validate inputs
    if (!chatHistoryId) {
      return res.status(400).json({
        success: false,
        message: "chatHistoryId is required",
      });
    }

    if (typeof isHelpful !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isHelpful must be a boolean",
      });
    }

    logger.info("Recording feedback", {
      chatHistoryId,
      isHelpful,
    });

    const updated = await markAnswerFeedback(chatHistoryId, isHelpful, feedback);

    return res.status(200).json({
      success: true,
      data: updated,
      message: "Feedback recorded successfully",
    });
  } catch (error) {
    logger.error("Error in markFeedbackController:", error.message);

    // Handle not found errors
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to record feedback",
    });
  }
};

/**
 * GET /api/v1/ai/stats
 * Get user's AI usage statistics
 */
export const getUserStatsController = async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info("Fetching user AI stats", {
      userId,
    });

    const stats = await getUserAIStats(userId);

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error in getUserStatsController:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch statistics",
    });
  }
};

/**
 * GET /api/v1/ai/quizzes/course/:courseId
 * Get all published quizzes for a course (students)
 */
export const getCourseQuizzesController = async (req, res) => {
  try {
    const { courseId } = req.params;
    const quizzes = await GeneratedQuiz.find({ courseId, isPublished: true })
      .select("_id courseId questions createdAt")
      .lean();
    return res.status(200).json({ success: true, data: quizzes });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/ai/quiz/:quizId/attempt
 * Student attempts a quiz — submit answers, get score
 */
export const attemptQuizController = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // { [questionIndex]: selectedOption }

    const quiz = await GeneratedQuiz.findById(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
    if (!quiz.isPublished) return res.status(403).json({ success: false, message: "Quiz is not published yet" });

    let score = 0;
    const breakdown = quiz.questions.map((q, i) => {
      const selected = answers[i] ?? null;
      const correct = selected === q.correctAnswer;
      if (correct) score++;
      return { question: q.question, selected, correctAnswer: q.correctAnswer, correct, explanation: q.explanation };
    });

    return res.status(200).json({
      success: true,
      data: { score, total: quiz.questions.length, percentage: Math.round((score / quiz.questions.length) * 100), breakdown },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/ai/quiz/:quizId
 * Get a specific generated quiz by ID
 */
export const getQuizByIdController = async (req, res) => {
  try {
    const { quizId } = req.params;

    if (!quizId) {
      return res.status(400).json({
        success: false,
        message: "quizId is required",
      });
    }

    const quiz = await GeneratedQuiz.findById(quizId).lean();

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    logger.error("Error in getQuizByIdController:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch quiz",
    });
  }
};

/**
 * DELETE /api/v1/ai/quiz/:quizId
 * Delete a generated quiz (only by creator or admin)
 */
export const deleteQuizController = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;

    if (!quizId) {
      return res.status(400).json({
        success: false,
        message: "quizId is required",
      });
    }

    const quiz = await GeneratedQuiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Check authorization
    if (quiz.createdBy.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this quiz",
      });
    }

    await GeneratedQuiz.findByIdAndDelete(quizId);

    logger.info("Quiz deleted", {
      quizId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    logger.error("Error in deleteQuizController:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete quiz",
    });
  }
};


