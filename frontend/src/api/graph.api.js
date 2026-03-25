import api from "./api.instance";

export const getGraph = (params) => api.get("/graph", { params });
export const buildGraph = () => api.post("/graph/build");
export const getGraphStats = () => api.get("/graph/stats");
export const getItemConnections = (itemId) => api.get(`/graph/item/${itemId}`);
export const rebuildGraph = () => api.delete("/graph");