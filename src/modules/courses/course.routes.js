import express from "express";
import {
  create,
  getAll,
  getById,
  update,
  remove,
  publish,
  submitForReview,
  myCourses,
  teacherDashboard,
} from "./course.controller.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";


const router = express.Router();

router.post("/", authenticate, create);
router.get("/", authenticate, getAll);

router.get("/:id", getById);
router.put("/:id", authenticate, update);
router.delete("/:id", authenticate, remove);
router.patch("/:id/publish", authenticate, publish);
router.patch("/:id/submit", authenticate, submitForReview); // teacher submits for admin review

router.get(
  "/my-courses",
  authenticate,
  myCourses // list creator's courses regardless of status
);

router.get(
  "/teacher/dashboard",
  authenticate,
  authorize("teacher"),
  teacherDashboard
);


export default router;
