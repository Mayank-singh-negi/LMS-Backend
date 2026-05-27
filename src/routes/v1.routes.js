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

const router = express.Router();

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
