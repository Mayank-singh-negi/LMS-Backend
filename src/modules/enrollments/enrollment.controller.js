import { enrollCourse, getMyEnrollments } from "./enrollment.service.js";

export const enroll = async (req, res, next) => {
  try {
    const enrollment = await enrollCourse(req.params.courseId, req.user);
    res.status(201).json(enrollment);
  } catch (err) {
    next(err);
  }
};

export const myEnrollments = async (req, res, next) => {
  try {
    const enrollments = await getMyEnrollments(req.user);
    res.json(enrollments);
  } catch (err) {
    next(err);
  }
};
import { updateProgress } from "./enrollment.service.js";

export const update = async (req, res, next) => {
  try {
    const { progress } = req.body;

    const enrollment = await updateProgress(
      req.params.id,
      progress,
      req.user
    );

    res.json(enrollment);
  } catch (err) {
    next(err);
  }
};
