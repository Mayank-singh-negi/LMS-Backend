import cloudinary from "../../config/cloudinary.js";
import Content from "./content.model.js";
import Course from "../courses/course.model.js";

export const uploadContent = async (file, courseId, title, user, moduleId) => {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");
  if (course.teacher.toString() !== user._id.toString() && user.role !== "admin") {
    throw new Error("Not authorized");
  }

  // Detect if file is a PDF/PPT to use raw resource type
  const isPdf = file.mimetype === "application/pdf" ||
    file.originalname?.toLowerCase().endsWith(".pdf") ||
    file.originalname?.toLowerCase().endsWith(".ppt") ||
    file.originalname?.toLowerCase().endsWith(".pptx");

  const resourceType = isPdf ? "raw" : "auto";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType },
      async (error, result) => {
        if (error) return reject(error);

        // Determine content type
        let contentType = "pdf";
        if (result.resource_type === "video") contentType = "video";
        else if (result.resource_type === "raw") contentType = "pdf";

        const count = await Content.countDocuments({ course: courseId });
        const content = await Content.create({
          course: courseId,
          module: moduleId || null,
          title,
          type: contentType,
          url: result.secure_url,
          publicId: result.public_id,
          order: count,
        });
        resolve(content);
      }
    );
    stream.end(file.buffer);
  });
};

export const saveContentRecord = async ({ courseId, title, url, publicId, resourceType, moduleId, duration }, user) => {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");
  if (course.teacher.toString() !== user._id.toString() && user.role !== "admin") {
    throw new Error("Not authorized");
  }

  const count = await Content.countDocuments({ course: courseId });
  const type = resourceType === "video" ? "video" : resourceType === "raw" ? "pdf" : "pdf";

  const content = await Content.create({
    course: courseId,
    module: moduleId || null,
    title,
    type,
    url,
    publicId,
    duration: duration || 0,
    order: count,
  });

  return content;
};
