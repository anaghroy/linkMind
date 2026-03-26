import { useEffect } from "react";
import { useItemsStore } from "../store/items.store";
import { useUIStore } from "../store/ui.store";

export function useItems(autoFetch = true) {
  const store = useItemsStore();
  const { toastSuccess, toastError } = useUIStore();

  useEffect(() => {
    if (autoFetch) {
      store.fetchItems();
    }
  }, [autoFetch]);

  // Re-fetch when filters change
  useEffect(() => {
    if (autoFetch) {
      store.fetchItems();
    }
  }, [store.filters]);

  const saveItem = async (data) => {
    const result = await store.saveItem(data);
    if (result.success) {
      toastSuccess("Item saved! AI is processing...");
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
      toastError(result.error || "Failed to delete item");
    }
    return result;
  };

  const toggleFavorite = async (id) => {
    await store.toggleFavorite(id);
  };

  return {
    items: store.items,
    stats: store.stats,
    pagination: store.pagination,
    loading: store.loading,
    saving: store.saving,
    error: store.error,
    filters: store.filters,
    saveItem,
    deleteItem,
    toggleFavorite,
    updateItem: store.updateItem,
    markAsRead: store.markAsRead,
    fetchItems: store.fetchItems,
    fetchStats: store.fetchStats,
    setFilter: store.setFilter,
    setPage: store.setPage,
    resetFilters: store.resetFilters,
  };
}