import express from "express";
import { getGraph } from "../controllers/graph.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", auth, getGraph);

export default router;