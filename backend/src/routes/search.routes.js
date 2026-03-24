import { Router } from "express";
import { query } from "express-validator";
import authenticate from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { search, getSimilar } from "../controllers/search.controller.js";

const router = Router();

// ─── Validation ─────────────────────────────────────────────────────────────

const searchRules = [
  query("q")
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 500 })
    .withMessage("Query must be 2-500 characters"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .toInt()
    .withMessage("Limit must be 1-50"),
  query("mode")
    .optional()
    .isIn(["hybrid", "semantic", "text"])
    .withMessage("Mode must be hybrid, semantic or text"),
  query("type")
    .optional()
    .isIn(["article", "tweet", "youtube", "pdf", "image", "note"])
    .withMessage("Invalid type filter"),
];

// ─── Routes ─────────────────────────────────────────────────────────────────

router.use(authenticate);

// GET /api/search?q=javascript&mode=hybrid&type=article&limit=10
router.get("/", searchRules, validate, search);

// GET /api/search/similar/:itemId
router.get("/similar/:itemId", getSimilar);

export default router;