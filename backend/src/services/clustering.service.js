import Item from "../models/item.model.js";
import logger from "../config/logger.js";

// ─── Build Clusters ───────────────────────────────────────────────────────────

/**
 * Groups a user's items into topic clusters based on aiTags.
 * Returns top clusters sorted by item count.
 */
export async function buildClusters(userId, options = {}) {
  const { minItems = 2, maxClusters = 12, limit = 200 } = options;

  // Fetch all processed items with aiTags
  const items = await Item.find(
    {
      user: userId,
      aiProcessingStatus: "done",
      isArchived: false,
      aiTags: { $exists: true, $ne: [] },
    },
    {
      title: 1,
      type: 1,
      aiTags: 1,
      aiSummary: 1,
      createdAt: 1,
      "metadata.thumbnail": 1,
      "metadata.siteName": 1,
    }
  )
    .limit(limit)
    .lean();

  if (!items.length) {
    return { clusters: [], totalItems: 0 };
  }

  // ── Step 1: Count tag frequency across all items ──────────────────────────
  const tagFrequency = {};
  for (const item of items) {
    for (const tag of item.aiTags || []) {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    }
  }

  // ── Step 2: Pick top tags as cluster centers ──────────────────────────────
  const topTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxClusters)
    .map(([tag, count]) => ({ tag, count }));

  // ── Step 3: Assign each item to its best matching cluster ─────────────────
  const clusterMap = {};

  for (const { tag } of topTags) {
    clusterMap[tag] = [];
  }

  for (const item of items) {
    if (!item.aiTags?.length) continue;

    // Find which top tag this item matches most
    // Priority: exact match with highest frequency tag first
    let assigned = false;
    for (const { tag } of topTags) {
      if (item.aiTags.includes(tag)) {
        clusterMap[tag].push(item);
        assigned = true;
        break;
      }
    }
  }

  // ── Step 4: Filter clusters with enough items ─────────────────────────────
  const clusters = topTags
    .map(({ tag, count: tagFreq }) => {
      const clusterItems = clusterMap[tag] || [];
      if (clusterItems.length < minItems) return null;

      // Get related tags (other common tags in this cluster)
      const relatedTagFreq = {};
      for (const item of clusterItems) {
        for (const t of item.aiTags || []) {
          if (t !== tag) {
            relatedTagFreq[t] = (relatedTagFreq[t] || 0) + 1;
          }
        }
      }

      const relatedTags = Object.entries(relatedTagFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([t]) => t);

      return {
        tag,                              // cluster name
        itemCount: clusterItems.length,
        tagFrequency: tagFreq,
        relatedTags,
        // Preview: first 4 items
        preview: clusterItems.slice(0, 4).map((i) => ({
          _id: i._id,
          title: i.title,
          type: i.type,
          thumbnail: i.metadata?.thumbnail || null,
          siteName: i.metadata?.siteName || null,
          aiSummary: i.aiSummary || "",
          createdAt: i.createdAt,
        })),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.itemCount - a.itemCount);

  logger.debug(
    `Built ${clusters.length} clusters for user ${userId} from ${items.length} items`
  );

  return {
    clusters,
    totalItems: items.length,
    totalClusters: clusters.length,
  };
}

// ─── Get Items in a Cluster ───────────────────────────────────────────────────

/**
 * Returns all items belonging to a specific tag cluster.
 */
export async function getClusterItems(userId, tag, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Item.find(
      {
        user: userId,
        aiProcessingStatus: "done",
        isArchived: false,
        aiTags: tag,
      },
      { "embedding.vector": 0, content: 0 }
    )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("collections", "name color icon")
      .lean(),

    Item.countDocuments({
      user: userId,
      aiProcessingStatus: "done",
      isArchived: false,
      aiTags: tag,
    }),
  ]);

  return {
    tag,
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + items.length < total,
    },
  };
}