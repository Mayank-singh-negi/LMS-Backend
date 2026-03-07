import express from "express";
import upload from "../../middlewares/upload.middleware.js";
import { upload as uploadContent } from "./content.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.post(
  "/:courseId",
  authenticate,
  authorize("teacher"),
  upload.single("file"),
  uploadContent
);

export default router;
