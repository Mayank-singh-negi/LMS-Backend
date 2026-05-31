import mongoose from "mongoose";

// Granular per-lesson progress tracking
const lessonProgressSchema = new mongoose.Schema(
  {
    student:        { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true, index: true },
    course:         { type: mongoose.Schema.Types.ObjectId, ref: "Course",  required: true, index: true },
    lesson:         { type: mongoose.Schema.Types.ObjectId, ref: "Content", required: true },
    completed:      { type: Boolean, default: false },
    videoTimestamp: { type: Number,  default: 0 },   // seconds
    pdfPage:        { type: Number,  default: 1 },
    watchedSeconds: { type: Number,  default: 0 },
  },
  { timestamps: true }
);

lessonProgressSchema.index({ student: 1, course: 1, lesson: 1 }, { unique: true });

export default mongoose.model("LessonProgress", lessonProgressSchema);
