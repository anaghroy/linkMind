import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCollections,
  getCollectionById,
  createCollection,
  deleteCollection,
} from "../../api/collections.api";
import { timeAgo } from "../../utils/timeAgo";
import { getTypeConfig } from "../../utils/typeColors";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#38bdf8", "#8b5cf6"];
const ICONS = ["folder", "star", "book", "code", "heart", "bolt"];
const ICON_SVG = {
  folder: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
  star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  code: <><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>,
  heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
  bolt: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></>,
};

export default function CollectionsPage() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [selected, setSelected] = useState(null);
  const [collectionData, setCollectionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [expandedIds, setExpandedIds] = useState({});

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const res = await getCollections();
      setCollections(res.data.collections || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCollection = async (col) => {
    setSelected(col);
    setItemsLoading(true);
    try {
      const res = await getCollectionById(col._id);
      setCollectionData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Delete this collection and all its subcollections?")) return;
    try {
      await deleteCollection(id);
      setCollections((prev) => prev.filter((c) => c._id !== id));
      if (selected?._id === id) {
        setSelected(null);
        setCollectionData(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleExpand = (e, id) => {
    e.stopPropagation();
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="collections-page">
      {/* Left panel — collection tree */}
      <aside className="collections-page__tree">
        <button
          className="collections-page__new-btn"
          onClick={() => setShowModal(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Collection
        </button>

        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div className="collections-page__tree-skeleton" key={i} />
          ))
        ) : collections.length === 0 ? (
          <p className="collections-page__tree-empty">
            No collections yet
          </p>
        ) : (
          collections.map((col) => (
            <CollectionTreeItem
              key={col._id}
              col={col}
              selected={selected}
              expandedIds={expandedIds}
              onSelect={handleSelectCollection}
              onDelete={handleDelete}
              onToggle={toggleExpand}
            />
          ))
        )}
      </aside>

      {/* Right panel — collection items */}
      <div className="collections-page__detail">
        {!selected ? (
          <div className="collections-page__empty">
            <span>🗂</span>
            <h3>Select a collection</h3>
            <p>Choose a collection from the left to view its items</p>
          </div>
        ) : (
          <CollectionDetail
            collection={selected}
            data={collectionData}
            loading={itemsLoading}
            onItemClick={(id) => navigate(`/library/${id}`)}
          />
        )}
      </div>

      {/* Create collection modal */}
      {showModal && (
        <CreateCollectionModal
          collections={collections}
          onClose={() => setShowModal(false)}
          onCreate={(newCol) => {
            setCollections((prev) => [...prev, newCol]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Collection Tree Item ─────────────────────────────────────────────────────

function CollectionTreeItem({ col, selected, expandedIds, onSelect, onDelete, onToggle }) {
  const isExpanded = expandedIds[col._id];
  const hasChildren = col.subcollections?.length > 0;

  return (
    <div className="col-tree-item">
      <div
        className={`col-tree-item__row${selected?._id === col._id ? " col-tree-item__row--active" : ""}`}
        onClick={() => onSelect(col)}
      >
        {/* Expand toggle */}
        <button
          className={`col-tree-item__expand${hasChildren ? "" : " col-tree-item__expand--hidden"}`}
          onClick={(e) => onToggle(e, col._id)}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Color dot */}
        <span
          className="col-tree-item__dot"
          style={{ background: col.color || "#6366f1" }}
        />

        {/* Name */}
        <span className="col-tree-item__name">{col.name}</span>

        {/* Count */}
        <span className="col-tree-item__count">{col.itemCount || 0}</span>

        {/* Delete */}
        <button
          className="col-tree-item__delete"
          onClick={(e) => onDelete(e, col._id)}
        >
          ×
        </button>
      </div>

      {/* Subcollections */}
      {isExpanded && hasChildren && (
        <div className="col-tree-item__children">
          {col.subcollections.map((sub) => (
            <div
              key={sub._id}
              className={`col-tree-item__sub${selected?._id === sub._id ? " col-tree-item__sub--active" : ""}`}
              onClick={() => onSelect(sub)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span
                className="col-tree-item__dot col-tree-item__dot--sm"
                style={{ background: sub.color || "#6366f1" }}
              />
              <span className="col-tree-item__name">{sub.name}</span>
              <span className="col-tree-item__count">{sub.itemCount || 0}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Collection Detail Panel ──────────────────────────────────────────────────

function CollectionDetail({ collection, data, loading, onItemClick }) {
  return (
    <div className="col-detail">
      {/* Header */}
      <div className="col-detail__header">
        <div className="col-detail__icon" style={{ background: collection.color + "22" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke={collection.color} strokeWidth="2">
            {ICON_SVG[collection.icon] || ICON_SVG.folder}
          </svg>
        </div>
        <div className="col-detail__info">
          <h2 className="col-detail__name">{collection.name}</h2>
          {collection.description && (
            <p className="col-detail__desc">{collection.description}</p>
          )}
        </div>
        <span className="col-detail__count">
          {collection.itemCount || 0}
          <span>Items</span>
        </span>
      </div>

      {/* Items grid */}
      {loading ? (
        <div className="col-detail__grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="col-detail__skeleton" key={i} />
          ))}
        </div>
      ) : !data?.items?.length ? (
        <div className="col-detail__empty">
          <p>No items in this collection yet</p>
          <span>Add items from the Library page</span>
        </div>
      ) : (
        <div className="col-detail__grid">
          {data.items.map((item) => {
            const typeConfig = getTypeConfig(item.type);
            return (
              <div
                key={item._id}
                className="col-detail__card"
                onClick={() => onItemClick(item._id)}
              >
                <div className="col-detail__card-thumb">
                  {item.metadata?.thumbnail ? (
                    <img src={item.metadata.thumbnail} alt={item.title}
                      onError={(e) => (e.target.style.display = "none")} />
                  ) : (
                    <div style={{ background: typeConfig.bg, width: "100%", height: "100%",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                      {typeConfig.icon}
                    </div>
                  )}
                  <span className="col-detail__card-type"
                    style={{ background: typeConfig.bg, color: typeConfig.color }}>
                    {typeConfig.label}
                  </span>
                </div>
                <div className="col-detail__card-body">
                  <h3 className="col-detail__card-title">{item.title}</h3>
                  {item.aiSummary && (
                    <p className="col-detail__card-summary">{item.aiSummary}</p>
                  )}
                  <span className="col-detail__card-time">{timeAgo(item.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Create Collection Modal ──────────────────────────────────────────────────

function CreateCollectionModal({ collections, onClose, onCreate }) {
  const [form, setForm] = useState({
    name: "", description: "", color: "#6366f1", icon: "folder", parent: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.parent) delete payload.parent;
      const res = await createCollection(payload);
      onCreate(res.data.collection);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="col-modal-overlay" onClick={onClose}>
      <div className="col-modal" onClick={(e) => e.stopPropagation()}>
        <div className="col-modal__header">
          <h3>New Collection</h3>
          <button className="col-modal__close" onClick={onClose}>×</button>
        </div>

        <form className="col-modal__form" onSubmit={handleSubmit}>
          <div className="col-modal__field">
            <label>NAME</label>
            <input
              type="text"
              placeholder="Collection name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>

          <div className="col-modal__field">
            <label>DESCRIPTION</label>
            <input
              type="text"
              placeholder="Optional description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="col-modal__field">
            <label>COLOR</label>
            <div className="col-modal__colors">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`col-modal__color-dot${form.color === c ? " col-modal__color-dot--active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setForm({ ...form, color: c })}
                />
              ))}
            </div>
          </div>

          <div className="col-modal__field">
            <label>PARENT COLLECTION (optional)</label>
            <select
              value={form.parent}
              onChange={(e) => setForm({ ...form, parent: e.target.value })}
            >
              <option value="">None (root collection)</option>
              {collections.filter((c) => !c.parent).map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {error && <p className="col-modal__error">{error}</p>}

          <button type="submit" className="col-modal__submit" disabled={loading}>
            {loading ? "Creating..." : "Create Collection"}
          </button>
        </form>
      </div>
    </div>
  );
}