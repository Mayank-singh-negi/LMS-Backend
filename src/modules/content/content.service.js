import cloudinary from "../../config/cloudinary.js";
import Content from "./content.model.js";
import Course from "../courses/course.model.js";

export const uploadContent = async (file, courseId, title, user, moduleId) => {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");
  if (course.teacher.toString() !== user._id.toString() && user.role !== "admin") {
    throw new Error("Not authorized");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      async (error, result) => {
        if (error) return reject(error);
        const count = await Content.countDocuments({ course: courseId });
        const content = await Content.create({
          course: courseId,
          module: moduleId || null,
          title,
          type: result.resource_type === "video" ? "video" : "pdf",
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
