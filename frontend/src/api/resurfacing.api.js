import api from "./api.instance";

export const getResurfaced = (limit = 5) =>
  api.get("/resurfacing", { params: { limit } });

export const markSeen = (itemIds) =>
  api.post("/resurfacing/seen", { itemIds });

export const getResurfacingStats = () =>
  api.get("/resurfacing/stats");