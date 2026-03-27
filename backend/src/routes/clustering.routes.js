import { Router } from "express";
import { query } from "express-validator";
import authenticate from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { getClusters, getClusterItems } from "../controllers/clustering.controller.js";

const router = Router();

router.use(authenticate);

// GET /api/clusters              → all topic clusters
// GET /api/clusters/:tag         → items in a specific cluster

router.get(
  "/",
  [
    query("minItems").optional().isInt({ min: 1 }).toInt(),
    query("maxClusters").optional().isInt({ min: 1, max: 20 }).toInt(),
  ],
  validate,
  getClusters
);

router.get("/:tag", getClusterItems);

export default router;