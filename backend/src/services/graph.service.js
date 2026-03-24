import Item from "../models/item.model.js";
import cosineSimilarity from "../utils/cosineSimilarity.js";

export const getGraph = async (userId) => {
  const items = await Item.find({ user: userId });

  const nodes = items.map((i) => ({
    id: i._id,
    title: i.title,
  }));

  const edges = [];

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const sim = cosineSimilarity(
        items[i].embedding,
        items[j].embedding
      );

      if (sim > 0.8) {
        edges.push({
          source: items[i]._id,
          target: items[j]._id,
        });
      }
    }
  }

  return { nodes, edges };
};