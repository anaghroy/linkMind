import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/auth.model.js";
import { redisClient } from "../config/redis.js";
import crypto from "crypto";
import { sendVerificationEmail } from "./mail.service.js";

export const registerUser = async (data) => {
  const { username, email, password } = data;

  const existing = await User.findOne({ email });
  if (existing) throw new Error("User already exists");

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password: hashed,
  });

  const token = crypto.randomBytes(32).toString("hex");
  user.verificationToken = token;
  user.verificationTokenExpires = Date.now() + 1000 * 60 * 60;
  await user.save();

  await sendVerificationEmail(email, token);

  return user;
};

export const loginUser = async (data) => {
  const { email, password } = data;

  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return { user, token };
};

// Get current user
export const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const logoutUser = async (token) => {
  const decoded = jwt.decode(token);

  const exp = decoded.exp;
  const now = Math.floor(Date.now() / 1000);

  const ttl = exp - now;

  if (ttl > 0) {
    await redisClient.set(`bl_${token}`, "blacklisted", "EX", ttl);
  }
  return { message: "Logged out successfully" };
};
