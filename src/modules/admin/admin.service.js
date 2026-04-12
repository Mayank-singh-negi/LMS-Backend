import User from "../users/user.model.js";
import Course from "../courses/course.model.js";
import Enrollment from "../enrollments/enrollment.model.js";
import Content from "../content/content.model.js";
import cache from "../../utils/cache.js";
import { sendCourseApprovedEmail, sendCourseRejectedEmail } from "../../config/email.js";

export const getDashboardStats = async () => {
  const totalUsers = await User.countDocuments({ isDeleted: false });
  const totalStudents = await User.countDocuments({ role: "student" });
  const totalTeachers = await User.countDocuments({ role: "teacher" });

  const totalCourses = await Course.countDocuments({ isDeleted: false });
  const publishedCourses = await Course.countDocuments({
    isPublished: true,
    isDeleted: false,
  });

  const totalEnrollments = await Enrollment.countDocuments();
  const pendingContent = await Content.countDocuments({ approvalStatus: "pending" });

  const averageCompletion = await Enrollment.aggregate([
    { $group: { _id: null, avgProgress: { $avg: "$progress" } } },
  ]);

  return {
    totalUsers, totalStudents, totalTeachers,
    totalCourses, publishedCourses, totalEnrollments, pendingContent,
    averageCompletion: averageCompletion[0]?.avgProgress || 0,
  };
};

// ADMIN: fetch pending courses (with teacher info)
export const getPendingCourses = async () => {
  return await Course.find({ status: "pending" })
    .populate("teacher", "name email")
    .sort({ createdAt: -1 });
};

// ADMIN: approve a course — sends email to teacher
export const approveCourse = async (courseId) => {
  const course = await Course.findById(courseId).populate("teacher", "name email");
  if (!course) throw new Error("Course not found");
  if (course.status === "approved") throw new Error("Course is already approved");

  course.status = "approved";
  await course.save();

  // Fire email — non-blocking, don't let email failure break the response
  if (course.teacher?.email) {
    sendCourseApprovedEmail(
      course.teacher.email,
      course.teacher.name,
      course.title
    ).catch(err => console.error("Approval email failed:", err.message));
  }

  return course;
};

// ADMIN: reject a course — sends email to teacher with optional reason
export const rejectCourse = async (courseId, reason = "") => {
  const course = await Course.findById(courseId).populate("teacher", "name email");
  if (!course) throw new Error("Course not found");

  course.status = "rejected";
  await course.save();

  if (course.teacher?.email) {
    sendCourseRejectedEmail(
      course.teacher.email,
      course.teacher.name,
      course.title,
      reason
    ).catch(err => console.error("Rejection email failed:", err.message));
  }

  return course;
};

// ADMIN: list all users
export const getAllUsers = async () => {
  return await User.find({}).select("-password -refreshToken").sort({ createdAt: -1 });
};

// ADMIN: delete a user
export const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  await User.findByIdAndDelete(userId);
};

// ADMIN: list ALL courses (all statuses)
export const getAllCoursesAdmin = async () => {
  return await Course.find({}).populate("teacher", "name email").sort({ createdAt: -1 });
};

// ADMIN: force delete any course — also cleans up enrollments and content
export const deleteCourseAdmin = async (courseId) => {
  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");
  await Enrollment.deleteMany({ course: courseId });
  await Content.deleteMany({ course: courseId });
  await Course.findByIdAndDelete(courseId);
  cache.flushAll();
};

// ADMIN: get all pending content
export const getPendingContent = async () => {
  return await Content.find({ approvalStatus: "pending" })
    .populate({ path: "course", select: "title", populate: { path: "teacher", select: "name email" } })
    .sort({ createdAt: -1 });
};

// ADMIN: approve content
export const approveContent = async (contentId) => {
  const content = await Content.findById(contentId);
  if (!content) throw new Error("Content not found");
  content.approvalStatus = "approved";
  content.rejectionReason = "";
  await content.save();
  return content;
};

// ADMIN: reject content
export const rejectContent = async (contentId, reason = "") => {
  const content = await Content.findById(contentId);
  if (!content) throw new Error("Content not found");
  content.approvalStatus = "rejected";
  content.rejectionReason = reason;
  await content.save();
  return content;
};

// ── Admin OTP Login ──────────────────────────────────────────────────────────
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendAdminOTPEmail } from "../../config/email.js";

const OTP_EXPIRY_MS   = 5 * 60 * 1000;   // 5 minutes
const OTP_RATE_LIMIT  = 5;               // max requests per window
const OTP_RATE_WINDOW = 60 * 60 * 1000; // 1 hour window

export const adminSendOtp = async (email) => {
  if (!email) throw new Error("Email is required");

  const admin = await User.findOne({ email, role: "admin" });
  if (!admin) throw new Error("No admin account found with this email");

  // Rate limiting — max 5 OTPs per hour
  const now = Date.now();
  const windowStart = new Date(now - OTP_RATE_WINDOW);
  if (admin.otpResendResetAt && admin.otpResendResetAt > windowStart) {
    if ((admin.otpResendCount || 0) >= OTP_RATE_LIMIT) {
      throw new Error("Too many OTP requests. Please wait before trying again.");
    }
  } else {
    // Reset window
    admin.otpResendCount = 0;
    admin.otpResendResetAt = new Date(now);
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);

  admin.otp = hashedOtp;
  admin.otpExpiry = new Date(now + OTP_EXPIRY_MS);
  admin.otpResendCount = (admin.otpResendCount || 0) + 1;
  await admin.save();

  await sendAdminOTPEmail(admin.email, admin.name, otp);
  return { message: "OTP sent to your admin email" };
};

export const adminVerifyOtp = async (email, otp) => {
  if (!email || !otp) throw new Error("Email and OTP are required");

  const admin = await User.findOne({ email, role: "admin" });
  if (!admin) throw new Error("No admin account found with this email");

  if (!admin.otp || !admin.otpExpiry) {
    throw new Error("No OTP requested. Please request a new one.");
  }

  if (admin.otpExpiry < new Date()) {
    admin.otp = null;
    admin.otpExpiry = null;
    await admin.save();
    throw new Error("OTP has expired. Please request a new one.");
  }

  const isMatch = await bcrypt.compare(otp.trim(), admin.otp);
  if (!isMatch) throw new Error("Invalid OTP. Please check and try again.");

  // Clear OTP immediately after successful verification
  admin.otp = null;
  admin.otpExpiry = null;
  admin.otpResendCount = 0;

  // Issue tokens
  const accessToken = jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { id: admin._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  admin.refreshToken = refreshToken;
  await admin.save();

  return { accessToken, refreshToken };
};

// ── Analytics ────────────────────────────────────────────────────────────────
export const getAnalytics = async () => {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleString("default", { month: "short" }), year: d.getFullYear(), month: d.getMonth() };
  });

  const [enrollmentsByMonth, coursesByMonth, usersByRole] = await Promise.all([
    Enrollment.aggregate([
      { $match: { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
    ]),
    Course.aggregate([
      { $match: { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
  ]);

  const enrollMap = Object.fromEntries(enrollmentsByMonth.map(e => [`${e._id.year}-${e._id.month}`, e.count]));
  const courseMap = Object.fromEntries(coursesByMonth.map(e => [`${e._id.year}-${e._id.month}`, e.count]));

  const chartData = months.map(m => ({
    month: m.label,
    enrollments: enrollMap[`${m.year}-${m.month + 1}`] || 0,
    courses: courseMap[`${m.year}-${m.month + 1}`] || 0,
  }));

  const roleData = [
    { name: "Students", value: usersByRole.find(r => r._id === "student")?.count || 0, color: "#6366f1" },
    { name: "Teachers", value: usersByRole.find(r => r._id === "teacher")?.count || 0, color: "#f59e0b" },
    { name: "Admins",   value: usersByRole.find(r => r._id === "admin")?.count || 0,   color: "#ef4444" },
  ];

  return { chartData, roleData };
};
