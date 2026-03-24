import mongoose from "mongoose";
import Item from "../models/item.model.js";
import { generateEmbedding } from "./ai.service.js";
import logger from "../config/logger.js";

// ─── Semantic Search ───────────────────────────────────────────────────────

/**
 * Searches user's items by meaning using Atlas Vector Search.
 * Falls back to text search if embedding fails.
 */
export async function semanticSearch(userId, query, options = {}) {
  const {
    limit = 10,
    type = null,
    minScore = 0.5, // minimum cosine similarity score
  } = options;

  logger.debug(`Semantic search: "${query}" | user: ${userId}`);

  // Step 1 — embed the search query
  let queryVector;
  try {
    queryVector = await generateEmbedding(query);
  } catch (err) {
    logger.warn(`Embedding failed for search query, falling back to text search: ${err.message}`);
    return await textFallbackSearch(userId, query, { limit, type });
  }

  // Step 2 — build filter
  const filter = {
    user: new mongoose.Types.ObjectId(userId),
    isArchived: false,
  };
  if (type) filter.type = type;

  // Step 3 — Atlas Vector Search aggregation pipeline
  const pipeline = [
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding.vector",
        queryVector,
        numCandidates: limit * 10, // search wider, return top N
        limit,
        filter,
      },
    },
    {
      // Attach similarity score
      $addFields: {
        score: { $meta: "vectorSearchScore" },
      },
    },
    {
      // Filter out low-relevance results
      $match: {
        score: { $gte: minScore },
      },
    },
    {
      // Shape the response
      $project: {
        "embedding.vector": 0, // exclude raw vector from response
        content: 0,            // exclude full content
      },
    },
    {
      $lookup: {
        from: "collections",
        localField: "collections",
        foreignField: "_id",
        as: "collections",
        pipeline: [{ $project: { name: 1, color: 1, icon: 1 } }],
      },
    },
    {
      $unwind: {
        path: "$collections",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  const results = await Item.aggregate(pipeline);

  logger.debug(`Semantic search returned ${results.length} results for: "${query}"`);
  return { results, type: "semantic", query };
}

// ─── Hybrid Search ─────────────────────────────────────────────────────────

/**
 * Combines semantic search + keyword search for best results.
 * Semantic search finds meaning, keyword search catches exact matches.
 */
export async function hybridSearch(userId, query, options = {}) {
  const { limit = 10, type = null } = options;

  // Run both in parallel
  const [semanticResults, keywordResults] = await Promise.allSettled([
    semanticSearch(userId, query, { limit, type, minScore: 0.4 }),
    textFallbackSearch(userId, query, { limit, type }),
  ]);

  const semantic = semanticResults.status === "fulfilled"
    ? semanticResults.value.results
    : [];

  const keyword = keywordResults.status === "fulfilled"
    ? keywordResults.value.results
    : [];

  // Merge and deduplicate by _id, semantic results ranked first
  const seen = new Set();
  const merged = [];

  for (const item of [...semantic, ...keyword]) {
    const id = item._id.toString();
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(item);
    }
  }

  return {
    results: merged.slice(0, limit),
    type: "hybrid",
    query,
    counts: {
      semantic: semantic.length,
      keyword: keyword.length,
      merged: merged.length,
    },
  };
}

// ─── Text Fallback Search ──────────────────────────────────────────────────

/**
 * Basic MongoDB text search used as fallback when embedding fails
 * or for hybrid search combination.
 */
export async function textFallbackSearch(userId, query, options = {}) {
  const { limit = 10, type = null } = options;

  const filter = {
    user: userId,
    isArchived: false,
    $or: [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { aiSummary: { $regex: query, $options: "i" } },
      { tags: { $regex: query, $options: "i" } },
      { aiTags: { $regex: query, $options: "i" } },
      { userNote: { $regex: query, $options: "i" } },
    ],
  };

  if (type) filter.type = type;

  const results = await Item.find(filter)
    .limit(limit)
    .sort({ createdAt: -1 })
    .select("-embedding.vector -content")
    .populate("collections", "name color icon");

  return { results, type: "text", query };
}

// ─── Find Similar Items ────────────────────────────────────────────────────

/**
 * Given an item ID, finds other semantically similar items.
 * Used for "Related Items" feature.
 */
export async function findSimilarItems(userId, itemId, limit = 5) {
  // Get the item's embedding vector
  const item = await Item.findOne(
    { _id: itemId, user: userId },
    { "embedding.vector": 1 }
  );

  if (!item?.embedding?.vector?.length) {
    logger.warn(`No embedding found for item: ${itemId}`);
    return [];
  }

  const pipeline = [
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding.vector",
        queryVector: item.embedding.vector,
        numCandidates: (limit + 1) * 10,
        limit: limit + 1, // +1 to exclude the item itself
        filter: {
          user: new mongoose.Types.ObjectId(userId),
          isArchived: false,
        },
      },
    },
    {
      $addFields: { score: { $meta: "vectorSearchScore" } },
    },
    {
      // Exclude the source item itself
      $match: {
        _id: { $ne: item._id },
        score: { $gte: 0.6 },
      },
    },
    {
      $limit: limit,
    },
    {
      $project: {
        "embedding.vector": 0,
        content: 0,
      },
    },
  ];

  const similar = await Item.aggregate(pipeline);
  logger.debug(`Found ${similar.length} similar items for: ${itemId}`);
  return similar;
}