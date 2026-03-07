import express from "express";
import { generate, verify } from "./certificate.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/:courseId", authenticate, generate);
router.get("/verify/:certificateId", verify);

export default router;
