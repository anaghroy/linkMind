import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { timeAgo } from "../../utils/timeAgo";
import { getTypeConfig } from "../../utils/typeColors";
import { useItemsStore } from "../../store/items.store";
import { getCollections } from "../../api/collections.api";

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
    fetchItems,
    stats,
    fetchStats,
    toggleFavorite,
    deleteItem,
    saveItem,
    addToCollection,
    removeFromCollection,
    filters,
    setFilter,
    setPage,
    pagination,
    loading,
  } = useItemsStore();
 
  const [collections, setCollections] = useState([]);
  const [url, setUrl] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [collectionPicker, setCollectionPicker] = useState(null);

  // ✅ Fetch data
  useEffect(() => {
    fetchItems();
    fetchStats();

    getCollections()
      .then((res) => setCollections(res.data.collections || []))
      .catch(console.error);
  }, [filters]);

  // ✅ Close picker
  useEffect(() => {
    const handler = () => setCollectionPicker(null);
    if (collectionPicker) window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [collectionPicker]);

  // ✅ SAVE
  const handleSave = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    const res = await saveItem({ url: url.trim() });

    if (res.success) {
      setUrl("");
      setSaveMsg("✓ Saved!");
      setTimeout(() => setSaveMsg(""), 3000);
    } else {
      setSaveMsg("Failed to save");
    }
  };

  // ✅ FAVORITE
  const handleFavorite = (e, item) => {
    e.stopPropagation();
    toggleFavorite(item._id);
  };

  // ✅ DELETE
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Delete this item?")) return;

    await deleteItem(id);
  };

  // ✅ ADD TO COLLECTION
  const handleAddToCollection = async (e, itemId, colId) => {
    e.stopPropagation();

    const res = await addToCollection(itemId, colId);
    if (res.success) setCollectionPicker(null);
  };

  // ✅ REMOVE FROM COLLECTION
  const handleRemoveFromCollection = async (e, itemId) => {
    e.stopPropagation();

    const item = items.find((i) => i._id === itemId);
    const colId = item?.collections?._id || item?.collections;

    if (!colId) return;

    const res = await removeFromCollection(itemId, colId);
    if (res.success) setCollectionPicker(null);
  };

  return (
    <div className="library">
      {/* FILTER SIDEBAR */}
      <aside className="library__filters">
        <div className="library__filters-section">
          <span className="library__filters-label">TYPE FILTER</span>

          <div className="library__type-list">
            {TYPE_FILTERS.map((f) => {
              const config = f.value ? getTypeConfig(f.value) : null;
              const count = f.value
                ? stats?.types?.[f.value] || 0
                : stats?.total || 0;

              return (
                <button
                  key={f.value}
                  className={`library__type-btn ${
                    filters.type === f.value ? "library__type-btn--active" : ""
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

                  <span className="library__type-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SORT */}
        <div className="library__filters-section">
          <span className="library__filters-label">QUICK SORT</span>

          <select
            value={filters.sort}
            onChange={(e) => setFilter("sort", e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </aside>

      {/* MAIN */}
      <div className="library__main">
        {/* SAVE BAR */}
        <form onSubmit={handleSave}>
          <input
            type="url"
            placeholder="Paste URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="submit">SAVE</button>
        </form>

        {saveMsg && <p>{saveMsg}</p>}

        {/* CONTENT */}
        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p>No items yet</p>
        ) : (
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
                    collectionPicker === item._id ? null : item._id,
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
        )}
      </div>
    </div>
  );
}
