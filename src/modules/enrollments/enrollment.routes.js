import express from "express";
import {
  enroll,
  myEnrollments,
  update,
  courseStudents,
} from "./enrollment.controller.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.get("/me", authenticate, myEnrollments);
router.get("/course/:courseId/students", authenticate, authorize("teacher", "admin"), courseStudents);
router.post("/:courseId", authenticate, enroll);
router.patch("/:id/progress", authenticate, update);

export default router;
