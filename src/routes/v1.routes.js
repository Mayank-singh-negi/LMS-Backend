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

const router = express.Router();

// Auth routes
router.use("/auth", authRoutes);

// Course and learning content routes
router.use("/courses", courseRoutes);
router.use("/content", contentRoutes);
router.use("/enrollments", enrollmentRoutes);

// Review and testing routes
router.use("/reviews", reviewRoutes);
router.use("/mocktests", mockTestRoutes);
router.use("/testresults", testResultRoutes);

// Certificate routes
router.use("/certificates", certificateRoutes);

// Admin routes
router.use("/admin", adminRoutes);

// AI features routes (doubt solver, quiz generator)
router.use("/ai", aiRoutes);

export default router;
