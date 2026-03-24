import {
  getResurfacedItems,
  markAsSurfaced,
  getResurfacingStats,
} from "../services/resurfacing.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";

// ─── GET /api/resurfacing ─────────────────────────────────────────────────────
// Returns today's resurfaced items for the user
export const getResurfaced = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const items = await getResurfacedItems(
    req.user._id,
    Math.min(Number(limit), 10)
  );

  return res.json(
    ApiResponse.success("Resurfaced items fetched", {
      total: items.length,
      items,
    })
  );
});

// ─── POST /api/resurfacing/seen ───────────────────────────────────────────────
// Mark resurfaced items as seen (call after user views them)
export const markSeen = asyncHandler(async (req, res) => {
  const { itemIds } = req.body;

  if (!Array.isArray(itemIds) || !itemIds.length) {
    return res.status(400).json(ApiResponse.error("itemIds array is required"));
  }

  await markAsSurfaced(req.user._id, itemIds);

  return res.json(ApiResponse.success("Items marked as seen"));
});

// ─── GET /api/resurfacing/stats ───────────────────────────────────────────────
export const getStats = asyncHandler(async (req, res) => {
  const stats = await getResurfacingStats(req.user._id);
  return res.json(ApiResponse.success("Resurfacing stats fetched", { stats }));
});