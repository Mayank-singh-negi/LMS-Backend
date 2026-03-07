import MockTest from "../mocktests/mocktest.model.js";
import TestResult from "./testresult.model.js";

export const submitTest = async (mockTestId, answers, user) => {
  if (user.role !== "student") {
    throw new Error("Only students can attempt tests");
  }

  const mockTest = await MockTest.findById(mockTestId);

  if (!mockTest) {
    throw new Error("Mock test not found");
  }

  let score = 0;

  mockTest.questions.forEach((question, index) => {
    if (answers[index] === question.correctAnswer) {
      score++;
    }
  });

  const result = await TestResult.create({
    student: user._id,
    mockTest: mockTestId,
    score,
    totalQuestions: mockTest.questions.length,
  });

  return result;
};
export const getStudentResults = async (studentId) => {
  return await TestResult.find({ student: studentId })
    .populate({
      path: "mockTest",
      select: "title",
    })
    .sort({ createdAt: -1 });
};
export const verifyCertificate = async (certificateId) => {
  const cert = await Certificate.findOne({ certificateId })
    .populate("student", "name email")
    .populate("course", "title");

  if (!cert) {
    throw new Error("Certificate not found");
  }

  return cert;
};
