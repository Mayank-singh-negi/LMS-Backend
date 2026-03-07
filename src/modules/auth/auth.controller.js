import * as authService from "./auth.service.js";

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
