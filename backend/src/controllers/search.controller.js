import * as searchService from "../services/search.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";

// ─── GET /api/search?q=query ────────────────────────────────────────────────
// Main search endpoint — uses hybrid (semantic + keyword) by default
export const search = asyncHandler(async (req, res) => {
  const { q, type, mode = "hybrid", limit = 10, minScore } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json(ApiResponse.error("Search query must be at least 2 characters"));
  }

  const options = {
    limit: Math.min(Number(limit), 50),
    type: type || null,
    minScore: minScore ? Number(minScore) : undefined,
  };

  let searchResult;

  switch (mode) {
    case "semantic":
      searchResult = await searchService.semanticSearch(req.user._id, q.trim(), options);
      break;
    case "text":
      searchResult = await searchService.textFallbackSearch(req.user._id, q.trim(), options);
      break;
    default:
      searchResult = await searchService.hybridSearch(req.user._id, q.trim(), options);
  }

  return res.json(
    ApiResponse.success("Search completed", {
      query: q.trim(),
      mode: searchResult.type,
      total: searchResult.results.length,
      counts: searchResult.counts || null,
      results: searchResult.results,
    })
  );
});

// ─── GET /api/search/similar/:itemId ───────────────────────────────────────
// Returns semantically similar items for a given item
export const getSimilar = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const similar = await searchService.findSimilarItems(
    req.user._id,
    req.params.itemId,
    Math.min(Number(limit), 20)
  );

  return res.json(
    ApiResponse.success("Similar items fetched", {
      total: similar.length,
      results: similar,
    })
  );
});