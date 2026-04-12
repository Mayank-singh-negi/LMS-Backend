import Enrollment from "../enrollments/enrollment.model.js";
import Certificate from "./certificate.model.js";
import { v4 as uuidv4 } from "uuid";

export const generateCertificate = async (courseId, studentId) => {
  const enrollment = await Enrollment.findOne({
    course: courseId,
    student: studentId,
  });

  if (!enrollment) {
    throw new Error("Not enrolled in course");
  }

  if (enrollment.progress < 100) {
    throw new Error("Course not completed yet");
  }

  const existing = await Certificate.findOne({
    course: courseId,
    student: studentId,
  });

  if (existing) return existing;

  return await Certificate.create({
    student: studentId,
    course: courseId,
    certificateId: uuidv4(),
  });
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

export const getStudentCertificates = async (studentId) => {
  return await Certificate.find({ student: studentId })
    .populate("course", "title thumbnail description")
    .sort({ createdAt: -1 });
};
