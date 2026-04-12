import express from "express";
import {
  register, login, refresh, logout, me, updateProfile,
  sendOtp, verifyOtp, googleAuthHandler, changePasswordHandler,
  forgotSendOtp, forgotVerifyOtp, forgotReset,
} from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import upload from "../../middlewares/upload.middleware.js";

const router = express.Router();

router.post("/google", googleAuthHandler);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);
router.patch("/profile", authenticate, upload.single("avatar"), updateProfile);
router.patch("/change-password", authenticate, changePasswordHandler);

// Forgot password (passwordless reset via OTP)
router.post("/forgot-password/send-otp",   forgotSendOtp);
router.post("/forgot-password/verify-otp", forgotVerifyOtp);
router.post("/forgot-password/reset",      forgotReset);

export default router;
