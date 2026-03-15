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
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Content", contentSchema);
