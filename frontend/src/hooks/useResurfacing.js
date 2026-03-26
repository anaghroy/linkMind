import { useState, useEffect } from "react";
import { getResurfaced, markSeen } from "../api/resurfacing.api";

export function useResurfacing(limit = 5) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResurfaced();
  }, [limit]);

  const fetchResurfaced = async () => {
    setLoading(true);
    try {
      const res = await getResurfaced(limit);
      setItems(res.data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  const markItemsSeen = async (itemIds) => {
    try {
      await markSeen(itemIds);
      setItems((prev) => prev.filter((i) => !itemIds.includes(i._id)));
    } catch (err) {
      console.error("Failed to mark seen:", err);
    }
  };

  return { items, loading, error, markItemsSeen, refetch: fetchResurfaced };
}