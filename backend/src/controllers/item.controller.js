import * as itemService from "../services/item.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";

// ─── POST /api/items ────────────────────────────────────────────────────────
export const saveItem = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { url, type, title, description, userNote, tags, collections } = req.body;

  if (!url && !title) {
    return res.status(400).json(ApiResponse.error("Either url or title is required"));
  }

  const { duplicate, item } = await itemService.createItem(userId, {
    url,
    type,
    title,
    description,
    userNote,
    tags,
    collections,
  });

  if (duplicate) {
    return res.status(409).json(
      ApiResponse.error("This URL is already saved in your library", {
        item,
        duplicate: true,
      })
    );
  }

  return res.status(201).json(ApiResponse.success("Item saved successfully", { item }));
});

// ─── GET /api/items ─────────────────────────────────────────────────────────
export const getItems = asyncHandler(async (req, res) => {
  const result = await itemService.getItems(req.user._id, req.query);
  return res.json(ApiResponse.success("Items fetched", result));
});

// ─── GET /api/items/stats ────────────────────────────────────────────────────
export const getStats = asyncHandler(async (req, res) => {
  const stats = await itemService.getItemStats(req.user._id);
  return res.json(ApiResponse.success("Stats fetched", { stats }));
});

// ─── GET /api/items/:id ──────────────────────────────────────────────────────
export const getItem = asyncHandler(async (req, res) => {
  const item = await itemService.getItemById(req.user._id, req.params.id);
  if (!item) {
    return res.status(404).json(ApiResponse.error("Item not found"));
  }
  return res.json(ApiResponse.success("Item fetched", { item }));
});

// ─── PATCH /api/items/:id ────────────────────────────────────────────────────
export const updateItem = asyncHandler(async (req, res) => {
  const item = await itemService.updateItem(req.user._id, req.params.id, req.body);
  if (!item) {
    return res.status(404).json(ApiResponse.error("Item not found"));
  }
  return res.json(ApiResponse.success("Item updated", { item }));
});

// ─── DELETE /api/items/:id ───────────────────────────────────────────────────
export const deleteItem = asyncHandler(async (req, res) => {
  const item = await itemService.deleteItem(req.user._id, req.params.id);
  if (!item) {
    return res.status(404).json(ApiResponse.error("Item not found"));
  }
  return res.json(ApiResponse.success("Item deleted"));
});

// ─── PATCH /api/items/:id/read ───────────────────────────────────────────────
export const markAsRead = asyncHandler(async (req, res) => {
  const item = await itemService.markAsRead(req.user._id, req.params.id);
  if (!item) {
    return res.status(404).json(ApiResponse.error("Item not found"));
  }
  return res.json(ApiResponse.success("Marked as read", { item }));
});

// ─── POST /api/items/:id/highlights ─────────────────────────────────────────
export const addHighlight = asyncHandler(async (req, res) => {
  const { text, note, color } = req.body;
  if (!text) {
    return res.status(400).json(ApiResponse.error("Highlight text is required"));
  }
  const item = await itemService.addHighlight(req.user._id, req.params.id, {
    text,
    note,
    color,
  });
  if (!item) {
    return res.status(404).json(ApiResponse.error("Item not found"));
  }
  return res.status(201).json(
    ApiResponse.success("Highlight added", { highlights: item.highlights })
  );
});

// ─── DELETE /api/items/:id/highlights/:hid ───────────────────────────────────
export const removeHighlight = asyncHandler(async (req, res) => {
  const item = await itemService.removeHighlight(
    req.user._id,
    req.params.id,
    req.params.hid
  );
  if (!item) {
    return res.status(404).json(ApiResponse.error("Item not found"));
  }
  return res.json(
    ApiResponse.success("Highlight removed", { highlights: item.highlights })
  );
});