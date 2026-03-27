import { useEffect } from "react";
import { useClustersStore } from "../store/clusters.store";
import { useUIStore } from "../store/ui.store";

export function useClusters(autoFetch = true) {
  const store = useClustersStore();
  const { toastError } = useUIStore();

  useEffect(() => {
    if (autoFetch) {
      store.fetchClusters();
    }
  }, [autoFetch]);

  const selectCluster = async (cluster) => {
    await store.selectCluster(cluster);
  };

  const refresh = async () => {
    await store.fetchClusters();
  };

  return {
    clusters: store.clusters,
    totalItems: store.totalItems,
    totalClusters: store.totalClusters,
    selectedCluster: store.selectedCluster,
    clusterItems: store.clusterItems,
    clusterPagination: store.clusterPagination,
    loading: store.loading,
    itemsLoading: store.itemsLoading,
    error: store.error,
    selectCluster,
    clearSelected: store.clearSelected,
    refresh,
  };
}