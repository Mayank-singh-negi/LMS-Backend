import express from "express";
import { submit, myResults } from "./testresult.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/:mockTestId", authenticate, submit);
router.get("/my-results", authenticate, myResults);

export default router;
