import Collection from "../models/collection.model.js";
import Item from "../models/item.model.js";

// ─── Create Collection ─────────────────────────────────────────────────────

export async function createCollection(userId, payload) {
  const { name, description, color, icon, parent } = payload;

  // Check duplicate name for this user
  const existing = await Collection.findOne({ user: userId, name });
  if (existing) {
    return { duplicate: true, collection: existing };
  }

  // Validate parent exists and belongs to user
  if (parent) {
    const parentCol = await Collection.findOne({ _id: parent, user: userId });
    if (!parentCol) {
      throw new Error("Parent collection not found");
    }
    // Prevent more than 2 levels deep (parent cannot itself have a parent)
    if (parentCol.parent) {
      throw new Error("Collections can only be nested one level deep");
    }
  }

  const collection = await Collection.create({
    user: userId,
    name,
    description: description || "",
    color: color || "#6366f1",
    icon: icon || "folder",
    parent: parent || null,
  });

  return { duplicate: false, collection };
}

// ─── Get All Collections ───────────────────────────────────────────────────

export async function getCollections(userId) {
  // Get all root collections (no parent) with their subcollections
  const collections = await Collection.find({ user: userId, parent: null })
    .sort({ order: 1, createdAt: -1 })
    .populate({
      path: "subcollections",
      match: { user: userId },
      options: { sort: { order: 1, createdAt: -1 } },
    });

  return collections;
}

// ─── Get Single Collection with its Items ──────────────────────────────────

export async function getCollectionById(userId, collectionId, query = {}) {
  const collection = await Collection.findOne({
    _id: collectionId,
    user: userId,
  }).populate({
    path: "subcollections",
    match: { user: userId },
    options: { sort: { order: 1 } },
  });

  if (!collection) return null;

  // Fetch items in this collection
  const { page = 1, limit = 20, sort = "newest" } = query;

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    title: { title: 1 },
  };

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Item.find({ user: userId, collections: collectionId, isArchived: false })
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(Number(limit)),
    Item.countDocuments({ user: userId, collections: collectionId, isArchived: false }),
  ]);

  return {
    collection,
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

// ─── Update Collection ─────────────────────────────────────────────────────

export async function updateCollection(userId, collectionId, updates) {
  const allowed = ["name", "description", "color", "icon", "order"];
  const sanitized = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) sanitized[key] = updates[key];
  }

  // Check name uniqueness if name is being updated
  if (sanitized.name) {
    const existing = await Collection.findOne({
      user: userId,
      name: sanitized.name,
      _id: { $ne: collectionId },
    });
    if (existing) throw new Error("A collection with this name already exists");
  }

  return Collection.findOneAndUpdate(
    { _id: collectionId, user: userId },
    { $set: sanitized },
    { new: true, runValidators: true }
  );
}

// ─── Delete Collection ─────────────────────────────────────────────────────

export async function deleteCollection(userId, collectionId) {
  const collection = await Collection.findOne({
    _id: collectionId,
    user: userId,
  });
  if (!collection) return null;

  // Remove collection ref from all items
  await Item.updateMany(
    { user: userId, collections: collectionId },
    { $unset: { collections: "" } }
  );

  // Delete subcollections too
  const subcollections = await Collection.find({
    user: userId,
    parent: collectionId,
  });

  for (const sub of subcollections) {
    await Item.updateMany(
      { user: userId, collections: sub._id },
      { $unset: { collections: "" } }
    );
    await sub.deleteOne();
  }

  await collection.deleteOne();
  return collection;
}

// ─── Add Item to Collection ────────────────────────────────────────────────

export async function addItemToCollection(userId, collectionId, itemId) {
  const [collection, item] = await Promise.all([
    Collection.findOne({ _id: collectionId, user: userId }),
    Item.findOne({ _id: itemId, user: userId }),
  ]);

  if (!collection) throw new Error("Collection not found");
  if (!item) throw new Error("Item not found");

  // Remove from previous collection if any (one collection only)
  if (item.collections && item.collections.toString() !== collectionId) {
    await Collection.findByIdAndUpdate(item.collections, {
      $inc: { itemCount: -1 },
    });
  }

  // Assign new collection
  await Item.findByIdAndUpdate(itemId, {
    $set: { collections: collectionId },
  });

  // Increment count
  await Collection.findByIdAndUpdate(collectionId, {
    $inc: { itemCount: 1 },
  });

  return Collection.findById(collectionId);
}

// ─── Remove Item from Collection ──────────────────────────────────────────

export async function removeItemFromCollection(userId, collectionId, itemId) {
  const item = await Item.findOne({ _id: itemId, user: userId });
  if (!item) throw new Error("Item not found");

  await Item.findByIdAndUpdate(itemId, {
    $unset: { collections: "" },
  });

  await Collection.findOneAndUpdate(
    { _id: collectionId, user: userId },
    { $inc: { itemCount: -1 } }
  );

  return true;
}

// ─── Recalculate Item Count ────────────────────────────────────────────────
// Utility to sync itemCount if it ever drifts

export async function syncItemCount(userId, collectionId) {
  const count = await Item.countDocuments({
    user: userId,
    collections: collectionId,
    isArchived: false,
  });

  return Collection.findOneAndUpdate(
    { _id: collectionId, user: userId },
    { $set: { itemCount: count } },
    { new: true }
  );
}