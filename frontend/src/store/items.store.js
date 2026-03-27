import { create } from "zustand";
import {
  getItems,
  getItemById,
  saveItem,
  updateItem,
  deleteItem,
  markAsRead,
  getItemStats,
} from "../api/items.api";

export const useItemsStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  items: [],
  currentItem: null,
  stats: null,
  typeCounts: {},       // ← real counts per type from backend
  pagination: {},
  loading: false,
  saving: false,
  error: null,

  // ── Filters ────────────────────────────────────────────────────────────────
  filters: {
    page: 1,
    limit: 12,
    sort: "newest",
    type: "",
    isFavorite: false,
    isArchived: false,
    search: "",
  },

  // ── Fetch Items ────────────────────────────────────────────────────────────
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
      set({
        error: err.response?.data?.message || "Failed to fetch items",
        loading: false,
      });
    }
  },

  // ── Fetch Stats + Type Counts ──────────────────────────────────────────────
  // This gives us REAL counts per type from the DB, not just current page
  fetchStats: async () => {
    try {
      const res = await getItemStats();
      const stats = res.data.stats;
      set({
        stats,
        typeCounts: stats?.byType || {},
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  },

  // ── Fetch Single Item ──────────────────────────────────────────────────────
  fetchItemById: async (id) => {
    set({ loading: true, currentItem: null, error: null });
    try {
      const res = await getItemById(id);
      set({ currentItem: res.data.item, loading: false });
      return res.data.item;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Item not found",
        loading: false,
      });
      return null;
    }
  },

  // ── Save Item ──────────────────────────────────────────────────────────────
  saveItem: async (data) => {
    set({ saving: true, error: null });
    try {
      const res = await saveItem(data);
      set((state) => ({
        items: [res.data.item, ...state.items],
        saving: false,
      }));
      // Refresh stats so type counts update
      get().fetchStats();
      return { success: true, item: res.data.item };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to save item";
      const duplicate = err.response?.data?.duplicate || false;
      set({ error: message, saving: false });
      return { success: false, error: message, duplicate };
    }
  },

  // ── Update Item ────────────────────────────────────────────────────────────
  updateItem: async (id, data) => {
    try {
      const res = await updateItem(id, data);
      const updated = res.data.item;
      set((state) => ({
        items: state.items.map((i) => (i._id === id ? updated : i)),
        currentItem:
          state.currentItem?._id === id ? updated : state.currentItem,
      }));
      return { success: true, item: updated };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Failed to update",
      };
    }
  },

  // ── Toggle Favorite (optimistic) ───────────────────────────────────────────
  toggleFavorite: async (id) => {
    const item = get().items.find((i) => i._id === id);
    if (!item) return;
    set((state) => ({
      items: state.items.map((i) =>
        i._id === id ? { ...i, isFavorite: !i.isFavorite } : i
      ),
    }));
    try {
      await updateItem(id, { isFavorite: !item.isFavorite });
    } catch {
      set((state) => ({
        items: state.items.map((i) =>
          i._id === id ? { ...i, isFavorite: item.isFavorite } : i
        ),
      }));
    }
  },

  // ── Delete Item ────────────────────────────────────────────────────────────
  deleteItem: async (id) => {
    try {
      await deleteItem(id);
      set((state) => ({
        items: state.items.filter((i) => i._id !== id),
        currentItem:
          state.currentItem?._id === id ? null : state.currentItem,
      }));
      // Refresh stats so type counts update
      get().fetchStats();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Failed to delete",
      };
    }
  },

  // ── Mark as Read ───────────────────────────────────────────────────────────
  markAsRead: async (id) => {
    try {
      const res = await markAsRead(id);
      const updated = res.data.item;
      set((state) => ({
        items: state.items.map((i) => (i._id === id ? updated : i)),
        currentItem:
          state.currentItem?._id === id ? updated : state.currentItem,
      }));
      return { success: true, item: updated };
    } catch (err) {
      return { success: false };
    }
  },

  // ── Set Filter ─────────────────────────────────────────────────────────────
  setFilter: (key, value) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
        page: key !== "page" ? 1 : value,
      },
    }));
  },

  // ── Set Page ───────────────────────────────────────────────────────────────
  setPage: (page) => {
    set((state) => ({
      filters: { ...state.filters, page },
    }));
  },

  // ── Reset Filters ──────────────────────────────────────────────────────────
  resetFilters: () => {
    set({
      filters: {
        page: 1,
        limit: 12,
        sort: "newest",
        type: "",
        isFavorite: false,
        isArchived: false,
        search: "",
      },
    });
  },

  // ── Clear ──────────────────────────────────────────────────────────────────
  clearItems: () => set({ items: [], pagination: {}, error: null }),
  clearCurrentItem: () => set({ currentItem: null }),
}));