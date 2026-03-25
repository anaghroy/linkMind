import mongoose from "mongoose";
import GraphEdge from "../models/graph.model.js";
import Item from "../models/item.model.js";
import logger from "../config/logger.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_SIMILARITY_SCORE = 0.65; // minimum cosine similarity to create an edge
const MIN_SHARED_TAGS = 1; // minimum shared tags to create an edge

// ─── Cosine Similarity ────────────────────────────────────────────────────────

function cosineSimilarity(vecA, vecB) {
  if (!vecA?.length || !vecB?.length || vecA.length !== vecB.length) return 0;
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── Build Graph for User ─────────────────────────────────────────────────────

/**
 * Builds the full graph for a user by:
 * 1. Fetching all items with embeddings + AI tags
 * 2. Computing tag similarity edges
 * 3. Computing embedding similarity edges
 * 4. Saving all edges to DB (upsert)
 */
export async function buildGraph(userId) {
  logger.info(`Building graph for user: ${userId}`);

  // Fetch all processed items with embeddings
  const items = await Item.find(
    { user: userId, aiProcessingStatus: "done" },
    { title: 1, type: 1, aiTags: 1, "embedding.vector": 1, surfaceCount: 1 },
  ).lean();

  if (items.length < 2) {
    logger.debug(`Not enough items to build graph for user: ${userId}`);
    return { nodesCount: items.length, edgesCreated: 0 };
  }

  const edges = [];

  // Compare every pair of items
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];

      // ── Tag similarity ────────────────────────────────────────────────────
      const sharedTags = (a.aiTags || []).filter((t) =>
        (b.aiTags || []).includes(t),
      );

      if (sharedTags.length >= MIN_SHARED_TAGS) {
        // Strength = shared tags / max possible tags (normalized 0-1)
        const maxTags = Math.max(a.aiTags.length, b.aiTags.length);
        const tagStrength = Math.min(sharedTags.length / maxTags, 1);

        edges.push({
          user: userId,
          source: a._id,
          target: b._id,
          relationshipType: "tag_similarity",
          strength: parseFloat(tagStrength.toFixed(3)),
          sharedTags,
          similarityScore: null,
        });
      }

      // ── Embedding similarity ──────────────────────────────────────────────
      if (a.embedding?.vector?.length && b.embedding?.vector?.length) {
        const score = cosineSimilarity(a.embedding.vector, b.embedding.vector);

        if (score >= MIN_SIMILARITY_SCORE) {
          // Check if we already have a tag edge for this pair
          const existingTagEdge = edges.find(
            (e) =>
              e.source.toString() === a._id.toString() &&
              e.target.toString() === b._id.toString() &&
              e.relationshipType === "tag_similarity",
          );

          if (existingTagEdge) {
            // Upgrade existing edge strength with embedding score
            existingTagEdge.strength = parseFloat(
              Math.min((existingTagEdge.strength + score) / 2, 1).toFixed(3),
            );
            existingTagEdge.similarityScore = parseFloat(score.toFixed(4));
          } else {
            edges.push({
              user: userId,
              source: a._id,
              target: b._id,
              relationshipType: "embedding_similarity",
              strength: parseFloat(score.toFixed(3)),
              sharedTags: [],
              similarityScore: parseFloat(score.toFixed(4)),
            });
          }
        }
      }
    }
  }

  // Upsert all edges
  let edgesCreated = 0;
  for (const edge of edges) {
    try {
      await GraphEdge.findOneAndUpdate(
        { user: edge.user, source: edge.source, target: edge.target },
        { $set: edge },
        { upsert: true, new: true },
      );
      edgesCreated++;
    } catch (err) {
      // Skip duplicate key errors silently
      if (err.code !== 11000) logger.error(`Edge upsert error: ${err.message}`);
    }
  }

  logger.info(
    `Graph built for user ${userId}: ${items.length} nodes, ${edgesCreated} edges`,
  );

  return { nodesCount: items.length, edgesCreated };
}

// ─── Get Full Graph ───────────────────────────────────────────────────────────

/**
 * Returns nodes + edges for d3.js visualization.
 * Nodes = items, Edges = graph edges with strength
 */
export async function getGraph(userId, options = {}) {
  const { minStrength = 0.1, limit = 100 } = options;

  // Get items (nodes)
  const items = await Item.find({
    user: userId,
    aiProcessingStatus: "done",
    isArchived: false,
  })
    .select("-embedding.vector") // ✅ works perfectly
    .select(
      "title type aiTags aiSummary surfaceCount createdAt metadata.thumbnail metadata.siteName",
    )
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  const itemIds = new Set(items.map((i) => i._id.toString()));

  // Get edges
  const edges = await GraphEdge.find({
    user: userId,
    strength: { $gte: minStrength },
  })
    .sort({ strength: -1 })
    .lean();

  // Only include edges where both nodes are in our items set
  const filteredEdges = edges.filter(
    (e) => itemIds.has(e.source.toString()) && itemIds.has(e.target.toString()),
  );

  // Format nodes for d3
  const nodes = items.map((item) => ({
    id: item._id.toString(),
    title: item.title,
    type: item.type,
    aiTags: item.aiTags || [],
    aiSummary: item.aiSummary || "",
    thumbnail: item.metadata?.thumbnail || null,
    siteName: item.metadata?.siteName || null,
    surfaceCount: item.surfaceCount || 0,
    createdAt: item.createdAt,
  }));

  // Format links for d3
  const links = filteredEdges.map((edge) => ({
    id: edge._id.toString(),
    source: edge.source.toString(),
    target: edge.target.toString(),
    strength: edge.strength,
    relationshipType: edge.relationshipType,
    sharedTags: edge.sharedTags || [],
    similarityScore: edge.similarityScore,
  }));

  return {
    nodes,
    links,
    stats: {
      totalNodes: nodes.length,
      totalLinks: links.length,
      avgStrength: links.length
        ? parseFloat(
            (links.reduce((s, l) => s + l.strength, 0) / links.length).toFixed(
              3,
            ),
          )
        : 0,
    },
  };
}

// ─── Get Item Connections ─────────────────────────────────────────────────────

/**
 * Returns all edges connected to a specific item.
 * Used for "Show Backlinks" feature.
 */
export async function getItemConnections(userId, itemId) {
  const edges = await GraphEdge.find({
    user: userId,
    $or: [{ source: itemId }, { target: itemId }],
  })
    .sort({ strength: -1 })
    .populate("source", "title type aiTags metadata.thumbnail")
    .populate("target", "title type aiTags metadata.thumbnail")
    .lean();

  return edges.map((edge) => {
    const connectedItem =
      edge.source._id.toString() === itemId.toString()
        ? edge.target
        : edge.source;

    return {
      item: connectedItem,
      strength: edge.strength,
      relationshipType: edge.relationshipType,
      sharedTags: edge.sharedTags,
      similarityScore: edge.similarityScore,
    };
  });
}

// ─── Get Graph Stats ──────────────────────────────────────────────────────────

export async function getGraphStats(userId) {
  const [totalEdges, strongEdges, tagEdges, embeddingEdges] = await Promise.all(
    [
      GraphEdge.countDocuments({ user: userId }),
      GraphEdge.countDocuments({ user: userId, strength: { $gte: 0.7 } }),
      GraphEdge.countDocuments({
        user: userId,
        relationshipType: "tag_similarity",
      }),
      GraphEdge.countDocuments({
        user: userId,
        relationshipType: "embedding_similarity",
      }),
    ],
  );

  const topConnected = await GraphEdge.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $project: {
        items: ["$source", "$target"],
        strength: 1,
      },
    },
    { $unwind: "$items" },
    { $group: { _id: "$items", connectionCount: { $sum: 1 } } },
    { $sort: { connectionCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "items",
        localField: "_id",
        foreignField: "_id",
        as: "item",
        pipeline: [{ $project: { title: 1, type: 1 } }],
      },
    },
    { $unwind: "$item" },
  ]);

  return {
    totalEdges,
    strongEdges,
    byType: { tagSimilarity: tagEdges, embeddingSimilarity: embeddingEdges },
    topConnected: topConnected.map((t) => ({
      title: t.item.title,
      type: t.item.type,
      connections: t.connectionCount,
    })),
  };
}

// ─── Delete Graph for User ────────────────────────────────────────────────────

export async function deleteGraph(userId) {
  const result = await GraphEdge.deleteMany({ user: userId });
  logger.info(`Deleted ${result.deletedCount} graph edges for user: ${userId}`);
  return result.deletedCount;
}
