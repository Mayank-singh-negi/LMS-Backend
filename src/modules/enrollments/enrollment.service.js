import Enrollment from "./enrollment.model.js";
import Course from "../courses/course.model.js";

export const enrollCourse = async (courseId, user) => {
  if (user.role !== "student") {
    throw new Error("Only students can enroll");
  }

  const course = await Course.findById(courseId);

  if (!course || !course.isPublished) {
    throw new Error("Course not available for enrollment");
  }

  const enrollment = await Enrollment.create({
    student: user._id,
    course: courseId,
  });

  return enrollment;
};

export const getMyEnrollments = async (user) => {
  return Enrollment.find({ student: user._id })
    .populate("course", "title description");
};
export const updateProgress = async (enrollmentId, progress, user) => {
  const enrollment = await Enrollment.findById(enrollmentId);

  if (!enrollment) {
    throw new Error("Enrollment not found");
  }

  if (enrollment.student.toString() !== user._id.toString()) {
    throw new Error("Not authorized to update this enrollment");
  }

  enrollment.progress = progress;
  await enrollment.save();

  return enrollment;
};
