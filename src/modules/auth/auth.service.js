import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../users/user.model.js";

// Generate Access Token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

// Generate Refresh Token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

// REGISTER
export const registerUser = async (data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await User.create({
    ...data,
    password: hashedPassword,
  });

  return user;
};

// LOGIN
export const loginUser = async (data) => {
  const user = await User.findOne({ email: data.email });

  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(data.password, user.password);

  if (!isMatch) throw new Error("Invalid credentials");

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
};

// REFRESH ACCESS TOKEN
export const refreshAccessToken = async (token) => {
  if (!token) throw new Error("No refresh token provided");

  const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

  const user = await User.findById(payload.id);

  if (!user || user.refreshToken !== token) {
    throw new Error("Invalid refresh token");
  }

  const newAccessToken = generateAccessToken(user);

  return { accessToken: newAccessToken };
};

// LOGOUT
export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};
