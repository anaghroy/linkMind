import { Router } from "express";
import { body } from "express-validator";
import authenticate from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createCollection,
  getCollections,
  getCollection,
  updateCollection,
  deleteCollection,
  addItem,
  removeItem,
  syncCount,
} from "../controllers/collection.controller.js";

const router = Router();

// ─── Validation Rules ───────────────────────────────────────────────────────

const createRules = [
  body("name")
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name is required and must be under 100 chars"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description too long"),
  body("color")
    .optional()
    .matches(/^#([A-Fa-f0-9]{6})$/)
    .withMessage("Color must be a valid hex code e.g. #6366f1"),
  body("icon")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Icon name too long"),
  body("parent")
    .optional()
    .isMongoId()
    .withMessage("Invalid parent collection ID"),
];

const updateRules = [
  body("name").optional().trim().isLength({ min: 1, max: 100 }),
  body("description").optional().trim().isLength({ max: 500 }),
  body("color")
    .optional()
    .matches(/^#([A-Fa-f0-9]{6})$/)
    .withMessage("Color must be a valid hex code"),
  body("icon").optional().trim().isLength({ max: 50 }),
  body("order").optional().isInt({ min: 0 }),
];

// ─── Routes ─────────────────────────────────────────────────────────────────

router.use(authenticate);

// Collections CRUD
router.post("/", createRules, validate, createCollection);
router.get("/", getCollections);
router.get("/:id", getCollection);
router.patch("/:id", updateRules, validate, updateCollection);
router.delete("/:id", deleteCollection);

// Item management inside collection
router.post("/:id/items/:itemId", addItem);
router.delete("/:id/items/:itemId", removeItem);

// Sync item count utility
router.post("/:id/sync", syncCount);

export default router;