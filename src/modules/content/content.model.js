import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: "Module", default: null },
    title: { type: String, default: "" },
    type: { type: String, enum: ["video", "pdf", "ppt", "live"], default: "video" },
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
    duration: { type: Number, default: 0 }, // seconds
    order: { type: Number, default: 0 },
    // Live class fields
    liveLink: { type: String, default: "" },
    liveStartedAt: { type: Date, default: null },
    liveEndsAt: { type: Date, default: null },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Content", contentSchema);
