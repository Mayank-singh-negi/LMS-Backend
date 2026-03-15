import express from "express";
import {
  dashboard, pendingCourses, approveCourseCtrl, rejectCourseCtrl,
  listUsers, removeUser, listAllCourses, removeCourse,
  pendingContent, approveContentCtrl, rejectContentCtrl,
} from "./admin.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = express.Router();
const guard = [authenticate, authorize("admin")];

router.get("/dashboard",        ...guard, dashboard);
router.get("/pending-courses",  ...guard, pendingCourses);
router.put("/approve/:courseId",...guard, approveCourseCtrl);
router.put("/reject/:courseId", ...guard, rejectCourseCtrl);

// User management
router.get("/users",            ...guard, listUsers);
router.delete("/users/:userId", ...guard, removeUser);

// Course management
router.get("/courses",              ...guard, listAllCourses);
router.delete("/courses/:courseId", ...guard, removeCourse);

// Content approval
router.get("/pending-content",                  ...guard, pendingContent);
router.put("/content/approve/:contentId",       ...guard, approveContentCtrl);
router.put("/content/reject/:contentId",        ...guard, rejectContentCtrl);

export default router;
