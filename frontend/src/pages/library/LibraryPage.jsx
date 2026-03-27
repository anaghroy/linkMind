import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getItems, saveItem, updateItem, deleteItem } from "../../api/items.api";
import { getCollections, addItemToCollection, removeItemFromCollection } from "../../api/collections.api";
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
  const [items, setItems] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [collectionPicker, setCollectionPicker] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page, limit: 12, sort,
        ...(typeFilter && { type: typeFilter }),
        ...(favoritesOnly && { isFavorite: true }),
      };
      const res = await getItems(params);
      setItems(res.data.items || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, sort, typeFilter, favoritesOnly]);

  useEffect(() => {
    fetchItems();
    getCollections().then((res) => setCollections(res.data.collections || [])).catch(console.error);
  }, [fetchItems]);

  // Close picker on outside click
  useEffect(() => {
    const handler = () => setCollectionPicker(null);
    if (collectionPicker) window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [collectionPicker]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await saveItem({ url: url.trim() });
      setUrl("");
      setSaveMsg("✓ Saved! AI is processing...");
      setTimeout(() => setSaveMsg(""), 3000);
      fetchItems();
    } catch (err) {
      setSaveMsg(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleFavorite = async (e, item) => {
    e.stopPropagation();
    try {
      await updateItem(item._id, { isFavorite: !item.isFavorite });
      setItems((prev) => prev.map((i) => i._id === item._id ? { ...i, isFavorite: !i.isFavorite } : i));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (e, itemId) => {
    e.stopPropagation();
    if (!confirm("Delete this item?")) return;
    try {
      await deleteItem(itemId);
      setItems((prev) => prev.filter((i) => i._id !== itemId));
    } catch (err) { console.error(err); }
  };

  const handleAddToCollection = async (e, itemId, collectionId) => {
    e.stopPropagation();
    try {
      await addItemToCollection(collectionId, itemId);
      setItems((prev) => prev.map((i) => i._id === itemId ? { ...i, collections: collectionId } : i));
      // Update collection item count
      setCollections((prev) => prev.map((c) => c._id === collectionId ? { ...c, itemCount: (c.itemCount || 0) + 1 } : c));
      setCollectionPicker(null);
    } catch (err) { console.error(err); }
  };

  const handleRemoveFromCollection = async (e, itemId) => {
    e.stopPropagation();
    const item = items.find((i) => i._id === itemId);
    const colId = item?.collections?._id || item?.collections;
    if (!colId) return;
    try {
      await removeItemFromCollection(colId, itemId);
      setItems((prev) => prev.map((i) => i._id === itemId ? { ...i, collections: null } : i));
      setCollections((prev) => prev.map((c) => c._id === colId ? { ...c, itemCount: Math.max((c.itemCount || 1) - 1, 0) } : c));
      setCollectionPicker(null);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="library">
      <aside className="library__filters">
        <div className="library__filters-section">
          <span className="library__filters-label">TYPE FILTER</span>
          <div className="library__type-list">
            {TYPE_FILTERS.map((f) => {
              const config = f.value ? getTypeConfig(f.value) : null;
              const count = f.value ? items.filter((i) => i.type === f.value).length : items.length;
              return (
                <button key={f.value}
                  className={`library__type-btn${typeFilter === f.value ? " library__type-btn--active" : ""}`}
                  onClick={() => { setTypeFilter(f.value); setPage(1); }}>
                  <span className="library__type-btn-left">
                    {config && <span className="library__type-dot" style={{ background: config.color }} />}
                    {f.label}
                  </span>
                  <span className="library__type-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="library__filters-section">
          <span className="library__filters-label">QUICK SORT</span>
          <select className="library__sort-select" value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="library__filters-section">
          <button
            className={`library__fav-btn${favoritesOnly ? " library__fav-btn--active" : ""}`}
            onClick={() => { setFavoritesOnly(!favoritesOnly); setPage(1); }}>
            <span>Favorites Only</span>
            <svg width="14" height="14" viewBox="0 0 24 24"
              fill={favoritesOnly ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </div>

        {collections.length > 0 && (
          <div className="library__filters-section">
            <span className="library__filters-label">COLLECTIONS</span>
            <div className="library__type-list">
              {collections.map((col) => (
                <button key={col._id} className="library__type-btn"
                  onClick={() => navigate("/collections")}>
                  <span className="library__type-btn-left">
                    <span className="library__type-dot" style={{ background: col.color || "#6366f1" }} />
                    {col.name}
                  </span>
                  <span className="library__type-count">{col.itemCount || 0}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      <div className="library__main">
        <form className="library__savebar" onSubmit={handleSave}>
          <span className="library__savebar-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </span>
          <input type="url" className="library__savebar-input"
            placeholder="Paste a URL to architect your knowledge..."
            value={url} onChange={(e) => setUrl(e.target.value)} />
          <button type="submit" className="library__savebar-btn" disabled={saving}>
            {saving ? "SAVING..." : "SAVE TO LIBRARY"}
          </button>
        </form>

        {saveMsg && (
          <p className={`library__save-msg${saveMsg.startsWith("✓") ? " library__save-msg--success" : " library__save-msg--error"}`}>
            {saveMsg}
          </p>
        )}

        {loading ? (
          <div className="library__grid">
            {Array.from({ length: 12 }).map((_, i) => <div className="library__skeleton" key={i} />)}
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
                  onOpenPicker={(e) => { e.stopPropagation(); setCollectionPicker(collectionPicker === item._id ? null : item._id); }}
                  onAddToCollection={(e, colId) => handleAddToCollection(e, item._id, colId)}
                  onRemoveFromCollection={(e) => handleRemoveFromCollection(e, item._id)}
                />
              ))}
            </div>
            {pagination.totalPages > 1 && (
              <div className="library__pagination">
                <button className="library__page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
                <span className="library__page-info">{page} / {pagination.totalPages}</span>
                <button className="library__page-btn" disabled={!pagination.hasMore} onClick={() => setPage(page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

