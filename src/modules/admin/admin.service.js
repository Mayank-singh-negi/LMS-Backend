import User from "../users/user.model.js";
import Course from "../courses/course.model.js";
import Enrollment from "../enrollments/enrollment.model.js";

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
