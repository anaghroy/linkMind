import api from "./api.instance";

export const searchItems = (params) => api.get("/search", { params });
export const getSimilarItems = (itemId, limit = 5) =>
  api.get(`/search/similar/${itemId}`, { params: { limit } });
