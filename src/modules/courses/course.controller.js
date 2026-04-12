import * as courseService from "./course.service.js";
import Course from "./course.model.js";
import Enrollment from "../enrollments/enrollment.model.js";
import Review from "../reviews/review.model.js";
import cache from "../../utils/cache.js";

export const create = async (req, res, next) => {
  try { res.status(201).json(await courseService.createCourse(req.body, req.user)); } catch (err) { next(err); }
};

export const getAll = async (req, res, next) => {
  try { res.json(await courseService.getAllCourses(req.query)); } catch (err) { next(err); }
};

export const getById = async (req, res, next) => {
  try { res.json(await courseService.getCourseById(req.params.id)); } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try { res.json(await courseService.updateCourse(req.params.id, req.body, req.user)); } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try { await courseService.deleteCourse(req.params.id, req.user); res.json({ message: "Course deleted successfully" }); } catch (err) { next(err); }
};

export const submitForReview = async (req, res, next) => {
  try { const course = await courseService.submitCourse(req.params.id, req.user); res.json({ message: "Course submitted for review", course }); } catch (err) { next(err); }
};

export const myCourses = async (req, res, next) => {
  try { res.json(await courseService.getCoursesByUser(req.user)); } catch (err) { next(err); }
};

export const publish = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new Error("Course not found");
    if (course.teacher.toString() !== req.user._id.toString() && req.user.role !== "admin") throw new Error("Not authorized");
    course.isPublished = true;
    await course.save();
    cache.flushAll();
    res.json({ message: "Course published successfully", course });
  } catch (err) { next(err); }
};

export const updateThumbnail = async (req, res, next) => {
  try {
    const { thumbnailUrl, thumbnailPublicId } = req.body;
    if (!thumbnailUrl) throw new Error("thumbnailUrl is required");
    const course = await Course.findById(req.params.id);
    if (!course) throw new Error("Course not found");
    if (course.teacher.toString() !== req.user._id.toString() && req.user.role !== "admin") throw new Error("Not authorized");
    course.thumbnail = thumbnailUrl;
    course.thumbnailPublicId = thumbnailPublicId || "";
    await course.save();
    res.json({ message: "Thumbnail updated", thumbnail: course.thumbnail });
  } catch (err) { next(err); }
};

export const teacherDashboard = async (req, res, next) => {
  try {
    const courses = await Course.find({ teacher: req.user._id });
    const totalCourses = courses.length;
    const publishedCourses = courses.filter(c => c.isPublished).length;
    const averageRating = totalCourses ? courses.reduce((s, c) => s + (c.averageRating || 0), 0) / totalCourses : 0;
    const courseAnalytics = await Promise.all(courses.map(async c => {
      const enrollments = await Enrollment.find({ course: c._id });
      return { _id: c._id, title: c.title, totalStudents: enrollments.length, avgProgress: enrollments.length ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length) : 0 };
    }));
    res.json({ totalCourses, publishedCourses, averageRating, courses, courseAnalytics });
  } catch (err) { next(err); }
};

export const teacherOverviewAnalytics = async (req, res, next) => {
  try {
    const courseIds = (await Course.find({ teacher: req.user._id }).select("_id")).map(c => c._id);
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const enrollmentsByMonth = await Enrollment.aggregate([
      { $match: { course: { $in: courseIds }, createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
    ]);

    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { month: d.toLocaleString("default", { month: "short" }), year: d.getFullYear(), monthNum: d.getMonth() + 1 };
    });

    const enrollMap = Object.fromEntries(enrollmentsByMonth.map(e => [`${e._id.year}-${e._id.month}`, e.count]));
    const chartData = months.map(m => ({ month: m.month, enrollments: enrollMap[`${m.year}-${m.monthNum}`] || 0 }));
    const totalStudents = await Enrollment.countDocuments({ course: { $in: courseIds } });
    const totalReviews = await Review.countDocuments({ course: { $in: courseIds } });

    res.json({ chartData, totalStudents, totalReviews });
  } catch (err) { next(err); }
};

export const courseAnalytics = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new Error("Course not found");
    if (req.user.role !== "admin" && course.teacher.toString() !== req.user._id.toString()) throw new Error("Not authorized");

    const enrollments = await Enrollment.find({ course: req.params.id });
    const totalEnrollments = enrollments.length;
    const completed = enrollments.filter(e => e.progress >= 100).length;
    const inProgress = enrollments.filter(e => e.progress > 0 && e.progress < 100).length;
    const notStarted = enrollments.filter(e => e.progress === 0).length;
    const avgProgress = totalEnrollments ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / totalEnrollments) : 0;
    const completionRate = totalEnrollments ? Math.round((completed / totalEnrollments) * 100) : 0;

    const reviews = await Review.find({ course: req.params.id });
    const totalReviews = reviews.length;
    const avgRating = totalReviews ? Number((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1)) : 0;

    res.json({ totalEnrollments, completed, inProgress, notStarted, avgProgress, completionRate, totalReviews, avgRating });
  } catch (err) { next(err); }
};
