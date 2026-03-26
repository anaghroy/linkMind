import { create } from "zustand";
import {
  getItems,
  saveItem,
  updateItem,
  deleteItem,
  markAsRead,
  getItemStats,
} from "../api/items.api";

export const useItemsStore = create((set, get) => ({
  // State
  items: [],
  stats: null,
  pagination: {},
  loading: false,
  saving: false,
  error: null,

  // Filters
  filters: {
    page: 1,
    limit: 12,
    sort: "newest",
    type: "",
    isFavorite: false,
    isArchived: false,
    search: "",
  },

  // ── Fetch Items ───────────────────────────────────────────────────────────
  fetchItems: async (overrideFilters = {}) => {
    set({ loading: true, error: null });
    try {
      const filters = { ...get().filters, ...overrideFilters };
      const params = {
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort,
        ...(filters.type && { type: filters.type }),
        ...(filters.isFavorite && { isFavorite: true }),
        ...(filters.isArchived && { isArchived: true }),
        ...(filters.search && { search: filters.search }),
      };
      const res = await getItems(params);
      set({
        items: res.data.items || [],
        pagination: res.data.pagination || {},
        loading: false,
      });
    } catch (err) {
      set({ error: err.response?.data?.message || "Failed to fetch items", loading: false });
    }
  },

  // ── Fetch Stats ───────────────────────────────────────────────────────────
  fetchStats: async () => {
    try {
      const res = await getItemStats();
      set({ stats: res.data.stats });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  },

  // ── Save Item ─────────────────────────────────────────────────────────────
  saveItem: async (data) => {
    set({ saving: true, error: null });
    try {
      const res = await saveItem(data);
      // Prepend new item to list
      set((state) => ({
        items: [res.data.item, ...state.items],
        saving: false,
      }));
      return { success: true, item: res.data.item };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to save item";
      set({ error: message, saving: false });
      return { success: false, error: message, duplicate: err.response?.data?.duplicate };
    }
  },

  // ── Update Item ───────────────────────────────────────────────────────────
  updateItem: async (id, data) => {
    try {
      const res = await updateItem(id, data);
      set((state) => ({
        items: state.items.map((i) => (i._id === id ? res.data.item : i)),
      }));
      return { success: true, item: res.data.item };
    } catch (err) {
      return { success: false, error: err.response?.data?.message };
    }
  },

  // ── Toggle Favorite ───────────────────────────────────────────────────────
  toggleFavorite: async (id) => {
    const item = get().items.find((i) => i._id === id);
    if (!item) return;
    // Optimistic update
    set((state) => ({
      items: state.items.map((i) =>
        i._id === id ? { ...i, isFavorite: !i.isFavorite } : i
      ),
    }));
    try {
      await updateItem(id, { isFavorite: !item.isFavorite });
    } catch {
      // Revert on error
      set((state) => ({
        items: state.items.map((i) =>
          i._id === id ? { ...i, isFavorite: item.isFavorite } : i
        ),
      }));
    }
  },

  // ── Delete Item ───────────────────────────────────────────────────────────
  deleteItem: async (id) => {
    try {
      await deleteItem(id);
      set((state) => ({
        items: state.items.filter((i) => i._id !== id),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message };
    }
  },

  // ── Mark as Read ──────────────────────────────────────────────────────────
  markAsRead: async (id) => {
    try {
      const res = await markAsRead(id);
      set((state) => ({
        items: state.items.map((i) => (i._id === id ? res.data.item : i)),
      }));
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  },

  // ── Set Filters ───────────────────────────────────────────────────────────
  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value, page: 1 },
    }));
  },

  setPage: (page) => {
    set((state) => ({ filters: { ...state.filters, page } }));
  },

  resetFilters: () => {
    set({
      filters: {
        page: 1, limit: 12, sort: "newest",
        type: "", isFavorite: false, isArchived: false, search: "",
      },
    });
  },

  // ── Clear ─────────────────────────────────────────────────────────────────
  clearItems: () => set({ items: [], pagination: {}, error: null }),
}));