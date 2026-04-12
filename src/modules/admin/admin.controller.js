import { getDashboardStats, getPendingCourses, approveCourse, rejectCourse,
  getAllUsers, deleteUser, getAllCoursesAdmin, deleteCourseAdmin,
  getPendingContent, approveContent, rejectContent,
  adminSendOtp, adminVerifyOtp, getAnalytics } from "./admin.service.js";

export const analytics = async (req, res, next) => {
  try { res.json(await getAnalytics()); } catch (err) { next(err); }
};

export const dashboard = async (req, res, next) => {
  try { res.json(await getDashboardStats()); } catch (err) { next(err); }
};

export const pendingCourses = async (req, res, next) => {
  try { res.json(await getPendingCourses()); } catch (err) { next(err); }
};

export const approveCourseCtrl = async (req, res, next) => {
  try { const course = await approveCourse(req.params.courseId); res.json({ message: "Course approved", course }); } catch (err) { next(err); }
};

export const rejectCourseCtrl = async (req, res, next) => {
  try {
    const course = await rejectCourse(req.params.courseId, req.body.reason || "");
    res.json({ message: "Course rejected", course });
  } catch (err) { next(err); }
};

export const listUsers = async (req, res, next) => {
  try { res.json(await getAllUsers()); } catch (err) { next(err); }
};

export const removeUser = async (req, res, next) => {
  try { await deleteUser(req.params.userId); res.json({ message: "User deleted" }); } catch (err) { next(err); }
};

export const listAllCourses = async (req, res, next) => {
  try { res.json(await getAllCoursesAdmin()); } catch (err) { next(err); }
};

export const removeCourse = async (req, res, next) => {
  try { await deleteCourseAdmin(req.params.courseId); res.json({ message: "Course deleted" }); } catch (err) { next(err); }
};

export const pendingContent = async (req, res, next) => {
  try { res.json(await getPendingContent()); } catch (err) { next(err); }
};

export const approveContentCtrl = async (req, res, next) => {
  try { const content = await approveContent(req.params.contentId); res.json({ message: "Content approved", content }); } catch (err) { next(err); }
};

export const rejectContentCtrl = async (req, res, next) => {
  try { const content = await rejectContent(req.params.contentId, req.body.reason); res.json({ message: "Content rejected", content }); } catch (err) { next(err); }
};

export const adminSendOtpCtrl = async (req, res, next) => {
  try { res.json(await adminSendOtp(req.body.email)); } catch (err) { next(err); }
};

export const adminVerifyOtpCtrl = async (req, res, next) => {
  try { res.json(await adminVerifyOtp(req.body.email, req.body.otp)); } catch (err) { next(err); }
};

// re-export with the names the router expects
export { adminSendOtpCtrl as adminSendOtp, adminVerifyOtpCtrl as adminVerifyOtp };
