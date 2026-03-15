import express from "express";
import { register, login, refresh, logout, me, updateProfile } from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import upload from "../../middlewares/upload.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);
router.patch("/profile", authenticate, upload.single("avatar"), updateProfile);

export default router;
