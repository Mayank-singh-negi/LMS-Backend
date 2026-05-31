import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import Note from "./note.model.js";

const router = express.Router();

// GET all notes for a course
router.get("/:courseId", authenticate, async (req, res, next) => {
  try {
    const notes = await Note.find({ student: req.user._id, course: req.params.courseId }).lean();
    res.json(notes);
  } catch (err) { next(err); }
});

// PUT upsert note for a lesson
router.put("/:courseId/:lessonId", authenticate, async (req, res, next) => {
  try {
    const note = await Note.findOneAndUpdate(
      { student: req.user._id, course: req.params.courseId, lesson: req.params.lessonId },
      { $set: { content: req.body.content || "" } },
      { upsert: true, new: true }
    );
    res.json(note);
  } catch (err) { next(err); }
});

// DELETE note for a lesson
router.delete("/:courseId/:lessonId", authenticate, async (req, res, next) => {
  try {
    await Note.findOneAndDelete({ student: req.user._id, course: req.params.courseId, lesson: req.params.lessonId });
    res.json({ message: "Note deleted" });
  } catch (err) { next(err); }
});

export default router;
