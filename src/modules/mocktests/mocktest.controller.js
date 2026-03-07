import { generateMockTest } from "./mocktest.service.js";

export const generate = async (req, res, next) => {
  try {
    const { title } = req.body;
    const mockTest = await generateMockTest(
      req.params.courseId,
      title
    );

    res.status(201).json(mockTest);
  } catch (err) {
    next(err);
  }
};
