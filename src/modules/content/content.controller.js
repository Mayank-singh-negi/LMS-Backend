import { uploadContent, saveContentRecord } from "./content.service.js";
import Content from "./content.model.js";

export const upload = async (req, res, next) => {
  try {
    const content = await uploadContent(req.file, req.params.courseId, req.body.title, req.user);
    res.status(201).json(content);
  } catch (err) {
    next(err);
  }
};

// Called after browser uploads directly to Cloudinary
export const saveRecord = async (req, res, next) => {
  try {
    const { title, url, publicId, resourceType } = req.body;
    const content = await saveContentRecord(
      { courseId: req.params.courseId, title, url, publicId, resourceType },
      req.user
    );
    res.status(201).json(content);
  } catch (err) {
    next(err);
  }
};

export const getContentByCourse = async (req, res, next) => {
  try {
    const role = req.user?.role;
    // students only see approved content; teachers/admins see all
    const filter = { course: req.params.courseId };
    if (role === "student") filter.approvalStatus = "approved";
    const contents = await Content.find(filter).sort({ createdAt: 1 });
    res.json(contents);
  } catch (err) {
    next(err);
  }
};

export const deleteContent = async (req, res, next) => {
  try {
    const content = await Content.findById(req.params.contentId);
    if (!content) return res.status(404).json({ message: "Content not found" });

    // verify the requesting user owns the course
    const Course = (await import("../courses/course.model.js")).default;
    const course = await Course.findById(content.course);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.teacher.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // delete from cloudinary
    if (content.publicId) {
      const cloudinary = (await import("../../config/cloudinary.js")).default;
      await cloudinary.uploader.destroy(content.publicId, { resource_type: "auto" }).catch(() => {});
    }

    await content.deleteOne();
    res.json({ message: "Content deleted" });
  } catch (err) {
    next(err);
  }
};
