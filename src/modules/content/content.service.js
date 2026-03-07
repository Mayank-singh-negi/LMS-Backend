import cloudinary from "../../config/cloudinary.js";
import Content from "./content.model.js";
import Course from "../courses/course.model.js";

export const uploadContent = async (file, courseId, title, user) => {
  const course = await Course.findById(courseId);

  if (!course) throw new Error("Course not found");

  if (
    course.teacher.toString() !== user._id.toString() &&
    user.role !== "admin"
  ) {
    throw new Error("Not authorized");
  }

  const uploadResult = await cloudinary.uploader.upload_stream;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
      },
      async (error, result) => {
        if (error) return reject(error);

        const content = await Content.create({
          course: courseId,
          title,
          type: result.resource_type === "video" ? "video" : "pdf",
          url: result.secure_url,
          publicId: result.public_id,
        });

        resolve(content);
      }
    );

    stream.end(file.buffer);
  });
};
