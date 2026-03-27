import express from "express";

import authRoutes from "./auth.routes.js";
import itemRoutes from "./item.routes.js";
import searchRoutes from "./search.routes.js";
import collectionRoutes from "./collection.routes.js";
import graphRoutes from "./graph.routes.js";
import resurfacingRoutes from "./resurfacing.routes.js"
import clusterRoutes from "./clustering.routes.js"

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/items", itemRoutes);
router.use("/search", searchRoutes);
router.use("/collections", collectionRoutes);
router.use("/graph", graphRoutes);
router.use("/resurfacing", resurfacingRoutes);
router.use("/clusters", clusterRoutes);

export default router;