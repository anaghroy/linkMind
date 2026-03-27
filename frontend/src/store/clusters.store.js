import { create } from "zustand";
import { getClusters, getClusterItems } from "../api/clusters.api";

export const useClustersStore = create((set, get) => ({
  // State
  clusters: [],
  totalItems: 0,
  totalClusters: 0,
  selectedCluster: null,
  clusterItems: [],
  clusterPagination: {},
  loading: false,
  itemsLoading: false,
  error: null,

  // ── Fetch Clusters ────────────────────────────────────────────────────────
  fetchClusters: async (options = {}) => {
    set({ loading: true, error: null });
    try {
      const res = await getClusters(options);
      set({
        clusters: res.data.clusters || [],
        totalItems: res.data.totalItems || 0,
        totalClusters: res.data.totalClusters || 0,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to fetch clusters",
        loading: false,
      });
    }
  },

  // ── Select Cluster + Fetch Its Items ──────────────────────────────────────
  selectCluster: async (cluster, options = {}) => {
    set({ selectedCluster: cluster, itemsLoading: true, clusterItems: [] });
    try {
      const res = await getClusterItems(cluster.tag, options);
      set({
        clusterItems: res.data.items || [],
        clusterPagination: res.data.pagination || {},
        itemsLoading: false,
      });
    } catch (err) {
      set({ itemsLoading: false });
    }
  },

  // ── Clear Selection ───────────────────────────────────────────────────────
  clearSelected: () =>
    set({ selectedCluster: null, clusterItems: [], clusterPagination: {} }),

  // ── Clear All ─────────────────────────────────────────────────────────────
  clearClusters: () =>
    set({
      clusters: [],
      totalItems: 0,
      totalClusters: 0,
      selectedCluster: null,
      clusterItems: [],
      error: null,
    }),
}));