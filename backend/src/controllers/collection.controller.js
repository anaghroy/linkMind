import * as collectionService from "../services/collection.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";

// ─── POST /api/collections ──────────────────────────────────────────────────
export const createCollection = asyncHandler(async (req, res) => {
  const { name, description, color, icon, parent } = req.body;

  if (!name) {
    return res.status(400).json(ApiResponse.error("Collection name is required"));
  }

  const { duplicate, collection } = await collectionService.createCollection(
    req.user._id,
    { name, description, color, icon, parent }
  );

  if (duplicate) {
    return res.status(409).json(
      ApiResponse.error("A collection with this name already exists", {
        collection,
        duplicate: true,
      })
    );
  }

  return res
    .status(201)
    .json(ApiResponse.success("Collection created", { collection }));
});

// ─── GET /api/collections ───────────────────────────────────────────────────
export const getCollections = asyncHandler(async (req, res) => {
  const collections = await collectionService.getCollections(req.user._id);
  return res.json(ApiResponse.success("Collections fetched", { collections }));
});

// ─── GET /api/collections/:id ───────────────────────────────────────────────
export const getCollection = asyncHandler(async (req, res) => {
  const result = await collectionService.getCollectionById(
    req.user._id,
    req.params.id,
    req.query
  );

  if (!result) {
    return res.status(404).json(ApiResponse.error("Collection not found"));
  }

  return res.json(ApiResponse.success("Collection fetched", result));
});

// ─── PATCH /api/collections/:id ────────────────────────────────────────────
export const updateCollection = asyncHandler(async (req, res) => {
  const collection = await collectionService.updateCollection(
    req.user._id,
    req.params.id,
    req.body
  );

  if (!collection) {
    return res.status(404).json(ApiResponse.error("Collection not found"));
  }

  return res.json(ApiResponse.success("Collection updated", { collection }));
});

// ─── DELETE /api/collections/:id ───────────────────────────────────────────
export const deleteCollection = asyncHandler(async (req, res) => {
  const collection = await collectionService.deleteCollection(
    req.user._id,
    req.params.id
  );

  if (!collection) {
    return res.status(404).json(ApiResponse.error("Collection not found"));
  }

  return res.json(ApiResponse.success("Collection deleted"));
});

// ─── POST /api/collections/:id/items/:itemId ───────────────────────────────
export const addItem = asyncHandler(async (req, res) => {
  const collection = await collectionService.addItemToCollection(
    req.user._id,
    req.params.id,
    req.params.itemId
  );

  return res.json(ApiResponse.success("Item added to collection", { collection }));
});

// ─── DELETE /api/collections/:id/items/:itemId ─────────────────────────────
export const removeItem = asyncHandler(async (req, res) => {
  await collectionService.removeItemFromCollection(
    req.user._id,
    req.params.id,
    req.params.itemId
  );

  return res.json(ApiResponse.success("Item removed from collection"));
});

// ─── POST /api/collections/:id/sync ────────────────────────────────────────
export const syncCount = asyncHandler(async (req, res) => {
  const collection = await collectionService.syncItemCount(
    req.user._id,
    req.params.id
  );

  return res.json(ApiResponse.success("Item count synced", { collection }));
});