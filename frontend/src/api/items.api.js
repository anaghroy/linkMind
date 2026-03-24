import api from "./api.instance";

export const getItems = (params) => api.get("/items", { params });
export const getItemById = (id) => api.get(`/items/${id}`);
export const saveItem = (data) => api.post("/items", data);
export const updateItem = (id, data) => api.patch(`/items/${id}`, data);
export const deleteItem = (id) => api.delete(`/items/${id}`);
export const markAsRead = (id) => api.patch(`/items/${id}/read`);
export const getItemStats = () => api.get("/items/stats");
export const addHighlight = (id, data) => api.post(`/items/${id}/highlights`, data);
export const removeHighlight = (id, hid) => api.delete(`/items/${id}/highlights/${hid}`);