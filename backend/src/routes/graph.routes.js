import { Router } from "express";
import { query } from "express-validator";
import authenticate from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  getGraph,
  buildGraph,
  getGraphStats,
  getItemConnections,
  rebuildGraph,
} from "../controllers/graph.controller.js";

const router = Router();

router.use(authenticate);

// GET  /api/graph             → get full graph (nodes + edges)
// POST /api/graph/build       → build/update graph
// GET  /api/graph/stats       → graph stats
// GET  /api/graph/item/:id    → item connections (backlinks)
// DELETE /api/graph           → rebuild from scratch

router.get(
  "/",
  [
    query("minStrength").optional().isFloat({ min: 0, max: 1 }).toFloat(),
    query("limit").optional().isInt({ min: 1, max: 200 }).toInt(),
  ],
  validate,
  getGraph
);

router.post("/build", buildGraph);
router.get("/stats", getGraphStats);
router.get("/item/:itemId", getItemConnections);
router.delete("/", rebuildGraph);

export default router;