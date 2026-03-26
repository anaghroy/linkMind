import { create } from "zustand";
import {
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  addItemToCollection,
  removeItemFromCollection,
} from "../api/collections.api";

export const useCollectionsStore = create((set, get) => ({
  // State
  collections: [],       // root collections with subcollections
  selectedCollection: null,
  collectionItems: [],
  collectionPagination: {},
  loading: false,
  itemsLoading: false,
  error: null,

  // ── Fetch All Collections ─────────────────────────────────────────────────
  fetchCollections: async () => {
    set({ loading: true, error: null });
    try {
      const res = await getCollections();
      set({ collections: res.data.collections || [], loading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to fetch collections",
        loading: false,
      });
    }
  },

  // ── Select Collection + Fetch Its Items ───────────────────────────────────
  selectCollection: async (collection, query = {}) => {
    set({ selectedCollection: collection, itemsLoading: true });
    try {
      const res = await getCollectionById(collection._id, query);
      set({
        collectionItems: res.data.items || [],
        collectionPagination: res.data.pagination || {},
        itemsLoading: false,
      });
    } catch (err) {
      set({ itemsLoading: false });
    }
  },

  // ── Create Collection ─────────────────────────────────────────────────────
  createCollection: async (data) => {
    try {
      const res = await createCollection(data);
      if (res.data.duplicate) {
        return { success: false, error: "Collection name already exists", duplicate: true };
      }
      const newCol = res.data.collection;
      set((state) => {
        // If it's a subcollection, add it to the parent's subcollections
        if (newCol.parent) {
          return {
            collections: state.collections.map((c) =>
              c._id === newCol.parent
                ? { ...c, subcollections: [...(c.subcollections || []), newCol] }
                : c
            ),
          };
        }
        // Root collection
        return { collections: [...state.collections, newCol] };
      });
      return { success: true, collection: newCol };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to create" };
    }
  },

  // ── Update Collection ─────────────────────────────────────────────────────
  updateCollection: async (id, data) => {
    try {
      const res = await updateCollection(id, data);
      const updated = res.data.collection;
      set((state) => ({
        collections: state.collections.map((c) => (c._id === id ? updated : c)),
        selectedCollection:
          state.selectedCollection?._id === id ? updated : state.selectedCollection,
      }));
      return { success: true, collection: updated };
    } catch (err) {
      return { success: false, error: err.response?.data?.message };
    }
  },

  // ── Delete Collection ─────────────────────────────────────────────────────
  deleteCollection: async (id) => {
    try {
      await deleteCollection(id);
      set((state) => ({
        collections: state.collections.filter((c) => c._id !== id),
        selectedCollection:
          state.selectedCollection?._id === id ? null : state.selectedCollection,
        collectionItems:
          state.selectedCollection?._id === id ? [] : state.collectionItems,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message };
    }
  },

  // ── Add Item to Collection ────────────────────────────────────────────────
  addItem: async (collectionId, itemId) => {
    try {
      const res = await addItemToCollection(collectionId, itemId);
      // Update itemCount on the collection
      set((state) => ({
        collections: state.collections.map((c) =>
          c._id === collectionId
            ? { ...c, itemCount: res.data.collection.itemCount }
            : c
        ),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message };
    }
  },

  // ── Remove Item from Collection ───────────────────────────────────────────
  removeItem: async (collectionId, itemId) => {
    try {
      await removeItemFromCollection(collectionId, itemId);
      set((state) => ({
        collectionItems: state.collectionItems.filter((i) => i._id !== itemId),
        collections: state.collections.map((c) =>
          c._id === collectionId
            ? { ...c, itemCount: Math.max((c.itemCount || 1) - 1, 0) }
            : c
        ),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message };
    }
  },

  // ── Clear ─────────────────────────────────────────────────────────────────
  clearSelected: () => set({ selectedCollection: null, collectionItems: [] }),
}));