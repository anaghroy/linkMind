import { create } from "zustand";
import { searchItems } from "../api/search.api";

export const useSearchStore = create((set, get) => ({
  // State
  query: "",
  mode: "hybrid",        // hybrid | semantic | text
  typeFilter: "",
  results: [],
  total: 0,
  resultMode: "",
  loading: false,
  searched: false,
  error: null,

  // ── Search ────────────────────────────────────────────────────────────────
  search: async (query, overrides = {}) => {
    const { mode, typeFilter } = get();
    const q = query ?? get().query;

    if (!q?.trim()) return;

    set({ loading: true, error: null, searched: true, query: q });

    try {
      const params = {
        q: q.trim(),
        mode: overrides.mode ?? mode,
        limit: 20,
        ...(overrides.type ?? typeFilter ? { type: overrides.type ?? typeFilter } : {}),
      };

      const res = await searchItems(params);
      set({
        results: res.data.results || [],
        total: res.data.total || 0,
        resultMode: res.data.mode || mode,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Search failed",
        loading: false,
        results: [],
      });
    }
  },

  // ── Set Query ─────────────────────────────────────────────────────────────
  setQuery: (query) => set({ query }),

  // ── Set Mode ─────────────────────────────────────────────────────────────
  setMode: (mode) => {
    set({ mode });
    // Re-search if already searched
    if (get().searched && get().query) {
      get().search(get().query, { mode });
    }
  },

  // ── Set Type Filter ───────────────────────────────────────────────────────
  setTypeFilter: (typeFilter) => {
    set({ typeFilter });
    if (get().searched && get().query) {
      get().search(get().query, { type: typeFilter });
    }
  },

  // ── Clear ─────────────────────────────────────────────────────────────────
  clearSearch: () => set({
    query: "", results: [], total: 0,
    searched: false, error: null, resultMode: "",
  }),
}));