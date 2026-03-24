import { Router } from "express";
import { body, query } from "express-validator";
import authenticate  from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  saveItem,
  getItems,
  getItem,
  getStats,
  updateItem,
  deleteItem,
  markAsRead,
  addHighlight,
  removeHighlight,
} from "../controllers/item.controller.js";

const router = Router();

// ─── Validation Rules ───────────────────────────────────────────────────────

const saveItemRules = [
  body("url").optional().isURL({ require_protocol: true }).withMessage("Invalid URL"),
  body("title").optional().trim().isLength({ min: 1, max: 500 }).withMessage("Title too long"),
  body("type")
    .optional()
    .isIn(["article", "tweet", "youtube", "pdf", "image", "note"])
    .withMessage("Invalid item type"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*").optional().trim().isLength({ min: 1, max: 50 }).withMessage("Each tag must be 1-50 chars"),
  body("collections").optional().isArray().withMessage("Collections must be an array"),
  body("userNote").optional().trim().isLength({ max: 2000 }).withMessage("Note too long"),
];

const updateItemRules = [
  body("title").optional().trim().isLength({ min: 1, max: 500 }),
  body("description").optional().trim().isLength({ max: 2000 }),
  body("userNote").optional().trim().isLength({ max: 2000 }),
  body("tags").optional().isArray(),
  body("isFavorite").optional().isBoolean(),
  body("isArchived").optional().isBoolean(),
  body("collections").optional().isArray(),
];

const highlightRules = [
  body("text").notEmpty().trim().isLength({ min: 1, max: 5000 }).withMessage("Highlight text required"),
  body("note").optional().trim().isLength({ max: 1000 }),
  body("color")
    .optional()
    .isIn(["yellow", "green", "blue", "pink"])
    .withMessage("Invalid color"),
];

const getItemsRules = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("type").optional().isIn(["article", "tweet", "youtube", "pdf", "image", "note"]),
  query("sort").optional().isIn(["newest", "oldest", "recently_read", "title"]),
  query("isFavorite").optional().isBoolean().toBoolean(),
  query("isArchived").optional().isBoolean().toBoolean(),
];

// ─── Routes ─────────────────────────────────────────────────────────────────

router.use(authenticate);

// Stats — must be before /:id
router.get("/stats", getStats);

// CRUD
router.post("/", saveItemRules, validate, saveItem);
router.get("/", getItemsRules, validate, getItems);
router.get("/:id", getItem);
router.patch("/:id", updateItemRules, validate, updateItem);
router.delete("/:id", deleteItem);

// Actions
router.patch("/:id/read", markAsRead);

// Highlights
router.post("/:id/highlights", highlightRules, validate, addHighlight);
router.delete("/:id/highlights/:hid", removeHighlight);

export default router;