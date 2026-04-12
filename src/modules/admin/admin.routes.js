import express from "express";
import {
  dashboard, pendingCourses, approveCourseCtrl, rejectCourseCtrl,
  listUsers, removeUser, listAllCourses, removeCourse,
  pendingContent, approveContentCtrl, rejectContentCtrl,
  adminSendOtp, adminVerifyOtp, analytics,
} from "./admin.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = express.Router();
const guard = [authenticate, authorize("admin")];

// ── Passwordless OTP login (public) ──
router.post("/send-otp",   adminSendOtp);
router.post("/verify-otp", adminVerifyOtp);

// ── Protected admin routes ──
router.get("/dashboard",        ...guard, dashboard);
router.get("/analytics",        ...guard, analytics);
router.get("/pending-courses",  ...guard, pendingCourses);
router.put("/approve/:courseId",...guard, approveCourseCtrl);
router.put("/reject/:courseId", ...guard, rejectCourseCtrl);

router.get("/users",            ...guard, listUsers);
router.delete("/users/:userId", ...guard, removeUser);

router.get("/courses",              ...guard, listAllCourses);
router.delete("/courses/:courseId", ...guard, removeCourse);

router.get("/pending-content",                  ...guard, pendingContent);
router.put("/content/approve/:contentId",       ...guard, approveContentCtrl);
router.put("/content/reject/:contentId",        ...guard, rejectContentCtrl);

export default router;
