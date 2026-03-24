import Item from "../models/item.model.js";
import { fetchMetadata } from "../utils/metadata.fetcher.js";
import { addToQueue } from "../ai/ai.queue.js";
import logger from "../config/logger.js";

// ─── Create Item ───────────────────────────────────────────────────────────

export async function createItem(userId, payload) {
  const {
    url,
    type: forcedType,
    title: manualTitle,
    userNote,
    tags = [],
    collections,
  } = payload;

  // Check duplicate URL for this user
  if (url) {
    const existing = await Item.findOne({ user: userId, url });
    if (existing) {
      return { duplicate: true, item: existing };
    }
  }

  // Auto-fetch metadata for URL-based items
  let fetchedData = {};
  if (url) {
    try {
      fetchedData = await fetchMetadata(url);
    } catch (err) {
      logger.error(`Metadata fetch failed: ${err.message}`);
    }
  }

  const type = forcedType || fetchedData.type || "note";
  const title = manualTitle || fetchedData.title || "Untitled";

  // collections is single ObjectId or null (one item → one collection)
  const collection =
    Array.isArray(collections) && collections.length > 0
      ? collections[0]
      : collections && !Array.isArray(collections)
      ? collections
      : null;

  const item = await Item.create({
    user: userId,
    type,
    url: url || null,
    title,
    description: fetchedData.description || payload.description || "",
    content: fetchedData.content || "",
    metadata: fetchedData.metadata || {},
    tags,
    collections: collection,
    userNote: userNote || "",
    aiProcessingStatus: "pending",
  });

  // Queue AI processing (embedding + tagging) asynchronously
  await addToQueue("ai-process-item", { itemId: item._id.toString(), userId });

  logger.info(`Item saved: ${item._id} | type: ${type} | user: ${userId}`);
  return { duplicate: false, item };
}

// ─── Get Items (with filters) ──────────────────────────────────────────────

export async function getItems(userId, query = {}) {
  const {
    page = 1,
    limit = 20,
    type,
    tag,
    collection,
    isFavorite,
    isArchived = false,
    search,
    sort = "newest",
  } = query;

  const filter = {
    user: userId,
    isArchived: isArchived === "true" || isArchived === true,
  };

  if (type) filter.type = type;
  if (tag) filter.tags = tag;
  if (collection) filter.collections = collection;
  if (isFavorite === "true" || isFavorite === true) filter.isFavorite = true;

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
      { userNote: { $regex: search, $options: "i" } },
    ];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    recently_read: { readAt: -1 },
    title: { title: 1 },
  };
  const sortOrder = sortMap[sort] || sortMap.newest;

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Item.find(filter)
      .sort(sortOrder)
      .skip(skip)
      .limit(Number(limit))
      .populate("collections", "name color icon"),
    Item.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
      hasMore: skip + items.length < total,
    },
  };
}

// ─── Get Single Item ───────────────────────────────────────────────────────

export async function getItemById(userId, itemId) {
  return Item.findOne({ _id: itemId, user: userId }).populate(
    "collections",
    "name color icon"
  );
}

// ─── Update Item ───────────────────────────────────────────────────────────

export async function updateItem(userId, itemId, updates) {
  const allowed = [
    "title",
    "description",
    "userNote",
    "tags",
    "isFavorite",
    "isArchived",
    "collections",
  ];

  const sanitized = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) sanitized[key] = updates[key];
  }

  // Normalize collections to single ObjectId or null
  if ("collections" in sanitized) {
    const c = sanitized.collections;
    sanitized.collections =
      Array.isArray(c) && c.length > 0
        ? c[0]
        : Array.isArray(c) && c.length === 0
        ? null
        : c || null;
  }

  return Item.findOneAndUpdate(
    { _id: itemId, user: userId },
    { $set: sanitized },
    { new: true, runValidators: true }
  ).populate("collections", "name color icon");
}

// ─── Delete Item ───────────────────────────────────────────────────────────

export async function deleteItem(userId, itemId) {
  return Item.findOneAndDelete({ _id: itemId, user: userId });
}

// ─── Mark as Read ─────────────────────────────────────────────────────────

export async function markAsRead(userId, itemId) {
  return Item.findOneAndUpdate(
    { _id: itemId, user: userId },
    { $set: { readAt: new Date() } },
    { new: true }
  );
}

// ─── Highlights ────────────────────────────────────────────────────────────

export async function addHighlight(userId, itemId, highlight) {
  return Item.findOneAndUpdate(
    { _id: itemId, user: userId },
    { $push: { highlights: highlight } },
    { new: true }
  );
}

export async function removeHighlight(userId, itemId, highlightId) {
  return Item.findOneAndUpdate(
    { _id: itemId, user: userId },
    { $pull: { highlights: { _id: highlightId } } },
    { new: true }
  );
}

// ─── Stats ─────────────────────────────────────────────────────────────────

export async function getItemStats(userId) {
  const [stats, total, favorites, unread] = await Promise.all([
    Item.aggregate([
      { $match: { user: userId } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]),
    Item.countDocuments({ user: userId }),
    Item.countDocuments({ user: userId, isFavorite: true }),
    Item.countDocuments({ user: userId, readAt: null, isArchived: false }),
  ]);

  return {
    total,
    favorites,
    unread,
    byType: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
  };
}