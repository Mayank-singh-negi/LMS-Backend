import express from "express";
import { generate, verify, myCertificates } from "./certificate.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/my", authenticate, myCertificates);
router.post("/:courseId", authenticate, generate);
router.get("/verify/:certificateId", verify);

export default router;
