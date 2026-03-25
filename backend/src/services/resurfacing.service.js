import Item from "../models/item.model.js";
import logger from "../config/logger.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const RESURFACING_RULES = {
  // Items not seen for this many days are candidates
  minDaysSinceSaved: 7,
  minDaysSinceLastSurfaced: 14, // don't resurface same item too soon
  maxItemsPerBatch: 5,          // max items to resurface per user per run

  // Scoring weights
  weights: {
    recency: 0.3,      // older items get slight boost (forgotten gems)
    surfaceCount: 0.2, // items surfaced less get priority
    readStatus: 0.3,   // unread items get priority
    randomness: 0.2,   // adds variety so same items don't always show
  },
};

// ─── Get Resurfaced Items for a User ─────────────────────────────────────────

/**
 * Returns items that should be resurfaced to the user today.
 * Scoring system picks the most "worthy" forgotten items.
 */
export async function getResurfacedItems(userId, limit = 5) {
  const now = new Date();

  const minSavedDate = new Date(now);
  minSavedDate.setDate(now.getDate() - RESURFACING_RULES.minDaysSinceSaved);

  const minSurfacedDate = new Date(now);
  minSurfacedDate.setDate(now.getDate() - RESURFACING_RULES.minDaysSinceLastSurfaced);

  // Find candidate items
  const candidates = await Item.find({
    user: userId,
    isArchived: false,
    createdAt: { $lte: minSavedDate }, // saved at least N days ago
    $or: [
      { lastSurfacedAt: null },                          // never surfaced
      { lastSurfacedAt: { $lte: minSurfacedDate } },     // not surfaced recently
    ],
    "embedding.processedAt": { $ne: null }, // has been AI processed
  })
    .select("-embedding.vector -content")
    .populate("collections", "name color icon")
    .lean();

  if (!candidates.length) {
    logger.debug(`No resurfacing candidates for user: ${userId}`);
    return [];
  }

  // Score each candidate
  const scored = candidates.map((item) => {
    const score = scoreItem(item, now);
    return { ...item, resurfaceScore: score };
  });

  // Sort by score descending, take top N
  scored.sort((a, b) => b.resurfaceScore - a.resurfaceScore);
  const top = scored.slice(0, limit);

  // Attach human-readable time context
  const withContext = top.map((item) => ({
    ...item,
    resurfaceContext: buildContext(item, now),
  }));

  return withContext;
}

// ─── Score Item ───────────────────────────────────────────────────────────────

function scoreItem(item, now) {
  const { weights } = RESURFACING_RULES;

  // Recency score — items saved longer ago get slight boost (0 to 1)
  const daysSinceSaved = Math.floor(
    (now - new Date(item.createdAt)) / (1000 * 60 * 60 * 24)
  );
  // Cap at 365 days for normalization
  const recencyScore = Math.min(daysSinceSaved / 365, 1);

  // Surface count score — less surfaced = higher score (0 to 1)
  const surfaceCountScore = 1 / (1 + (item.surfaceCount || 0));

  // Read status score — unread = 1, read = 0.3
  const readScore = item.readAt ? 0.3 : 1;

  // Randomness — adds variety
  const randomScore = Math.random();

  const total =
    recencyScore * weights.recency +
    surfaceCountScore * weights.surfaceCount +
    readScore * weights.readStatus +
    randomScore * weights.randomness;

  return total;
}

// ─── Build Context String ─────────────────────────────────────────────────────

function buildContext(item, now) {
  const daysSinceSaved = Math.floor(
    (now - new Date(item.createdAt)) / (1000 * 60 * 60 * 24)
  );

  let timeAgo;
  if (daysSinceSaved < 30) {
    timeAgo = `${daysSinceSaved} days ago`;
  } else if (daysSinceSaved < 365) {
    const months = Math.floor(daysSinceSaved / 30);
    timeAgo = `${months} month${months > 1 ? "s" : ""} ago`;
  } else {
    const years = Math.floor(daysSinceSaved / 365);
    timeAgo = `${years} year${years > 1 ? "s" : ""} ago`;
  }

  const readStatus = item.readAt ? "you read this" : "you haven't read this yet";

  return {
    timeAgo,
    readStatus,
    message: `You saved this ${timeAgo} — ${readStatus}`,
    daysSinceSaved,
    surfaceCount: item.surfaceCount || 0,
  };
}

// ─── Mark Items as Surfaced ───────────────────────────────────────────────────

/**
 * Called after items are shown to the user.
 * Updates lastSurfacedAt and increments surfaceCount.
 */
export async function markAsSurfaced(userId, itemIds) {
  if (!itemIds?.length) return;

  await Item.updateMany(
    { _id: { $in: itemIds }, user: userId },
    {
      $set: { lastSurfacedAt: new Date() },
      $inc: { surfaceCount: 1 },
    }
  );

  logger.debug(`Marked ${itemIds.length} items as surfaced for user: ${userId}`);
}

// ─── Get Resurfacing Stats ────────────────────────────────────────────────────

export async function getResurfacingStats(userId) {
  const now = new Date();
  const minSavedDate = new Date(now);
  minSavedDate.setDate(now.getDate() - RESURFACING_RULES.minDaysSinceSaved);

  const [totalCandidates, neverSurfaced, mostSurfaced] = await Promise.all([
    Item.countDocuments({
      user: userId,
      isArchived: false,
      createdAt: { $lte: minSavedDate },
    }),
    Item.countDocuments({
      user: userId,
      isArchived: false,
      lastSurfacedAt: null,
      createdAt: { $lte: minSavedDate },
    }),
    Item.findOne({ user: userId })
      .sort({ surfaceCount: -1 })
      .select("title surfaceCount lastSurfacedAt")
      .lean(),
  ]);

  return {
    totalCandidates,
    neverSurfaced,
    mostSurfaced: mostSurfaced || null,
  };
}
export async function processResurfacingJob(userId) {
  const items = await getResurfacedItems(userId);

  if (!items.length) return [];

  await markAsSurfaced(
    userId,
    items.map((item) => item._id)
  );

  return items;
}