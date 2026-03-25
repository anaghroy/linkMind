import api from "./api.instance";

export const getCollections = () => api.get("/collections");
export const getCollectionById = (id, params) =>
  api.get(`/collections/${id}`, { params });
export const createCollection = (data) => api.post("/collections", data);
export const updateCollection = (id, data) =>
  api.patch(`/collections/${id}`, data);
export const deleteCollection = (id) => api.delete(`/collections/${id}`);
export const addItemToCollection = (id, itemId) =>
  api.post(`/collections/${id}/items/${itemId}`);
export const removeItemFromCollection = (id, itemId) =>
  api.delete(`/collections/${id}/items/${itemId}`);
