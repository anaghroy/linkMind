import * as clusteringService from "../services/clustering.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";

// ─── GET /api/clusters ────────────────────────────────────────────────────────
export const getClusters = asyncHandler(async (req, res) => {
  const { minItems = 2, maxClusters = 12 } = req.query;

  const result = await clusteringService.buildClusters(req.user._id, {
    minItems: Number(minItems),
    maxClusters: Number(maxClusters),
  });

  return res.json(ApiResponse.success("Clusters fetched", result));
});

// ─── GET /api/clusters/:tag ───────────────────────────────────────────────────
export const getClusterItems = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const result = await clusteringService.getClusterItems(
    req.user._id,
    req.params.tag,
    { page: Number(page), limit: Number(limit) }
  );

  return res.json(ApiResponse.success("Cluster items fetched", result));
});