import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api.instance";
import { getTypeConfig } from "../../utils/typeColors";
import { timeAgo } from "../../utils/timeAgo";

// Cluster colors — cycles through these
const CLUSTER_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444",
  "#38bdf8", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f97316", "#84cc16", "#06b6d4", "#a855f7",
];

export default function ClustersPage() {
  const navigate = useNavigate();
  const [clusters, setClusters] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [clusterItems, setClusterItems] = useState([]);
  const [clusterItemsLoading, setClusterItemsLoading] = useState(false);

  useEffect(() => {
    fetchClusters();
  }, []);

  const fetchClusters = async () => {
    setLoading(true);
    try {
      const res = await api.get("/clusters");
      setClusters(res.data.clusters || []);
      setTotalItems(res.data.totalItems || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCluster = async (cluster) => {
    setSelectedCluster(cluster);
    setClusterItemsLoading(true);
    try {
      const res = await api.get(`/clusters/${encodeURIComponent(cluster.tag)}`);
      setClusterItems(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setClusterItemsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="clusters-page">
        <div className="clusters-page__header">
          <h1 className="clusters-page__title">Topic Clusters</h1>
          <p className="clusters-page__sub">Analysing your knowledge base...</p>
        </div>
        <div className="clusters-page__grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="cluster-card cluster-card--skeleton" key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="clusters-page">
      {/* Header */}
      <div className="clusters-page__header">
        <div>
          <h1 className="clusters-page__title">Topic Clusters</h1>
          <p className="clusters-page__sub">
            {clusters.length} clusters discovered across {totalItems} items
          </p>
        </div>
        <button className="clusters-page__refresh-btn" onClick={fetchClusters}>
          ⟳ Refresh
        </button>
      </div>

      {clusters.length === 0 ? (
        <div className="clusters-page__empty">
          <span>🧠</span>
          <h3>No clusters yet</h3>
          <p>Save more items and let AI process them to discover topic clusters.</p>
          <button
            className="clusters-page__empty-btn"
            onClick={() => navigate("/library")}
          >
            Go to Library
          </button>
        </div>
      ) : (
        <div className="clusters-page__layout">
          {/* Cluster cards grid */}
          <div className="clusters-page__grid">
            {clusters.map((cluster, index) => (
              <ClusterCard
                key={cluster.tag}
                cluster={cluster}
                color={CLUSTER_COLORS[index % CLUSTER_COLORS.length]}
                isSelected={selectedCluster?.tag === cluster.tag}
                onClick={() => handleSelectCluster(cluster)}
              />
            ))}
          </div>

          {/* Selected cluster detail */}
          {selectedCluster && (
            <ClusterDetail
              cluster={selectedCluster}
              items={clusterItems}
              loading={clusterItemsLoading}
              color={CLUSTER_COLORS[clusters.findIndex((c) => c.tag === selectedCluster.tag) % CLUSTER_COLORS.length]}
              onClose={() => setSelectedCluster(null)}
              onItemClick={(id) => navigate(`/library/${id}`)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Cluster Card ─────────────────────────────────────────────────────────────

function ClusterCard({ cluster, color, isSelected, onClick }) {
  return (
    <div
      className={`cluster-card${isSelected ? " cluster-card--selected" : ""}`}
      style={{ "--cluster-color": color }}
      onClick={onClick}
    >
      {/* Top accent bar */}
      <div className="cluster-card__bar" style={{ background: color }} />

      {/* Header */}
      <div className="cluster-card__header">
        <div className="cluster-card__icon" style={{ background: `${color}18`, borderColor: `${color}30` }}>
          <span className="cluster-card__icon-text" style={{ color }}>
            {cluster.tag.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="cluster-card__count-wrap">
          <span className="cluster-card__count" style={{ color }}>{cluster.itemCount}</span>
          <span className="cluster-card__count-label">items</span>
        </div>
      </div>

      {/* Tag name */}
      <h3 className="cluster-card__tag">#{cluster.tag}</h3>

      {/* Related tags */}
      {cluster.relatedTags?.length > 0 && (
        <div className="cluster-card__related">
          {cluster.relatedTags.slice(0, 3).map((t) => (
            <span className="cluster-card__related-tag" key={t}>#{t}</span>
          ))}
        </div>
      )}

      {/* Preview thumbnails */}
      <div className="cluster-card__preview">
        {cluster.preview.slice(0, 3).map((item) => {
          const typeConfig = getTypeConfig(item.type);
          return (
            <div className="cluster-card__preview-item" key={item._id}>
              {item.thumbnail ? (
                <img src={item.thumbnail} alt={item.title}
                  onError={(e) => (e.target.style.display = "none")} />
              ) : (
                <div style={{ background: typeConfig.bg, width: "100%", height: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                  {typeConfig.icon}
                </div>
              )}
            </div>
          );
        })}
        {cluster.itemCount > 3 && (
          <div className="cluster-card__preview-more" style={{ background: `${color}18`, color }}>
            +{cluster.itemCount - 3}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Cluster Detail ───────────────────────────────────────────────────────────

function ClusterDetail({ cluster, items, loading, color, onClose, onItemClick }) {
  return (
    <div className="cluster-detail">
      <div className="cluster-detail__header">
        <div className="cluster-detail__title-row">
          <h2 className="cluster-detail__title" style={{ color }}>
            #{cluster.tag}
          </h2>
          <span className="cluster-detail__count">{cluster.itemCount} items</span>
        </div>
        {cluster.relatedTags?.length > 0 && (
          <div className="cluster-detail__related">
            <span className="cluster-detail__related-label">Related topics:</span>
            {cluster.relatedTags.map((t) => (
              <span className="cluster-detail__related-tag" key={t}>#{t}</span>
            ))}
          </div>
        )}
        <button className="cluster-detail__close" onClick={onClose}>×</button>
      </div>

      <div className="cluster-detail__items">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div className="cluster-detail__skeleton" key={i} />
          ))
        ) : (
          items.map((item) => {
            const typeConfig = getTypeConfig(item.type);
            return (
              <div
                key={item._id}
                className="cluster-detail__item"
                onClick={() => onItemClick(item._id)}
              >
                <div className="cluster-detail__item-thumb">
                  {item.metadata?.thumbnail ? (
                    <img src={item.metadata.thumbnail} alt={item.title}
                      onError={(e) => (e.target.style.display = "none")} />
                  ) : (
                    <div style={{ background: typeConfig.bg, width: "100%", height: "100%",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {typeConfig.icon}
                    </div>
                  )}
                </div>
                <div className="cluster-detail__item-info">
                  <span className="cluster-detail__item-type" style={{ color: typeConfig.color }}>
                    {typeConfig.label}
                  </span>
                  <p className="cluster-detail__item-title">{item.title}</p>
                  {item.aiSummary && (
                    <p className="cluster-detail__item-summary">{item.aiSummary}</p>
                  )}
                  <span className="cluster-detail__item-time">{timeAgo(item.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}