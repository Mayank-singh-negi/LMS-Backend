import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import Module from "./module.model.js";
import Course from "../courses/course.model.js";

const router = express.Router();

// GET all modules for a course (with lessons)
router.get("/:courseId", authenticate, async (req, res, next) => {
  try {
    const Content = (await import("../content/content.model.js")).default;
    const modules = await Module.find({ course: req.params.courseId }).sort({ order: 1 });
    const role = req.user?.role;
    const contentFilter = { course: req.params.courseId };
    if (role === "student") contentFilter.approvalStatus = "approved";

    const lessons = await Content.find(contentFilter).sort({ order: 1 });

    const result = modules.map(m => ({
      ...m.toObject(),
      lessons: lessons.filter(l => String(l.module) === String(m._id)),
    }));

    // Unassigned lessons (no module)
    const unassigned = lessons.filter(l => !l.module);
    res.json({ modules: result, unassigned });
  } catch (err) { next(err); }
});

// POST create module
router.post("/:courseId", authenticate, authorize("teacher", "admin"), async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (req.user.role !== "admin" && course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const count = await Module.countDocuments({ course: req.params.courseId });
    const module = await Module.create({
      course: req.params.courseId,
      title: req.body.title,
      order: count,
    });
    res.status(201).json(module);
  } catch (err) { next(err); }
});

// PUT update module title
router.put("/:moduleId", authenticate, authorize("teacher", "admin"), async (req, res, next) => {
  try {
    const module = await Module.findById(req.params.moduleId);
    if (!module) return res.status(404).json({ message: "Module not found" });
    module.title = req.body.title ?? module.title;
    await module.save();
    res.json(module);
  } catch (err) { next(err); }
});

// DELETE module
router.delete("/:moduleId", authenticate, authorize("teacher", "admin"), async (req, res, next) => {
  try {
    const Content = (await import("../content/content.model.js")).default;
    await Module.findByIdAndDelete(req.params.moduleId);
    // Unassign lessons from deleted module
    await Content.updateMany({ module: req.params.moduleId }, { $set: { module: null } });
    res.json({ message: "Module deleted" });
  } catch (err) { next(err); }
});

export default router;
