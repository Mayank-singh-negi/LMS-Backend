import { uploadContent } from "./content.service.js";

export const upload = async (req, res, next) => {
  try {
    const content = await uploadContent(
      req.file,
      req.params.courseId,
      req.body.title,
      req.user
    );

    res.status(201).json(content);
  } catch (err) {
    next(err);
  }
};
