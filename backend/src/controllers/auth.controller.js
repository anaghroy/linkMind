import * as authService from "../services/auth.service.js";
import User from "../models/auth.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import crypto from "crypto";
import jwt from "jsonwebtoken"
import { sendVerificationEmail } from "../services/mail.service.js";
import { sendToken } from "../utils/cookie.js";
import { redisClient } from "../config/redis.js";

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  sendToken(user, res);
  res.status(201).json({
    success: true,
    message: "User registered successfully",
  });
});

export const login = asyncHandler(async (req, res) => {
    const data = await authService.loginUser(req.body);
  sendToken(data.user, res);
  res.json({
    success: true,
    message: "logged in successfully",
    user: data.user,
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;

  await user.save();

  res.json({
    success: true,
    message: "Email verified successfully",
  });
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: "Email already verified",
    });
  }

  const token = crypto.randomBytes(32).toString("hex");

  user.verificationToken = token;
  user.verificationTokenExpires = Date.now() + 1000 * 60 * 60;

  await user.save();

  await sendVerificationEmail(email, token);

  res.json({
    success: true,
    message: "Verification email resent successfully",
  });
});
// Get Current User
export const getMe = asyncHandler(async (req, res) => {
   const user = await authService.getMe(req.user.id);

  res.json({
    message: "User details fetched successfully",
    success: true,
    data: user,
  });
});

// Logout
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.token;

  if (token) {
    const decoded = jwt.decode(token);
    const ttl = decoded?.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) await redisClient.setEx(`bl_${token}`, ttl, "true");
  }

  res.clearCookie("token");

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});
