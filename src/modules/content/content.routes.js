import express from "express";
import upload from "../../middlewares/upload.middleware.js";
import { upload as uploadContent, getContentByCourse, deleteContent, saveRecord } from "./content.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.get("/:courseId", authenticate, getContentByCourse);
// Direct browser→Cloudinary upload: just save the record
router.post("/:courseId/save-record", authenticate, authorize("teacher", "admin"), saveRecord);
// Traditional server upload (small files / PDFs)
router.post("/:courseId", authenticate, authorize("teacher"), upload.single("file"), uploadContent);
router.delete("/:contentId", authenticate, authorize("teacher", "admin"), deleteContent);

export default router;
