import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api.instance";
import { getTypeConfig } from "../../utils/typeColors";
import { timeAgo } from "../../utils/timeAgo";

export default function SimilarItems({ itemId }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/search/similar/${itemId}`)
      .then((res) => setItems(res.data.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [itemId]);

  if (!loading && items.length === 0) return null;

  return (
    <div className="similar-items">
      <span className="item-detail__section-label">🔗 SIMILAR ITEMS</span>
      <div className="similar-items__list">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div className="similar-items__skeleton" key={i} />
            ))
          : items.map((item) => {
              const typeConfig = getTypeConfig(item.type);
              return (
                <div
                  key={item._id}
                  className="similar-items__card"
                  onClick={() => navigate(`/library/${item._id}`)}
                >
                  <div className="similar-items__thumb">
                    {item.metadata?.thumbnail ? (
                      <img
                        src={item.metadata.thumbnail}
                        alt={item.title}
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    ) : (
                      <div
                        className="similar-items__thumb-fallback"
                        style={{ background: typeConfig.bg }}
                      >
                        {typeConfig.icon}
                      </div>
                    )}
                  </div>
                  <div className="similar-items__info">
                    <span
                      className="similar-items__type"
                      style={{ color: typeConfig.color }}
                    >
                      {typeConfig.label}
                    </span>
                    <p className="similar-items__title">{item.title}</p>
                    <span className="similar-items__time">
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
