import * as graphService from "../services/graph.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getGraph = asyncHandler(async (req, res) => {
  const data = await graphService.getGraph(req.user.id);
  res.json(data);
});