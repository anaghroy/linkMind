import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getItems } from "../../api/items.api";
import { timeAgo } from "../../utils/timeAgo";
import { getTypeConfig } from "../../utils/typeColors";

export default function RecentSaves() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getItems({ limit: 8, sort: "newest" })
      .then((res) => setItems(res.data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="recent-saves">
      <div className="recent-saves__header">
        <h2 className="recent-saves__title">Recently Saved</h2>
        <Link to="/library" className="recent-saves__view-all">
          View All →
        </Link>
      </div>

      <div className="recent-saves__grid">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div className="recent-saves__skeleton" key={i} />
            ))
          : items.map((item) => (
              <RecentItemCard key={item._id} item={item} />
            ))}
      </div>
    </section>
  );
}

function RecentItemCard({ item }) {
  const navigate = useNavigate();
  const typeConfig = getTypeConfig(item.type);

  return (
    <div
      className="recent-item-card"
      onClick={() => navigate(`/library/${item._id}`)}
    >
      {/* Thumbnail */}
      <div className="recent-item-card__thumb">
        {item.metadata?.thumbnail ? (
          <img
            src={item.metadata.thumbnail}
            alt={item.title}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div
            className="recent-item-card__thumb-fallback"
            style={{ background: typeConfig.bg }}
          >
            <span>{typeConfig.icon}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="recent-item-card__body">
        {/* Source */}
        <div className="recent-item-card__source">
          {item.metadata?.favicon && (
            <img
              src={item.metadata.favicon}
              alt=""
              className="recent-item-card__favicon"
              onError={(e) => (e.target.style.display = "none")}
            />
          )}
          <span className="recent-item-card__site">
            {item.metadata?.siteName || item.type}
          </span>
          <span className="recent-item-card__dot">•</span>
          <span className="recent-item-card__time">
            {timeAgo(item.createdAt)}
          </span>
        </div>

        {/* Title */}
        <h3 className="recent-item-card__title">{item.title}</h3>

        {/* Tags */}
        {item.aiTags?.length > 0 && (
          <div className="recent-item-card__tags">
            {item.aiTags.slice(0, 2).map((tag) => (
              <span className="recent-item-card__tag" key={tag}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}