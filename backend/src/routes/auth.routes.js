import express from "express";
import {
  register,
  login,
  getMe,
  logout,
  verifyEmail,
  updateProfile,
  resendVerificationEmail,
} from "../controllers/auth.controller.js";
import rateLimit from "express-rate-limit";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();
const resendLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: "Too many requests, try later",
});

router.post("/register", register);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);
router.patch("/me", auth, updateProfile);
router.post("/resend-verification", resendLimit, resendVerificationEmail);
router.get("/me", auth, getMe);
router.post("/logout", auth, logout);

export default router;
