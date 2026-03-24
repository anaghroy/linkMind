import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getResurfaced, markSeen } from "../../api/resurfacing.api";
import { getTypeConfig } from "../../utils/typeColors";

export default function ResurfacingSection() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResurfaced(5)
      .then((res) => setItems(res.data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleReadNow = async (item) => {
    try {
      await markSeen([item._id]);
    } catch { /* ignore */ }
    navigate(`/library/${item._id}`);
  };

  if (!loading && items.length === 0) return null;

  return (
    <section className="resurface-section">
      <div className="resurface-section__header">
        <div className="resurface-section__title">
          <span>🧠</span>
          <h2>From Your Memory</h2>
        </div>
        <span className="resurface-section__sub">
          Things you saved and might have forgotten
        </span>
      </div>

      <div className="resurface-section__scroll">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div className="resurface-card resurface-card--skeleton" key={i} />
            ))
          : items.map((item) => (
              <ResurfaceCard
                key={item._id}
                item={item}
                onReadNow={() => handleReadNow(item)}
              />
            ))}
      </div>
    </section>
  );
}

function ResurfaceCard({ item, onReadNow }) {
  const typeConfig = getTypeConfig(item.type);

  return (
    <div className="resurface-card">
      {/* Tags */}
      <div className="resurface-card__tags">
        {(item.aiTags || []).slice(0, 2).map((tag) => (
          <span className="resurface-card__tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>

      {/* Title */}
      <h3 className="resurface-card__title">{item.title}</h3>

      {/* Summary */}
      {item.aiSummary && (
        <p className="resurface-card__summary">{item.aiSummary}</p>
      )}

      {/* Context */}
      {item.resurfaceContext && (
        <p className="resurface-card__context">
          {item.resurfaceContext.message}
        </p>
      )}

      {/* Read Now */}
      <button className="resurface-card__btn" onClick={onReadNow}>
        Read Now
      </button>
    </div>
  );
}