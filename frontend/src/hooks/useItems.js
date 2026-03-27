import { useEffect, useRef } from "react";
import { useItemsStore } from "../store/items.store";
import { useUIStore } from "../store/ui.store";

export function useItems(autoFetch = true) {
  const store = useItemsStore();
  const { toastSuccess, toastError } = useUIStore();
  const prevFiltersRef = useRef(null);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      store.fetchItems();
    }
  }, [autoFetch]);

  // Re-fetch when filters change
  useEffect(() => {
    if (!autoFetch) return;
    const currentFilters = JSON.stringify(store.filters);
    if (prevFiltersRef.current === null) {
      prevFiltersRef.current = currentFilters;
      return;
    }
    if (prevFiltersRef.current !== currentFilters) {
      prevFiltersRef.current = currentFilters;
      store.fetchItems();
    }
  });

  const saveItem = async (data) => {
    const result = await store.saveItem(data);
    if (result.success) {
      toastSuccess("Saved! AI is processing...");
    } else if (result.duplicate) {
      toastError("This URL is already in your library");
    } else {
      toastError(result.error || "Failed to save item");
    }
    return result;
  };

  const deleteItem = async (id) => {
    const result = await store.deleteItem(id);
    if (result.success) {
      toastSuccess("Item deleted");
    } else {
      toastError(result.error || "Failed to delete");
    }
    return result;
  };

  const toggleFavorite = async (id) => {
    await store.toggleFavorite(id);
  };

  const markAsRead = async (id) => {
    const result = await store.markAsRead(id);
    if (result.success) toastSuccess("Marked as read");
    return result;
  };

  return {
    items: store.items,
    currentItem: store.currentItem,
    stats: store.stats,
    typeCounts: store.typeCounts,  
    pagination: store.pagination,
    loading: store.loading,
    saving: store.saving,
    error: store.error,
    filters: store.filters,
    saveItem,
    deleteItem,
    toggleFavorite,
    markAsRead,
    updateItem: store.updateItem,
    fetchItems: store.fetchItems,
    fetchStats: store.fetchStats,
    fetchItemById: store.fetchItemById,
    setFilter: store.setFilter,
    setPage: store.setPage,
    resetFilters: store.resetFilters,
    clearItems: store.clearItems,
    clearCurrentItem: store.clearCurrentItem,
  };
}