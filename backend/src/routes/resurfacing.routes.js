import { Router } from "express";
import { body, query } from "express-validator";
import authenticate from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  getResurfaced,
  markSeen,
  getStats,
} from "../controllers/resurfacing.controller.js";

const router = Router();

router.use(authenticate);

// GET /api/resurfacing?limit=5
router.get(
  "/",
  [query("limit").optional().isInt({ min: 1, max: 10 }).toInt()],
  validate,
  getResurfaced
);

// POST /api/resurfacing/seen
router.post(
  "/seen",
  [body("itemIds").isArray({ min: 1 }).withMessage("itemIds must be a non-empty array")],
  validate,
  markSeen
);

// GET /api/resurfacing/stats
router.get("/stats", getStats);

export default router;