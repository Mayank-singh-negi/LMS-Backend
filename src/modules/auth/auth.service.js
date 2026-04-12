import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../users/user.model.js";
import { sendOTPEmail, sendPasswordResetOTPEmail } from "../../config/email.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "2h",
  });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

// SEND OTP (registration)
export const sendOtp = async ({ name, email }) => {
  if (!email) throw new Error("Email is required");

  const existing = await User.findOne({ email, isVerified: true });
  if (existing) throw new Error("Email already registered");

  const current = await User.findOne({ email, isVerified: false });
  if (current) {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (current.otpResendResetAt && current.otpResendResetAt > hourAgo && current.otpResendCount >= 5) {
      throw new Error("Too many OTP requests. Please try again later.");
    }
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const now = new Date();

  await User.findOneAndUpdate(
    { email, isVerified: false },
    {
      $set: {
        name: name || "",
        otp: hashedOtp,
        otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
        otpResendResetAt: current?.otpResendResetAt || now,
      },
      $inc: { otpResendCount: 1 },
      $setOnInsert: { email, isVerified: false },
    },
    { upsert: true, new: true }
  );

  await sendOTPEmail(email, otp);
  return { message: "OTP sent successfully" };
};

// VERIFY OTP (registration)
export const verifyOtp = async ({ email, otp }) => {
  if (!email || !otp) throw new Error("Email and OTP are required");

  const user = await User.findOne({ email, isVerified: false });
  if (!user) throw new Error("No pending verification for this email");
  if (!user.otpExpiry || user.otpExpiry < new Date()) throw new Error("OTP has expired. Please request a new one.");

  const isMatch = await bcrypt.compare(otp, user.otp);
  if (!isMatch) throw new Error("Invalid OTP");

  user.otp = null;
  user.otpExpiry = null;
  await user.save();

  return { message: "Email verified successfully", email };
};

// REGISTER (after OTP verified)
export const registerUser = async ({ name, email, password, role }) => {
  const user = await User.findOne({ email, isVerified: false });
  if (!user) {
    const verified = await User.findOne({ email, isVerified: true });
    if (verified) throw new Error("User already exists");
    throw new Error("Please verify your email first");
  }
  if (user.otp !== null) throw new Error("Please verify your email OTP first");

  user.name = name || user.name;
  user.password = await bcrypt.hash(password, 10);
  user.role = role || "student";
  user.isVerified = true;
  user.otpResendCount = 0;
  await user.save();

  return { id: user._id, name: user.name, email: user.email, role: user.role };
};

// GOOGLE AUTH
export const googleAuth = async ({ credential }) => {
  if (!credential) throw new Error("Google credential is required");

  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${credential}` },
  });
  if (!userInfoRes.ok) throw new Error("Failed to verify Google token");

  const { email, name, picture, sub: googleId } = await userInfoRes.json();
  if (!email) throw new Error("Could not get email from Google");

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ name, email, password: null, avatar: picture || "", isVerified: true, provider: "google", googleId });
  } else if (!user.googleId) {
    user.googleId = googleId;
    user.provider = "google";
    user.isVerified = true;
    if (!user.avatar) user.avatar = picture || "";
    await user.save();
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
};

// LOGIN
export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  // ── Streak logic ──
  const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  if (user.lastLoginDate !== todayStr) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    user.streak = user.lastLoginDate === yesterdayStr ? (user.streak || 0) + 1 : 1;
    user.lastLoginDate = todayStr;
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
};

// REFRESH TOKEN
export const refreshAccessToken = async (token) => {
  if (!token) throw new Error("No refresh token provided");

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new Error("Invalid or expired refresh token");
  }

  const user = await User.findById(payload.id).select("-password");
  if (!user) throw new Error("User not found");

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  user.refreshToken = newRefreshToken;
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

// LOGOUT
export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

// CHANGE PASSWORD
export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  if (!user.password) throw new Error("This account uses Google sign-in. Password change not available.");

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new Error("Current password is incorrect");
  if (newPassword.length < 8) throw new Error("New password must be at least 8 characters");

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return { message: "Password changed successfully" };
};

// FORGOT PASSWORD — Send OTP
export const forgotPasswordSendOtp = async ({ email }) => {
  if (!email) throw new Error("Email is required");

  const user = await User.findOne({ email, isVerified: true });
  if (!user) throw new Error("No account found with this email address");

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (user.otpResendResetAt && user.otpResendResetAt > hourAgo && (user.otpResendCount || 0) >= 5) {
    throw new Error("Too many OTP requests. Please try again in an hour.");
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const now = new Date();

  user.otp = hashedOtp;
  user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
  user.otpResendCount = (user.otpResendResetAt && user.otpResendResetAt > hourAgo) ? (user.otpResendCount || 0) + 1 : 1;
  user.otpResendResetAt = (user.otpResendResetAt && user.otpResendResetAt > hourAgo) ? user.otpResendResetAt : now;
  await user.save();

  await sendPasswordResetOTPEmail(email, user.name, otp);
  return { message: "OTP sent to your email" };
};

// FORGOT PASSWORD — Verify OTP
export const forgotPasswordVerifyOtp = async ({ email, otp }) => {
  if (!email || !otp) throw new Error("Email and OTP are required");

  const user = await User.findOne({ email, isVerified: true });
  if (!user) throw new Error("No account found with this email");
  if (!user.otp || !user.otpExpiry) throw new Error("No OTP requested. Please request a new one.");
  if (user.otpExpiry < new Date()) {
    user.otp = null; user.otpExpiry = null; await user.save();
    throw new Error("OTP has expired. Please request a new one.");
  }

  const isMatch = await bcrypt.compare(otp.trim(), user.otp);
  if (!isMatch) throw new Error("Invalid OTP. Please check and try again.");

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = await bcrypt.hash(resetToken, 10);
  user.otp = null;
  user.otpExpiry = null;
  user.passwordResetToken = hashedToken;
  user.passwordResetExpiry = new Date(Date.now() + 10 * 60 * 1000);
  user.otpResendCount = 0;
  await user.save();

  return { message: "OTP verified", resetToken };
};

// FORGOT PASSWORD — Reset password
export const forgotPasswordReset = async ({ email, resetToken, newPassword }) => {
  if (!email || !resetToken || !newPassword) throw new Error("All fields are required");
  if (newPassword.length < 6) throw new Error("Password must be at least 6 characters");

  const user = await User.findOne({ email, isVerified: true });
  if (!user) throw new Error("No account found with this email");
  if (!user.passwordResetToken || !user.passwordResetExpiry) throw new Error("No password reset in progress. Please start over.");
  if (user.passwordResetExpiry < new Date()) {
    user.passwordResetToken = null; user.passwordResetExpiry = null; await user.save();
    throw new Error("Reset session expired. Please start over.");
  }

  const isMatch = await bcrypt.compare(resetToken, user.passwordResetToken);
  if (!isMatch) throw new Error("Invalid reset token. Please start over.");

  user.password = await bcrypt.hash(newPassword, 10);
  user.passwordResetToken = null;
  user.passwordResetExpiry = null;
  user.refreshToken = null;
  await user.save();

  return { message: "Password reset successfully" };
};
