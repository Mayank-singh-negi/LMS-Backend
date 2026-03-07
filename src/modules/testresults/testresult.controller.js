import { submitTest } from "./testresult.service.js";

export const submit = async (req, res, next) => {
  try {
    const { answers } = req.body;

    const result = await submitTest(
      req.params.mockTestId,
      answers,
      req.user
    );

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};
import { getStudentResults } from "./testresult.service.js";

export const myResults = async (req, res, next) => {
  try {
    const results = await getStudentResults(req.user._id);
    res.json(results);
  } catch (err) {
    next(err);
  }
};


export const verify = async (req, res, next) => {
  try {
    const cert = await verifyCertificate(req.params.certificateId);
    res.json(cert);
  } catch (err) {
    next(err);
  }
};
