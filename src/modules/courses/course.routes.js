import express from "express";
import {
  create, getAll, getById, update, remove, publish,
  submitForReview, myCourses, teacherDashboard, updateThumbnail,
  courseAnalytics, teacherOverviewAnalytics,
} from "./course.controller.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.post("/", authenticate, create);
router.get("/", authenticate, getAll);

router.get("/my-courses", authenticate, myCourses);
router.get("/teacher/dashboard", authenticate, authorize("teacher"), teacherDashboard);
router.get("/teacher/overview-analytics", authenticate, authorize("teacher"), teacherOverviewAnalytics);

router.get("/:id", getById);
router.get("/:id/analytics", authenticate, authorize("teacher", "admin"), courseAnalytics);
router.put("/:id", authenticate, update);
router.delete("/:id", authenticate, remove);
router.patch("/:id/publish", authenticate, publish);
router.patch("/:id/submit", authenticate, submitForReview);
router.patch("/:id/thumbnail", authenticate, authorize("teacher", "admin"), updateThumbnail);


export default router;
