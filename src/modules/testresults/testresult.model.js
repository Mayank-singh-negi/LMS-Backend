import mongoose from "mongoose";

const testResultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mockTest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MockTest",
      required: true,
    },
    score: Number,
    totalQuestions: Number,
  },
  { timestamps: true }
);

export default mongoose.model("TestResult", testResultSchema);
