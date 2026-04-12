import express from "express";
import upload from "../../middlewares/upload.middleware.js";
import { upload as uploadContent, getContentByCourse, deleteContent, saveRecord, startLiveClass, updateLesson } from "./content.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.get("/:courseId", authenticate, getContentByCourse);
router.post("/:courseId/save-record", authenticate, authorize("teacher", "admin"), saveRecord);
router.post("/:courseId", authenticate, authorize("teacher"), upload.single("file"), uploadContent);
router.post("/:courseId/live", authenticate, authorize("teacher"), startLiveClass);
router.patch("/:contentId", authenticate, authorize("teacher", "admin"), updateLesson);
router.delete("/:contentId", authenticate, authorize("teacher", "admin"), deleteContent);

export default router;
