import * as authService from "./auth.service.js";
import cloudinary from "../../config/cloudinary.js";
import User from "../users/user.model.js";

export const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const tokens = await authService.loginUser(req.body);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const token = await authService.refreshAccessToken(refreshToken);
    res.json(token);
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logoutUser(req.user._id);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar || "",
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // update name if provided
    if (req.body.name && req.body.name.trim()) {
      user.name = req.body.name.trim();
    }

    // upload avatar if file provided
    if (req.file) {
      // delete old avatar from cloudinary
      if (user.avatarPublicId) {
        await cloudinary.uploader.destroy(user.avatarPublicId).catch(() => {});
      }
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "image", folder: "avatars", transformation: [{ width: 200, height: 200, crop: "fill" }] },
          (err, res) => err ? reject(err) : resolve(res)
        );
        stream.end(req.file.buffer);
      });
      user.avatar = result.secure_url;
      user.avatarPublicId = result.public_id;
    }

    await user.save();
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar || "" });
  } catch (err) {
    next(err);
  }
};
