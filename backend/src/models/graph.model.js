import mongoose from "mongoose";

const graphEdgeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // The two connected items
    source: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },

    // How the relationship was created
    relationshipType: {
      type: String,
      enum: ["tag_similarity", "embedding_similarity", "manual"],
      required: true,
    },

    // Strength of connection (0 to 1)
    strength: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },

    // Shared tags (for tag_similarity edges)
    sharedTags: [{ type: String }],

    // Embedding cosine similarity score (for embedding_similarity edges)
    similarityScore: { type: Number, default: null },
  },
  { timestamps: true }
);

// No duplicate edges between same pair of items
graphEdgeSchema.index({ user: 1, source: 1, target: 1 }, { unique: true });
graphEdgeSchema.index({ user: 1, source: 1 });
graphEdgeSchema.index({ user: 1, target: 1 });
graphEdgeSchema.index({ user: 1, strength: -1 });

export default mongoose.model("GraphEdge", graphEdgeSchema);