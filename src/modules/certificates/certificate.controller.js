import { generateCertificate, verifyCertificate, getStudentCertificates } from "./certificate.service.js";

export const generate = async (req, res, next) => {
  try {
    const cert = await generateCertificate(req.params.courseId, req.user._id);
    res.json(cert);
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

export const myCertificates = async (req, res, next) => {
  try {
    const certs = await getStudentCertificates(req.user._id);
    res.json(certs);
  } catch (err) {
    next(err);
  }
};
