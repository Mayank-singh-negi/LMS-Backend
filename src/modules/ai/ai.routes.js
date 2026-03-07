import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  askDoubtController,
  generateQuizController,
  getChatHistoryController,
  getLessonQuizzesController,
  publishQuizController,
  markFeedbackController,
  getUserStatsController,
  getQuizByIdController,
  deleteQuizController,
} from "./ai.controller.js";
import { aiRateLimiter, aiStrictRateLimiter } from "../../middlewares/ai-rate-limit.middleware.js";
import {
  validateAskDoubt,
  validateGenerateQuiz,
  validateMarkFeedback,
} from "../../validators/ai.validator.js";

const router = express.Router();

/**
 * DOUBT SOLVER ROUTES
 */

// POST - Ask a doubt about lesson content
// Rate limited: 30 requests per 15 minutes per user
router.post(
  "/ask-doubt",
  authenticate,
  authorize("student", "teacher", "admin"),
  aiRateLimiter,
  validateAskDoubt,
  askDoubtController
);

// GET - Get chat history for a lesson
router.get(
  "/chat-history/:lessonId",
  authenticate,
  getChatHistoryController
);

// POST - Mark answer as helpful/unhelpful
router.post(
  "/feedback/:chatHistoryId",
  authenticate,
  markFeedbackController
);

/**
 * QUIZ GENERATOR ROUTES
 */

// POST - Generate quiz from lesson content
// Stricter rate limit: 10 requests per hour per user
// Only teachers and admins can generate quizzes
router.post(
  "/generate-quiz",
  authenticate,
  authorize("teacher", "admin"),
  aiStrictRateLimiter,
  validateGenerateQuiz,
  generateQuizController
);

// GET - Get published quizzes for a lesson
router.get(
  "/quizzes/:courseId/:lessonId",
  authenticate,
  getLessonQuizzesController
);

// GET - Get specific quiz by ID
router.get(
  "/quiz/:quizId",
  authenticate,
  getQuizByIdController
);

// PATCH - Publish a generated quiz
// Only the creator or admin can publish
router.patch(
  "/quiz/:quizId/publish",
  authenticate,
  authorize("teacher", "admin"),
  publishQuizController
);

// DELETE - Delete a generated quiz
// Only the creator or admin can delete
router.delete(
  "/quiz/:quizId",
  authenticate,
  authorize("teacher", "admin"),
  deleteQuizController
);

/**
 * STATISTICS & ANALYTICS ROUTES
 */

// GET - Get user's AI usage statistics
router.get(
  "/stats",
  authenticate,
  getUserStatsController
);

export default router;
