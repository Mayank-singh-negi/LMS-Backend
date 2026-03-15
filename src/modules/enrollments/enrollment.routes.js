import express from "express";
import {
  enroll,
  myEnrollments,
  update,
} from "./enrollment.controller.js";

import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/me", authenticate, myEnrollments);
router.post("/:courseId", authenticate, enroll);
router.patch("/:id/progress", authenticate, update);

export default router;
