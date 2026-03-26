import { useEffect } from "react";
import { useCollectionsStore } from "../store/collections.store";
import { useUIStore } from "../store/ui.store";

export function useCollections(autoFetch = true) {
  const store = useCollectionsStore();
  const { toastSuccess, toastError } = useUIStore();

  useEffect(() => {
    if (autoFetch) {
      store.fetchCollections();
    }
  }, [autoFetch]);

  const createCollection = async (data) => {
    const result = await store.createCollection(data);
    if (result.success) {
      toastSuccess("Collection created!");
    } else {
      toastError(result.error || "Failed to create collection");
    }
    return result;
  };

  const deleteCollection = async (id) => {
    const result = await store.deleteCollection(id);
    if (result.success) {
      toastSuccess("Collection deleted");
    } else {
      toastError(result.error || "Failed to delete collection");
    }
    return result;
  };

  const addItem = async (collectionId, itemId) => {
    const result = await store.addItem(collectionId, itemId);
    if (result.success) {
      toastSuccess("Item added to collection");
    } else {
      toastError(result.error || "Failed to add item");
    }
    return result;
  };

  const removeItem = async (collectionId, itemId) => {
    const result = await store.removeItem(collectionId, itemId);
    if (result.success) {
      toastSuccess("Item removed from collection");
    } else {
      toastError(result.error || "Failed to remove item");
    }
    return result;
  };

  return {
    collections: store.collections,
    selectedCollection: store.selectedCollection,
    collectionItems: store.collectionItems,
    collectionPagination: store.collectionPagination,
    loading: store.loading,
    itemsLoading: store.itemsLoading,
    error: store.error,
    fetchCollections: store.fetchCollections,
    selectCollection: store.selectCollection,
    createCollection,
    updateCollection: store.updateCollection,
    deleteCollection,
    addItem,
    removeItem,
    clearSelected: store.clearSelected,
  };
}