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

  const existing = await Enrollment.findOne({ student: user._id, course: courseId });
  if (existing) {
    throw new Error("Already enrolled in this course");
  }

  const enrollment = await Enrollment.create({
    student: user._id,
    course: courseId,
  });

  return enrollment;
};

export const getMyEnrollments = async (user) => {
  const enrollments = await Enrollment.find({ student: user._id })
    .populate("course", "title description");
  // filter out enrollments whose course was deleted (populate returns null)
  return enrollments.filter(e => e.course != null);
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
