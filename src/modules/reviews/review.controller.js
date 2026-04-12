import * as reviewService from "./review.service.js";

export const create = async (req, res) => {
  try {
    const review = await reviewService.createReview(req.params.courseId, req.user._id, req.body);
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const review = await reviewService.updateReview(req.params.reviewId, req.user._id, req.body);
    res.json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    await reviewService.deleteReview(req.params.reviewId, req.user._id);
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getCourseReviews = async (req, res) => {
  try {
    const reviews = await reviewService.getReviewsByCourse(req.params.courseId);
    res.json(reviews);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getMyReviews = async (req, res) => {
  try {
    const reviews = await reviewService.getMyReviews(req.user._id);
    res.json(reviews);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
