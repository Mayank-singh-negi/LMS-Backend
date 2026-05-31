import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import LessonProgress from "./progress.model.js";
import Enrollment from "../enrollments/enrollment.model.js";
import Content from "../content/content.model.js";

const router = express.Router();

// GET all lesson progress for a course
router.get("/:courseId", authenticate, async (req, res, next) => {
  try {
    const progress = await LessonProgress.find({
      student: req.user._id,
      course: req.params.courseId,
    }).lean();
    res.json(progress);
  } catch (err) { next(err); }
});

// PATCH upsert lesson progress (video timestamp, pdf page, completed)
router.patch("/:courseId/:lessonId", authenticate, async (req, res, next) => {
  try {
    const { completed, videoTimestamp, pdfPage, watchedSeconds } = req.body;

    const update = {};
    if (completed !== undefined)      update.completed      = completed;
    if (videoTimestamp !== undefined) update.videoTimestamp = videoTimestamp;
    if (pdfPage !== undefined)        update.pdfPage        = pdfPage;
    if (watchedSeconds !== undefined) update.watchedSeconds = watchedSeconds;

    const doc = await LessonProgress.findOneAndUpdate(
      { student: req.user._id, course: req.params.courseId, lesson: req.params.lessonId },
      { $set: update },
      { upsert: true, new: true }
    );

    // Recalculate overall course progress
    const [totalLessons, completedCount] = await Promise.all([
      Content.countDocuments({ course: req.params.courseId, approvalStatus: "approved" }),
      LessonProgress.countDocuments({ student: req.user._id, course: req.params.courseId, completed: true }),
    ]);

    const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    await Enrollment.findOneAndUpdate(
      { student: req.user._id, course: req.params.courseId },
      { $set: { progress: pct } }
    );

    res.json({ lessonProgress: doc, courseProgress: pct });
  } catch (err) { next(err); }
});

export default router;
