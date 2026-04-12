import mongoose from "mongoose";
import Review from "./review.model.js";
import Enrollment from "../enrollments/enrollment.model.js";
import Course from "../courses/course.model.js";

// CREATE REVIEW
export const createReview = async (courseId, studentId, data) => {
  const enrollment = await Enrollment.findOne({
    course: new mongoose.Types.ObjectId(courseId),
    student: new mongoose.Types.ObjectId(studentId),
  });

  if (!enrollment) {
    throw new Error("You must enroll in the course to review");
  }

  const existingReview = await Review.findOne({ course: courseId, student: studentId });
  if (existingReview) {
    throw new Error("You already reviewed this course");
  }

  const review = await Review.create({
    course: courseId,
    student: studentId,
    rating: data.rating,
    comment: data.comment,
  });

  await updateAverageRating(courseId);
  return review;
};

// UPDATE REVIEW
export const updateReview = async (reviewId, studentId, data) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new Error("Review not found");
  if (review.student.toString() !== studentId.toString()) throw new Error("Not authorized");

  review.rating = data.rating ?? review.rating;
  review.comment = data.comment ?? review.comment;
  await review.save();
  await updateAverageRating(review.course);
  return review;
};

// DELETE REVIEW
export const deleteReview = async (reviewId, studentId) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new Error("Review not found");
  if (review.student.toString() !== studentId.toString()) throw new Error("Not authorized");
  await Review.findByIdAndDelete(reviewId);
  await updateAverageRating(review.course);
};

// GET REVIEWS BY COURSE
export const getReviewsByCourse = async (courseId) => {
  return await Review.find({ course: courseId })
    .populate("student", "name avatar")
    .sort({ createdAt: -1 });
};

// GET STUDENT'S OWN REVIEWS
export const getMyReviews = async (studentId) => {
  return await Review.find({ student: studentId })
    .populate("course", "title thumbnail")
    .sort({ createdAt: -1 });
};

// HELPER: UPDATE AVERAGE RATING
const updateAverageRating = async (courseId) => {
  const stats = await Review.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    { $group: { _id: "$course", avgRating: { $avg: "$rating" } } },
  ]);
  await Course.findByIdAndUpdate(courseId, {
    averageRating: stats[0]?.avgRating || 0,
  });
};
