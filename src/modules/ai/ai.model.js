import mongoose from "mongoose";

// Chat History Schema - stores all doubt solver conversations
const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    answer: {
      type: String,
      required: true,
    },
    tokensUsed: {
      promptTokens: {
        type: Number,
        default: 0,
      },
      completionTokens: {
        type: Number,
        default: 0,
      },
      totalTokens: {
        type: Number,
        default: 0,
      },
    },
    model: {
      type: String,
      default: "gpt-4o-mini",
    },
    isHelpful: {
      type: Boolean,
      default: null,
    },
    feedback: {
      type: String,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
chatHistorySchema.index({ userId: 1, createdAt: -1 });
chatHistorySchema.index({ courseId: 1, lessonId: 1 });
chatHistorySchema.index({ userId: 1, courseId: 1, lessonId: 1 });

// Generated Quiz Schema - stores AI-generated quizzes
const generatedQuizSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lessonContent: {
      type: String,
      required: true,
      maxlength: 50000,
    },
    questions: [
      {
        question: {
          type: String,
          required: true,
        },
        options: [
          {
            type: String,
            required: true,
          },
        ],
        correctAnswer: {
          type: String,
          required: true,
        },
        explanation: {
          type: String,
          default: "",
        },
      },
    ],
    tokensUsed: {
      promptTokens: {
        type: Number,
        default: 0,
      },
      completionTokens: {
        type: Number,
        default: 0,
      },
      totalTokens: {
        type: Number,
        default: 0,
      },
    },
    model: {
      type: String,
      default: "gpt-4o-mini",
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "generating", "completed", "failed"],
      default: "pending",
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
generatedQuizSchema.index({ courseId: 1, lessonId: 1 });
generatedQuizSchema.index({ createdBy: 1, createdAt: -1 });
generatedQuizSchema.index({ isPublished: 1 });
generatedQuizSchema.index({ status: 1 });

// Token Usage Tracking Schema - for monitoring costs and usage
const tokenUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["doubt_solver", "quiz_generator"],
      required: true,
    },
    tokensUsed: {
      type: Number,
      required: true,
    },
    costUSD: {
      type: Number,
      default: 0,
    },
    model: {
      type: String,
      default: "gpt-4o-mini",
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "referenceModel",
    },
    referenceModel: {
      type: String,
      enum: ["ChatHistory", "GeneratedQuiz"],
    },
  },
  { timestamps: true }
);

// Index for cost tracking and reporting
tokenUsageSchema.index({ userId: 1, createdAt: -1 });
tokenUsageSchema.index({ type: 1, createdAt: -1 });

export const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);
export const GeneratedQuiz = mongoose.model(
  "GeneratedQuiz",
  generatedQuizSchema
);
export const TokenUsage = mongoose.model("TokenUsage", tokenUsageSchema);
