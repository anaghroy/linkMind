import jwt from "jsonwebtoken";
import User from "../models/auth.model.js";
import { redisClient } from "../config/redis.js";

const auth = async (req, res, next) => {
  try {
    const token =
      req.cookies.token || req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isBlacklisted = await redisClient.get(`bl_${token}`);

    if (isBlacklisted) {
      return res.status(401).json({
        message: "Token is invalid or expired",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default auth;
