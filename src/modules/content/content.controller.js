import { uploadContent, saveContentRecord } from "./content.service.js";
import Content from "./content.model.js";
import Enrollment from "../enrollments/enrollment.model.js";
import Course from "../courses/course.model.js";
import { sendLiveClassEmail } from "../../config/email.js";

export const upload = async (req, res, next) => {
  try {
    const content = await uploadContent(req.file, req.params.courseId, req.body.title, req.user, req.body.moduleId);
    res.status(201).json(content);
  } catch (err) { next(err); }
};

export const saveRecord = async (req, res, next) => {
  try {
    const { title, url, publicId, resourceType, moduleId, duration } = req.body;
    const content = await saveContentRecord(
      { courseId: req.params.courseId, title, url, publicId, resourceType, moduleId, duration },
      req.user
    );
    res.status(201).json(content);
  } catch (err) { next(err); }
};

export const getContentByCourse = async (req, res, next) => {
  try {
    const role = req.user?.role;
    const filter = { course: req.params.courseId };
    if (role === "student") filter.approvalStatus = "approved";
    const contents = await Content.find(filter).sort({ order: 1, createdAt: 1 });
    res.json(contents);
  } catch (err) { next(err); }
};

export const updateLesson = async (req, res, next) => {
  try {
    const content = await Content.findById(req.params.contentId);
    if (!content) return res.status(404).json({ message: "Content not found" });
    const { title, moduleId, order, duration } = req.body;
    if (title !== undefined) content.title = title;
    if (moduleId !== undefined) content.module = moduleId || null;
    if (order !== undefined) content.order = order;
    if (duration !== undefined) content.duration = duration;
    await content.save();
    res.json(content);
  } catch (err) { next(err); }
};

export const startLiveClass = async (req, res, next) => {
  try {
    const { title, liveLink, moduleId } = req.body;
    if (!liveLink) return res.status(400).json({ message: "liveLink is required" });

    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const count = await Content.countDocuments({ course: req.params.courseId });
    const content = await Content.create({
      course: req.params.courseId,
      module: moduleId || null,
      title: title || "Live Class",
      type: "live",
      url: liveLink,
      liveLink,
      liveStartedAt: new Date(),
      order: count,
      approvalStatus: "approved",
    });

    // Email all enrolled students
    const enrollments = await Enrollment.find({ course: req.params.courseId })
      .populate("student", "name email");

    const emailPromises = enrollments
      .filter(e => e.student?.email)
      .map(e => sendLiveClassEmail(e.student.email, e.student.name, course.title, liveLink)
        .catch(err => console.error("Live email failed:", err.message))
      );
    await Promise.allSettled(emailPromises);

    res.status(201).json({ content, notified: enrollments.length });
  } catch (err) { next(err); }
};

export const deleteContent = async (req, res, next) => {
  try {
    const content = await Content.findById(req.params.contentId);
    if (!content) return res.status(404).json({ message: "Content not found" });

    const course = await Course.findById(content.course);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.teacher.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (content.publicId && content.type !== "live") {
      const cloudinary = (await import("../../config/cloudinary.js")).default;
      await cloudinary.uploader.destroy(content.publicId, { resource_type: "auto" }).catch(() => {});
    }

    await content.deleteOne();
    res.json({ message: "Content deleted" });
  } catch (err) { next(err); }
};
