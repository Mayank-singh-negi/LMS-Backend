import express from "express";
import {
  dashboard,
  pendingCourses,
  approveCourseCtrl,
  rejectCourseCtrl,
} from "./admin.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  authenticate,
  authorize("admin"),
  dashboard
);

router.get(
  "/pending-courses",
  authenticate,
  authorize("admin"),
  pendingCourses
);

router.put(
  "/approve/:courseId",
  authenticate,
  authorize("admin"),
  approveCourseCtrl
);

router.put(
  "/reject/:courseId",
  authenticate,
  authorize("admin"),
  rejectCourseCtrl
);

export default router;
