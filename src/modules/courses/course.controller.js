import * as courseService from "./course.service.js";
import Course from "./course.model.js";
import cache from "../../utils/cache.js";

// CREATE
export const create = async (req, res, next) => {
  try {
    const course = await courseService.createCourse(req.body, req.user);
    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
};

// GET ALL
export const getAll = async (req, res, next) => {
  try {
    const data = await courseService.getAllCourses(req.query);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// GET BY ID
export const getById = async (req, res, next) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    res.json(course);
  } catch (err) {
    next(err);
  }
};

// UPDATE
export const update = async (req, res, next) => {
  try {
    const course = await courseService.updateCourse(
      req.params.id,
      req.body,
      req.user
    );
    res.json(course);
  } catch (err) {
    next(err);
  }
};

// DELETE
export const remove = async (req, res, next) => {
  try {
    await courseService.deleteCourse(req.params.id, req.user);
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// SUBMIT FOR REVIEW
export const submitForReview = async (req, res, next) => {
  try {
    const course = await courseService.submitCourse(req.params.id, req.user);
    res.json({ message: "Course submitted for review", course });
  } catch (err) {
    next(err);
  }
};

// TEACHER SELF-COURSES (all statuses)
export const myCourses = async (req, res, next) => {
  try {
    const courses = await courseService.getCoursesByUser(req.user);
    res.json(courses);
  } catch (err) {
    next(err);
  }
};

// ✅ PUBLISH COURSE
export const publish = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) throw new Error("Course not found");

    if (
      course.teacher.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      throw new Error("Not authorized");
    }

    course.isPublished = true;
    await course.save();

    cache.flushAll(); // clear cache

    res.json({ message: "Course published successfully", course });
  } catch (err) {
    next(err);
  }
};

// TEACHER DASHBOARD - list teacher's courses and basic stats
export const teacherDashboard = async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const courses = await Course.find({ teacher: teacherId });

    const totalCourses = courses.length;
    const publishedCourses = courses.filter((c) => c.isPublished).length;
    const averageRating = totalCourses
      ? courses.reduce((sum, c) => sum + (c.averageRating || 0), 0) / totalCourses
      : 0;

    res.json({ totalCourses, publishedCourses, averageRating, courses });
  } catch (err) {
    next(err);
  }
};
