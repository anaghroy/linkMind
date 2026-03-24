import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Basic info
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    // Appearance
    color: {
      type: String,
      default: "#6366f1", // indigo default
      match: /^#([A-Fa-f0-9]{6})$/,
    },
    icon: {
      type: String,
      default: "folder", // icon name e.g. "folder", "star", "book", "code"
      maxlength: 50,
    },

    // Nested collections
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      default: null,
    },

    // Item count (denormalized for performance)
    itemCount: {
      type: Number,
      default: 0,
    },

    // Order for drag-and-drop sorting
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes
collectionSchema.index({ user: 1, createdAt: -1 });
collectionSchema.index({ user: 1, parent: 1 });
collectionSchema.index({ user: 1, name: 1 }, { unique: true }); // no duplicate names per user

// Virtual: subcollections
collectionSchema.virtual("subcollections", {
  ref: "Collection",
  localField: "_id",
  foreignField: "parent",
});

collectionSchema.set("toJSON", { virtuals: true });
collectionSchema.set("toObject", { virtuals: true });

export default mongoose.model("Collection", collectionSchema);