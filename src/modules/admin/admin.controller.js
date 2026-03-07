import { getDashboardStats, getPendingCourses, approveCourse, rejectCourse } from "./admin.service.js";

export const dashboard = async (req, res, next) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

export const pendingCourses = async (req, res, next) => {
  try {
    const courses = await getPendingCourses();
    res.json(courses);
  } catch (err) {
    next(err);
  }
};

export const approveCourseCtrl = async (req, res, next) => {
  try {
    const course = await approveCourse(req.params.courseId);
    res.json({ message: "Course approved", course });
  } catch (err) {
    next(err);
  }
};

export const rejectCourseCtrl = async (req, res, next) => {
  try {
    const course = await rejectCourse(req.params.courseId);
    res.json({ message: "Course rejected", course });
  } catch (err) {
    next(err);
  }
};
