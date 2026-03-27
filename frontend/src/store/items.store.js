import { create } from "zustand";
import {
  getItems,
  saveItem,
  updateItem,
  deleteItem,
  markAsRead,
  getItemStats,
} from "../api/items.api";

import {
  addItemToCollection,
  removeItemFromCollection,
} from "../api/collections.api";

export const useItemsStore = create((set, get) => ({
  items: [],
  stats: null,
  pagination: {},
  loading: false,
  saving: false,
  error: null,

  filters: {
    page: 1,
    limit: 12,
    sort: "newest",
    type: "",
    isFavorite: false,
    isArchived: false,
    search: "",
  },

  // 🔥 FETCH ITEMS
  fetchItems: async () => {
    set({ loading: true, error: null });

    try {
      const filters = get().filters;

      const res = await getItems(filters);

      set({
        items: res.data.items || [],
        pagination: res.data.pagination || {},
        loading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to fetch",
        loading: false,
      });
    }
  },

  // 🔥 STATS
  fetchStats: async () => {
    try {
      const res = await getItemStats();
      set({ stats: res.data.stats });
    } catch {}
  },

  // 🔥 SAVE ITEM
  saveItem: async (data) => {
    set({ saving: true });

    try {
      const res = await saveItem(data);

      set((state) => ({
        items: [res.data.item, ...state.items],
        saving: false,
      }));

      return { success: true };
    } catch (err) {
      set({ saving: false });
      return { success: false };
    }
  },

  // 🔥 FAVORITE (OPTIMISTIC)
  toggleFavorite: async (id) => {
    const item = get().items.find((i) => i._id === id);

    set((state) => ({
      items: state.items.map((i) =>
        i._id === id ? { ...i, isFavorite: !i.isFavorite } : i
      ),
    }));

    try {
      await updateItem(id, { isFavorite: !item.isFavorite });
    } catch {
      // revert
      set((state) => ({
        items: state.items.map((i) =>
          i._id === id ? { ...i, isFavorite: item.isFavorite } : i
        ),
      }));
    }
  },

  // 🔥 DELETE
  deleteItem: async (id) => {
    try {
      await deleteItem(id);

      set((state) => ({
        items: state.items.filter((i) => i._id !== id),
      }));

      return { success: true };
    } catch {
      return { success: false };
    }
  },

  // 🔥 ADD TO COLLECTION
  addToCollection: async (itemId, collectionId) => {
    try {
      await addItemToCollection(collectionId, itemId);

      set((state) => ({
        items: state.items.map((item) =>
          item._id === itemId
            ? { ...item, collections: collectionId }
            : item
        ),
      }));

      return { success: true };
    } catch {
      return { success: false };
    }
  },

  // 🔥 REMOVE FROM COLLECTION
  removeFromCollection: async (itemId, collectionId) => {
    try {
      await removeItemFromCollection(collectionId, itemId);

      set((state) => ({
        items: state.items.map((item) =>
          item._id === itemId
            ? { ...item, collections: null }
            : item
        ),
      }));

      return { success: true };
    } catch {
      return { success: false };
    }
  },

  // 🔥 FILTERS
  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value, page: 1 },
    }));
  },

  setPage: (page) => {
    set((state) => ({
      filters: { ...state.filters, page },
    }));
  },
}));