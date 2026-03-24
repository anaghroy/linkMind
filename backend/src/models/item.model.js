import mongoose from "mongoose";

const highlightSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    note: { type: String, default: "" },
    color: {
      type: String,
      enum: ["yellow", "green", "blue", "pink"],
      default: "yellow",
    },
  },
  { timestamps: true }
);

const itemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Core content
    type: {
      type: String,
      enum: ["article", "tweet", "youtube", "pdf", "image", "note"],
      required: true,
    },
    url: { type: String, default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    content: { type: String, default: "" },

    // Metadata (auto-fetched)
    metadata: {
      thumbnail: { type: String, default: null },
      favicon: { type: String, default: null },
      siteName: { type: String, default: null },
      author: { type: String, default: null },
      publishedAt: { type: Date, default: null },
      readingTime: { type: Number, default: null },
      videoId: { type: String, default: null },
      duration: { type: String, default: null },
      channelName: { type: String, default: null },
      tweetId: { type: String, default: null },
      tweetAuthor: { type: String, default: null },
      fileSize: { type: Number, default: null },
      pageCount: { type: Number, default: null },
      filePath: { type: String, default: null },
    },

    // Organization
    tags: [{ type: String, trim: true, lowercase: true }],
    aiTags: [{ type: String, trim: true, lowercase: true }],

    // Single collection (one item → one collection)
    collections: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      default: null,
    },

    // AI processing
    aiSummary: { type: String, default: "" },
    embedding: {
      vector: { type: [Number], default: null, select: false },
      model: { type: String, default: null },
      processedAt: { type: Date, default: null },
    },
    aiProcessingStatus: {
      type: String,
      enum: ["pending", "processing", "done", "failed"],
      default: "pending",
    },

    // Highlights
    highlights: [highlightSchema],

    // User interactions
    isFavorite: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    lastSurfacedAt: { type: Date, default: null },
    surfaceCount: { type: Number, default: 0 },

    // Notes
    userNote: { type: String, default: "" },
  },
  { timestamps: true }
);

// Indexes
itemSchema.index({ user: 1, createdAt: -1 });
itemSchema.index({ user: 1, type: 1 });
itemSchema.index({ user: 1, tags: 1 });
itemSchema.index({ user: 1, isArchived: 1 });
itemSchema.index({ user: 1, isFavorite: 1 });
itemSchema.index({ user: 1, aiProcessingStatus: 1 });
itemSchema.index({ user: 1, collections: 1 });
itemSchema.index({ url: 1, user: 1 }, { unique: true, sparse: true });

// Virtual: isRead
itemSchema.virtual("isRead").get(function () {
  return !!this.readAt;
});

itemSchema.set("toJSON", { virtuals: true });
itemSchema.set("toObject", { virtuals: true });

export default mongoose.model("Item", itemSchema);