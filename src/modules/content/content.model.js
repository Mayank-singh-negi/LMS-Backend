import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: String,
    type: {
      type: String,
      enum: ["video", "pdf"],
    },
    url: String,
    publicId: String,
  },
  { timestamps: true }
);

export default mongoose.model("Content", contentSchema);
