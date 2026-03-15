import User from "../users/user.model.js";
import Course from "../courses/course.model.js";
import Enrollment from "../enrollments/enrollment.model.js";
import Content from "../content/content.model.js";
import cache from "../../utils/cache.js";

export const getDashboardStats = async () => {
  const totalUsers = await User.countDocuments({ isDeleted: false });
  const totalStudents = await User.countDocuments({ role: "student" });
  const totalTeachers = await User.countDocuments({ role: "teacher" });

  const totalCourses = await Course.countDocuments({ isDeleted: false });
  const publishedCourses = await Course.countDocuments({
    isPublished: true,
    isDeleted: false,
  });

  const totalEnrollments = await Enrollment.countDocuments();
  const pendingContent = await Content.countDocuments({ approvalStatus: "pending" });

  const averageCompletion = await Enrollment.aggregate([
    {
      $group: {
        _id: null,
        avgProgress: { $avg: "$progress" },
      },
    },
  ]);

  return {
    totalUsers,
    totalStudents,
    totalTeachers,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    pendingContent,
    averageCompletion:
      averageCompletion[0]?.avgProgress || 0,
  };
};

// ADMIN: fetch pending courses
export const getPendingCourses = async () => {
  return await Course.find({ status: "pending" });
};

// ADMIN: approve a course
export const approveCourse = async (courseId) => {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");
  course.status = "approved";
  await course.save();
  return course;
};

// ADMIN: reject a course
export const rejectCourse = async (courseId) => {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");
  course.status = "rejected";
  await course.save();
  return course;
};

// ADMIN: list all users
export const getAllUsers = async () => {
  return await User.find({}).select("-password -refreshToken").sort({ createdAt: -1 });
};

// ADMIN: delete a user
export const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  await User.findByIdAndDelete(userId);
};

// ADMIN: list ALL courses (all statuses)
export const getAllCoursesAdmin = async () => {
  return await Course.find({}).populate("teacher", "name email").sort({ createdAt: -1 });
};

// ADMIN: force delete any course — also cleans up enrollments and content
export const deleteCourseAdmin = async (courseId) => {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");
  // cascade delete enrollments and content for this course
  await Enrollment.deleteMany({ course: courseId });
  await Content.deleteMany({ course: courseId });
  await Course.findByIdAndDelete(courseId);
  cache.flushAll();
};

// ADMIN: get all pending content
export const getPendingContent = async () => {
  return await Content.find({ approvalStatus: "pending" })
    .populate({ path: "course", select: "title", populate: { path: "teacher", select: "name email" } })
    .sort({ createdAt: -1 });
};

// ADMIN: approve content
export const approveContent = async (contentId) => {
  const content = await Content.findById(contentId);
  if (!content) throw new Error("Content not found");
  content.approvalStatus = "approved";
  content.rejectionReason = "";
  await content.save();
  return content;
};

// ADMIN: reject content
export const rejectContent = async (contentId, reason = "") => {
  const content = await Content.findById(contentId);
  if (!content) throw new Error("Content not found");
  content.approvalStatus = "rejected";
  content.rejectionReason = reason;
  await content.save();
  return content;
};
