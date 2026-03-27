import api from "./api.instance";

export const getClusters = (params) => api.get("/clusters", { params });
export const getClusterItems = (tag, params) =>
  api.get(`/clusters/${encodeURIComponent(tag)}`, { params });