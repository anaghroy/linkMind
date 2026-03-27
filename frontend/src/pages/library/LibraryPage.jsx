import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useItems } from "../../hooks/useItems";
import { useCollections } from "../../hooks/useCollections";
import LibraryItemCard from "./LibraryItemCard";
import { getTypeConfig } from "../../utils/typeColors";

const TYPE_FILTERS = [
  { label: "All Items", value: "" },
  { label: "Articles", value: "article" },
  { label: "YouTube", value: "youtube" },
  { label: "Tweets", value: "tweet" },
  { label: "PDFs", value: "pdf" },
  { label: "Notes", value: "note" },
];

const SORT_OPTIONS = [
  { label: "Date Added (Newest)", value: "newest" },
  { label: "Date Added (Oldest)", value: "oldest" },
  { label: "Recently Read", value: "recently_read" },
  { label: "Title A-Z", value: "title" },
];

export default function LibraryPage() {
  const navigate = useNavigate();

  const {
    items,
    pagination,
    loading,
    saving,
    filters,
    stats,
    typeCounts,       // ← real counts from DB via fetchStats()
    saveItem,
    deleteItem,
    toggleFavorite,
    fetchItems,
    fetchStats,
    setFilter,
    setPage,
  } = useItems(true);

  const {
    collections,
    addItem: addItemToCol,
    removeItem: removeItemFromCol,
  } = useCollections(true);

  const [url, setUrl] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [collectionPicker, setCollectionPicker] = useState(null);

  // Fetch real type counts on mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Close picker on outside click
  useEffect(() => {
    const handler = () => setCollectionPicker(null);
    if (collectionPicker) window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [collectionPicker]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSave = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    const result = await saveItem({ url: url.trim() });
    if (result.success) {
      setUrl("");
      setSaveMsg("✓ Saved! AI is processing...");
      setTimeout(() => setSaveMsg(""), 3000);
    } else if (result.duplicate) {
      setSaveMsg("⚠ This URL is already in your library");
      setTimeout(() => setSaveMsg(""), 3000);
    } else {
      setSaveMsg("✗ " + (result.error || "Failed to save"));
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  const handleFavorite = async (e, item) => {
    e.stopPropagation();
    await toggleFavorite(item._id);
  };

  const handleDelete = async (e, itemId) => {
    e.stopPropagation();
    if (!confirm("Delete this item?")) return;
    await deleteItem(itemId);
  };

  const handleAddToCollection = async (e, itemId, collectionId) => {
    e.stopPropagation();
    await addItemToCol(collectionId, itemId);
    fetchItems();
    setCollectionPicker(null);
  };

  const handleRemoveFromCollection = async (e, itemId) => {
    e.stopPropagation();
    const item = items.find((i) => i._id === itemId);
    const colId = item?.collections?._id || item?.collections;
    if (!colId) return;
    await removeItemFromCol(colId, itemId);
    fetchItems();
    setCollectionPicker(null);
  };

  // ── Type count helper ──────────────────────────────────────────────────────
  // Uses real DB counts from fetchStats(), not current page items
  const getTypeCount = (typeValue) => {
    if (!typeValue) {
      // "All Items" → total from stats
      return stats?.total ?? pagination?.total ?? 0;
    }
    // Per-type count from stats.byType
    return typeCounts?.[typeValue] ?? 0;
  };

  return (
    <div className="library">
      {/* ── Left filters sidebar ── */}
      <aside className="library__filters">
        <div className="library__filters-section">
          <span className="library__filters-label">TYPE FILTER</span>
          <div className="library__type-list">
            {TYPE_FILTERS.map((f) => {
              const config = f.value ? getTypeConfig(f.value) : null;
              return (
                <button
                  key={f.value}
                  className={`library__type-btn${
                    filters.type === f.value ? " library__type-btn--active" : ""
                  }`}
                  onClick={() => setFilter("type", f.value)}
                >
                  <span className="library__type-btn-left">
                    {config && (
                      <span
                        className="library__type-dot"
                        style={{ background: config.color }}
                      />
                    )}
                    {f.label}
                  </span>
                  {/* ✅ Real count from DB stats */}
                  <span className="library__type-count">
                    {getTypeCount(f.value)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="library__filters-section">
          <span className="library__filters-label">QUICK SORT</span>
          <select
            className="library__sort-select"
            value={filters.sort}
            onChange={(e) => setFilter("sort", e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="library__filters-section">
          <button
            className={`library__fav-btn${
              filters.isFavorite ? " library__fav-btn--active" : ""
            }`}
            onClick={() => setFilter("isFavorite", !filters.isFavorite)}
          >
            <span>Favorites Only</span>
            <svg
              width="14" height="14" viewBox="0 0 24 24"
              fill={filters.isFavorite ? "#f59e0b" : "none"}
              stroke="#f59e0b" strokeWidth="2"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </div>

        {/* Collections — itemCount from store, always synced */}
        {collections.length > 0 && (
          <div className="library__filters-section">
            <span className="library__filters-label">COLLECTIONS</span>
            <div className="library__type-list">
              {collections.map((col) => (
                <button
                  key={col._id}
                  className="library__type-btn"
                  onClick={() => navigate("/collections")}
                >
                  <span className="library__type-btn-left">
                    <span
                      className="library__type-dot"
                      style={{ background: col.color || "#6366f1" }}
                    />
                    {col.name}
                  </span>
                  <span className="library__type-count">
                    {col.itemCount || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <div className="library__main">
        {/* Save bar */}
        <form className="library__savebar" onSubmit={handleSave}>
          <span className="library__savebar-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </span>
          <input
            type="url"
            className="library__savebar-input"
            placeholder="Paste a URL to architect your knowledge..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="submit"
            className="library__savebar-btn"
            disabled={saving}
          >
            {saving ? "SAVING..." : "SAVE TO LIBRARY"}
          </button>
        </form>

        {saveMsg && (
          <p
            className={`library__save-msg${
              saveMsg.startsWith("✓")
                ? " library__save-msg--success"
                : " library__save-msg--error"
            }`}
          >
            {saveMsg}
          </p>
        )}

        {/* Items grid */}
        {loading ? (
          <div className="library__grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div className="library__skeleton" key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="library__empty">
            <span className="library__empty-icon">🔗</span>
            <h3>No items yet</h3>
            <p>Paste a URL above to save your first link</p>
          </div>
        ) : (
          <>
            <div className="library__grid">
              {items.map((item) => (
                <LibraryItemCard
                  key={item._id}
                  item={item}
                  collections={collections}
                  collectionPickerOpen={collectionPicker === item._id}
                  onClick={() => navigate(`/library/${item._id}`)}
                  onFavorite={(e) => handleFavorite(e, item)}
                  onDelete={(e) => handleDelete(e, item._id)}
                  onOpenPicker={(e) => {
                    e.stopPropagation();
                    setCollectionPicker(
                      collectionPicker === item._id ? null : item._id
                    );
                  }}
                  onAddToCollection={(e, colId) =>
                    handleAddToCollection(e, item._id, colId)
                  }
                  onRemoveFromCollection={(e) =>
                    handleRemoveFromCollection(e, item._id)
                  }
                />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="library__pagination">
                <button
                  className="library__page-btn"
                  disabled={filters.page === 1}
                  onClick={() => setPage(filters.page - 1)}
                >
                  ← Prev
                </button>
                <span className="library__page-info">
                  {filters.page} / {pagination.totalPages}
                </span>
                <button
                  className="library__page-btn"
                  disabled={!pagination.hasMore}
                  onClick={() => setPage(filters.page + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}