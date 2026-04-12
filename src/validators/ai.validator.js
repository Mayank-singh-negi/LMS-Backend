export const validateAskDoubt = (req, res, next) => {
  const { courseId, lessonId, question, lessonContent, courseTitle } = req.body;

  if (!courseId || !lessonId || !question || !lessonContent || !courseTitle) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: courseId, lessonId, question, lessonContent, courseTitle",
    });
  }

  if (typeof question !== "string" || question.trim().length < 1) {
    return res.status(400).json({ success: false, message: "question must be a non-empty string" });
  }

  if (question.trim().length > 5000) {
    return res.status(400).json({ success: false, message: "Question must not exceed 5000 characters" });
  }

  if (typeof lessonContent !== "string") {
    return res.status(400).json({ success: false, message: "lessonContent must be a string" });
  }

  if (lessonContent.length > 50000) {
    return res.status(400).json({ success: false, message: "Lesson content must not exceed 50000 characters" });
  }

  if (typeof courseTitle !== "string" || courseTitle.trim().length < 1) {
    return res.status(400).json({ success: false, message: "courseTitle must be a non-empty string" });
  }

  req.body.question = req.body.question.trim();
  req.body.courseTitle = req.body.courseTitle.trim();

  next();
};

export const validateGenerateQuiz = (req, res, next) => {
  const { courseId, lessonId, lessonContent } = req.body;

  if (!courseId || !lessonId || !lessonContent) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: courseId, lessonId, lessonContent",
    });
  }

  if (typeof lessonContent !== "string") {
    return res.status(400).json({ success: false, message: "lessonContent must be a string" });
  }

  if (lessonContent.trim().length < 10) {
    return res.status(400).json({ success: false, message: "Lesson content must be at least 10 characters" });
  }

  if (lessonContent.length > 50000) {
    return res.status(400).json({ success: false, message: "Lesson content must not exceed 50000 characters" });
  }

  req.body.lessonContent = req.body.lessonContent.trim();
  next();
};

export const validateMarkFeedback = (req, res, next) => {
  const { isHelpful, feedback } = req.body;
  const { chatHistoryId } = req.params;

  if (chatHistoryId === undefined || isHelpful === undefined) {
    return res.status(400).json({ success: false, message: "Missing required fields: chatHistoryId, isHelpful" });
  }

  if (typeof isHelpful !== "boolean") {
    return res.status(400).json({ success: false, message: "isHelpful must be a boolean" });
  }

  if (feedback !== undefined && feedback !== null) {
    if (typeof feedback !== "string" || feedback.trim().length > 1000) {
      return res.status(400).json({ success: false, message: "feedback must be a string under 1000 characters" });
    }
  }

  next();
};

export default { validateAskDoubt, validateGenerateQuiz, validateMarkFeedback };
