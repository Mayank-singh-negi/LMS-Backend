import express from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import courseRoutes from "../modules/courses/course.routes.js";
import enrollmentRoutes from "../modules/enrollments/enrollment.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";
import mockTestRoutes from "../modules/mocktests/mocktest.routes.js";
import testResultRoutes from "../modules/testresults/testresult.routes.js";
import certificateRoutes from "../modules/certificates/certificate.routes.js";
import contentRoutes from "../modules/content/content.routes.js";
import reviewRoutes from "../modules/reviews/review.routes.js";
import aiRoutes from "../modules/ai/ai.routes.js";
import moduleRoutes from "../modules/modules/module.routes.js";
import nodemailer from "nodemailer";

const router = express.Router();

// Temporary email test endpoint — remove after confirming email works
router.get("/test-email", async (req, res) => {
  const to = req.query.to || process.env.EMAIL_FROM;
  try {
    const { sendOTPEmail } = await import("../config/email.js");
    await sendOTPEmail(to, "123456");
    res.json({ success: true, message: `Email sent to ${to}`, brevo_key_set: !!process.env.BREVO_API_KEY });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, brevo_key_set: !!process.env.BREVO_API_KEY });
  }
});

router.use("/auth", authRoutes);
router.use("/courses", courseRoutes);
router.use("/content", contentRoutes);
router.use("/modules", moduleRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/reviews", reviewRoutes);
router.use("/mocktests", mockTestRoutes);
router.use("/testresults", testResultRoutes);
router.use("/certificates", certificateRoutes);
router.use("/admin", adminRoutes);
router.use("/ai", aiRoutes);

export default router;
