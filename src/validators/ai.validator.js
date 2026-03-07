/**
 * Validation schemas for AI module endpoints
 * Uses middleware pattern for Express integration
 */

/**
 * Validate ask-doubt request
 * Ensures required fields are present and valid
 */
export const validateAskDoubt = (req, res, next) => {
  const { courseId, lessonId, question, lessonContent, courseTitle } = req.body;

  // Check required fields
  if (!courseId || !lessonId || !question || !lessonContent || !courseTitle) {
    return res.status(400).json({
      success: false,
      message:
        "Missing required fields. Required: courseId, lessonId, question, lessonContent, courseTitle",
    });
  }

  // Validate field types
  if (typeof question !== "string") {
    return res.status(400).json({
      success: false,
      message: "question must be a string",
    });
  }

  if (typeof lessonContent !== "string") {
    return res.status(400).json({
      success: false,
      message: "lessonContent must be a string",
    });
  }

  if (typeof courseTitle !== "string") {
    return res.status(400).json({
      success: false,
      message: "courseTitle must be a string",
    });
  }

  // Validate string lengths
  if (question.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: "Question must be at least 3 characters long",
    });
  }

  if (question.trim().length > 5000) {
    return res.status(400).json({
      success: false,
      message: "Question must not exceed 5000 characters",
    });
  }

  if (lessonContent.trim().length < 50) {
    return res.status(400).json({
      success: false,
      message: "Lesson content must be at least 50 characters",
    });
  }

  if (lessonContent.length > 50000) {
    return res.status(400).json({
      success: false,
      message: "Lesson content must not exceed 50000 characters",
    });
  }

  if (courseTitle.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: "Course title must be at least 3 characters",
    });
  }

  // Validate MongoDB ObjectId format (basic check)
  const objectIdRegex = /^[0-9a-f]{24}$/i;
  if (!objectIdRegex.test(courseId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid courseId format",
    });
  }

  if (!objectIdRegex.test(lessonId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid lessonId format",
    });
  }

  // Sanitize inputs
  req.body.question = req.body.question.trim();
  req.body.courseTitle = req.body.courseTitle.trim();

  next();
};

/**
 * Validate generate-quiz request
 * Ensures lesson content is valid and sufficient
 */
export const validateGenerateQuiz = (req, res, next) => {
  const { courseId, lessonId, lessonContent } = req.body;

  // Check required fields
  if (!courseId || !lessonId || !lessonContent) {
    return res.status(400).json({
      success: false,
      message:
        "Missing required fields. Required: courseId, lessonId, lessonContent",
    });
  }

  // Validate field types
  if (typeof lessonContent !== "string") {
    return res.status(400).json({
      success: false,
      message: "lessonContent must be a string",
    });
  }

  // Validate content length
  const contentLength = lessonContent.trim().length;
  if (contentLength < 100) {
    return res.status(400).json({
      success: false,
      message: "Lesson content must be at least 100 characters",
    });
  }

  if (contentLength > 50000) {
    return res.status(400).json({
      success: false,
      message: "Lesson content must not exceed 50000 characters",
    });
  }

  // Validate MongoDB ObjectId format
  const objectIdRegex = /^[0-9a-f]{24}$/i;
  if (!objectIdRegex.test(courseId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid courseId format",
    });
  }

  if (!objectIdRegex.test(lessonId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid lessonId format",
    });
  }

  // Check if content has meaningful text (not just whitespace or special chars)
  const meaningfulContent = lessonContent.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  if (meaningfulContent.split(/\s+/).length < 20) {
    return res.status(400).json({
      success: false,
      message:
        "Lesson content does not contain enough meaningful text (at least 20 words)",
    });
  }

  // Sanitize
  req.body.lessonContent = req.body.lessonContent.trim();

  next();
};

/**
 * Validate mark-feedback request
 * Ensures feedback data is valid
 */
export const validateMarkFeedback = (req, res, next) => {
  const { isHelpful, feedback } = req.body;
  const { chatHistoryId } = req.params;

  // Check required fields
  if (chatHistoryId === undefined || isHelpful === undefined) {
    return res.status(400).json({
      success: false,
      message:
        "Missing required fields. Required: chatHistoryId (in URL), isHelpful (in body)",
    });
  }

  // Validate field types
  if (typeof isHelpful !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "isHelpful must be a boolean (true or false)",
    });
  }

  // Validate feedback if provided
  if (feedback !== undefined && feedback !== null) {
    if (typeof feedback !== "string") {
      return res.status(400).json({
        success: false,
        message: "feedback must be a string",
      });
    }

    if (feedback.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Feedback must not exceed 1000 characters",
      });
    }
  }

  // Validate chatHistoryId format
  const objectIdRegex = /^[0-9a-f]{24}$/i;
  if (!objectIdRegex.test(chatHistoryId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid chatHistoryId format",
    });
  }

  next();
};

export default {
  validateAskDoubt,
  validateGenerateQuiz,
  validateMarkFeedback,
};
