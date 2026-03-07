import express from "express";
import { generate } from "./mocktest.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.post(
  "/:courseId",
  authenticate,
  authorize("teacher"),
  generate
);

export default router;
