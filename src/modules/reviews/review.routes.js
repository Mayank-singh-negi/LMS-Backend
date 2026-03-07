import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { create, update, remove, getCourseReviews } from "./review.controller.js";

const router = express.Router();

router.post("/:courseId", authenticate, authorize("student"), create);
router.put("/:reviewId", authenticate, authorize("student"), update);
router.delete("/:reviewId", authenticate, authorize("student"), remove);

router.get("/course/:courseId", getCourseReviews);

export default router;
