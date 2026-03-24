import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getItems,
  saveItem,
  updateItem,
  deleteItem,
} from "../../api/items.api";
import { timeAgo } from "../../utils/timeAgo";
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
  const [searchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Save bar
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        sort,
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
  }, [fetchItems]);

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
      setItems((prev) =>
        prev.map((i) =>
          i._id === item._id ? { ...i, isFavorite: !i.isFavorite } : i,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e, itemId) => {
    e.stopPropagation();
    if (!confirm("Delete this item?")) return;
    try {
      await deleteItem(itemId);
      setItems((prev) => prev.filter((i) => i._id !== itemId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="library">
      {/* Left filters sidebar */}
      <aside className="library__filters">
        <div className="library__filters-section">
          <span className="library__filters-label">TYPE FILTER</span>
          <div className="library__type-list">
            {TYPE_FILTERS.map((f) => {
              const config = f.value ? getTypeConfig(f.value) : null;
              const count = f.value
                ? items.filter((i) => i.type === f.value).length
                : items.length;

              return (
                <button
                  key={f.value}
                  className={`library__type-btn${typeFilter === f.value ? " library__type-btn--active" : ""}`}
                  onClick={() => {
                    setTypeFilter(f.value);
                    setPage(1);
                  }}
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

        <div className="library__filters-section">
          <span className="library__filters-label">QUICK SORT</span>
          <select
            className="library__sort-select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="library__filters-section">
          <button
            className={`library__fav-btn${favoritesOnly ? " library__fav-btn--active" : ""}`}
            onClick={() => {
              setFavoritesOnly(!favoritesOnly);
              setPage(1);
            }}
          >
            <span>Favorites Only</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={favoritesOnly ? "#f59e0b" : "none"}
              stroke="#f59e0b"
              strokeWidth="2"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="library__main">
        {/* Save bar */}
        <form className="library__savebar" onSubmit={handleSave}>
          <span className="library__savebar-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
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
            className={`library__save-msg${saveMsg.startsWith("✓") ? " library__save-msg--success" : " library__save-msg--error"}`}
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
                  onClick={() => navigate(`/library/${item._id}`)}
                  onFavorite={(e) => handleFavorite(e, item)}
                  onDelete={(e) => handleDelete(e, item._id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="library__pagination">
                <button
                  className="library__page-btn"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  ← Prev
                </button>
                <span className="library__page-info">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  className="library__page-btn"
                  disabled={!pagination.hasMore}
                  onClick={() => setPage(page + 1)}
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

// ─── Library Item Card ────────────────────────────────────────────────────────

function LibraryItemCard({ item, onClick, onFavorite, onDelete }) {
  const typeConfig = getTypeConfig(item.type);

  return (
    <div className="lib-card" onClick={onClick}>
      {/* Thumbnail */}
      <div className="lib-card__thumb">
        {item.metadata?.thumbnail ? (
          <img
            src={item.metadata.thumbnail}
            alt={item.title}
            onError={(e) => (e.target.style.display = "none")}
          />
        ) : (
          <div
            className="lib-card__thumb-fallback"
            style={{ background: typeConfig.bg }}
          >
            <span>{typeConfig.icon}</span>
          </div>
        )}

        {/* Type badge on thumbnail */}
        <span
          className="lib-card__type-badge"
          style={{ background: typeConfig.bg, color: typeConfig.color }}
        >
          {typeConfig.label}
        </span>

        {/* AI processing badge */}
        {item.aiProcessingStatus === "processing" && (
          <span className="lib-card__ai-badge">✦ AI PROCESSING...</span>
        )}
      </div>

      {/* Body */}
      <div className="lib-card__body">
        {/* Source */}
        <div className="lib-card__source">
          {item.metadata?.favicon && (
            <img
              src={item.metadata.favicon}
              alt=""
              className="lib-card__favicon"
              onError={(e) => (e.target.style.display = "none")}
            />
          )}
          <span className="lib-card__site">
            {item.metadata?.siteName || item.type}
          </span>
          {item.metadata?.readingTime && (
            <>
              <span className="lib-card__dot">•</span>
              <span className="lib-card__site">
                {item.metadata.readingTime} MIN READ
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="lib-card__title">{item.title}</h3>

        {/* AI Summary */}
        {item.aiSummary && (
          <p className="lib-card__summary">{item.aiSummary}</p>
        )}

        {/* Tags */}
        {item.aiTags?.length > 0 && (
          <div className="lib-card__tags">
            {item.aiTags.slice(0, 3).map((tag) => (
              <span className="lib-card__tag" key={tag}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="lib-card__footer">
          <span className="lib-card__time">{timeAgo(item.createdAt)}</span>
          <div className="lib-card__actions">
            <button
              className={`lib-card__action-btn${item.isFavorite ? " lib-card__action-btn--active" : ""}`}
              onClick={onFavorite}
              title="Favorite"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={item.isFavorite ? "#f59e0b" : "none"}
                stroke="#f59e0b"
                strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
            <button
              className="lib-card__action-btn lib-card__action-btn--danger"
              onClick={onDelete}
              title="Delete"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
