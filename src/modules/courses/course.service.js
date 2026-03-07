import Course from "./course.model.js";
import cache from "../../utils/cache.js";
import { logAction } from "../audit/audit.service.js";


// CREATE COURSE
export const createCourse = async (data, user) => {
  if (user.role !== "teacher" && user.role !== "admin") {
    throw new Error("Only teachers can create courses");
  }

  const course = await Course.create({
    ...data,
    teacher: user._id,
  });

  cache.flushAll(); // clear cache after change
  return course;
};

// GET ALL COURSES (Search + Filter + Pagination + Cache)
export const getAllCourses = async (query) => {
  const cacheKey = `courses:${JSON.stringify(query)}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { isPublished: true, status: "approved" };

  if (query.search) {
    filter.title = {
      $regex: query.search,
      $options: "i",
    };
  }

  if (query.minRating) {
    filter.averageRating = {
      $gte: Number(query.minRating),
    };
  }

  let sortOption = { createdAt: -1 };

  if (query.sort === "rating") {
    sortOption = { averageRating: -1 };
  }

  const courses = await Course.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  const total = await Course.countDocuments(filter);

  const result = {
    total,
    page,
    totalPages: Math.ceil(total / limit),
    courses,
  };

  cache.set(cacheKey, result);

  return result;
};

// GET COURSE BY ID (With Cache)
export const getCourseById = async (id) => {
  const cacheKey = `course:${id}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const course = await Course.findById(id);

  if (!course) throw new Error("Course not found");

  cache.set(cacheKey, course);

  return course;
};

// UPDATE COURSE
export const updateCourse = async (id, data, user) => {
  const course = await Course.findById(id);

  if (!course) throw new Error("Course not found");

  if (
    course.teacher.toString() !== user._id.toString() &&
    user.role !== "admin"
  ) {
    throw new Error("Not authorized");
  }

  Object.assign(course, data);
  await course.save();

  cache.flushAll(); // clear cache
  return course;
};

// SUBMIT COURSE FOR REVIEW
export const submitCourse = async (courseId, user) => {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");
  if (course.teacher.toString() !== user._id.toString()) {
    throw new Error("Not authorized to submit this course");
  }
  course.status = "pending";
  await course.save();
  cache.flushAll();
  return course;
};

// GET COURSES CREATED BY USER (all statuses)
export const getCoursesByUser = async (user) => {
  return await Course.find({ teacher: user._id });
};

// DELETE COURSE
export const deleteCourse = async (id, user) => {
  const course = await Course.findById(id);

  if (!course) throw new Error("Course not found");

  if (
    course.teacher.toString() !== user._id.toString() &&
    user.role !== "admin"
  ) {
    throw new Error("Not authorized");
  }

  await Course.findByIdAndDelete(id);

  cache.flushAll();
};
