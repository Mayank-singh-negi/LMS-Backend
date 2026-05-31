import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true, index: true },
    course:  { type: mongoose.Schema.Types.ObjectId, ref: "Course",  required: true },
    lesson:  { type: mongoose.Schema.Types.ObjectId, ref: "Content", required: true },
    content: { type: String, default: "" },
  },
  { timestamps: true }
);

noteSchema.index({ student: 1, course: 1, lesson: 1 }, { unique: true });

export default mongoose.model("Note", noteSchema);
