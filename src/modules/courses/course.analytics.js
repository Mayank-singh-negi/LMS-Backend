import Course from "./course.model.js";
import Enrollment from "../enrollments/enrollment.model.js";
import mongoose from "mongoose";

export const getTeacherStats = async (teacherId) => {
  const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

  const courses = await Course.countDocuments({
    teacher: teacherObjectId,
    isDeleted: false,
  });

  const enrollmentStats = await Enrollment.aggregate([
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "courseData",
      },
    },
    { $unwind: "$courseData" },
    {
      $match: {
        "courseData.teacher": teacherObjectId,
      },
    },
    {
      $group: {
        _id: "$courseData._id",
        title: { $first: "$courseData.title" },
        totalStudents: { $sum: 1 },
        avgProgress: { $avg: "$progress" },
      },
    },
  ]);

  return {
    totalCourses: courses,
    courseAnalytics: enrollmentStats,
  };
};
