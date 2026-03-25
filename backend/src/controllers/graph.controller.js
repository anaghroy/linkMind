import * as graphService from "../services/graph.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";

// ─── GET /api/graph ───────────────────────────────────────────────────────────
// Returns full graph data (nodes + edges) for d3.js
export const getGraph = asyncHandler(async (req, res) => {
  const { minStrength = 0.1, limit = 100 } = req.query;

  const graph = await graphService.getGraph(req.user._id, {
    minStrength: Number(minStrength),
    limit: Math.min(Number(limit), 200),
  });

  return res.json(ApiResponse.success("Graph fetched", { graph }));
});

// ─── POST /api/graph/build ────────────────────────────────────────────────────
// Triggers graph rebuild for the user (call after saving new items)
export const buildGraph = asyncHandler(async (req, res) => {
  const result = await graphService.buildGraph(req.user._id);
  return res.json(ApiResponse.success("Graph built successfully", { result }));
});

// ─── GET /api/graph/stats ─────────────────────────────────────────────────────
export const getGraphStats = asyncHandler(async (req, res) => {
  const stats = await graphService.getGraphStats(req.user._id);
  return res.json(ApiResponse.success("Graph stats fetched", { stats }));
});

// ─── GET /api/graph/item/:itemId ──────────────────────────────────────────────
// Returns all connections for a specific item (backlinks)
export const getItemConnections = asyncHandler(async (req, res) => {
  const connections = await graphService.getItemConnections(
    req.user._id,
    req.params.itemId
  );
  return res.json(
    ApiResponse.success("Item connections fetched", {
      total: connections.length,
      connections,
    })
  );
});

// ─── DELETE /api/graph ────────────────────────────────────────────────────────
// Clears and rebuilds the graph from scratch
export const rebuildGraph = asyncHandler(async (req, res) => {
  await graphService.deleteGraph(req.user._id);
  const result = await graphService.buildGraph(req.user._id);
  return res.json(ApiResponse.success("Graph rebuilt from scratch", { result }));
});