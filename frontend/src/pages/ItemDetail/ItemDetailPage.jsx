import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getItemById,
  updateItem,
  deleteItem,
  markAsRead,
  addHighlight,
  removeHighlight,
} from "../../api/items.api";
import { timeAgo } from "../../utils/timeAgo";
import { getTypeConfig } from "../../utils/typeColors";
import SimilarItems from "./SimilarItems";
import HighlightsList from "./HighlightsList";

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  useEffect(() => {
    getItemById(id)
      .then((res) => {
        setItem(res.data.item);
        setNote(res.data.item.userNote || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleFavorite = async () => {
    try {
      const res = await updateItem(id, { isFavorite: !item.isFavorite });
      setItem(res.data.item);
    } catch (err) { console.error(err); }
  };

  const handleMarkRead = async () => {
    try {
      const res = await markAsRead(id);
      setItem(res.data.item);
    } catch (err) { console.error(err); }
  };

  const handleArchive = async () => {
    try {
      await updateItem(id, { isArchived: true });
      navigate("/library");
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this item permanently?")) return;
    try {
      await deleteItem(id);
      navigate("/library");
    } catch (err) { console.error(err); }
  };

  const handleNoteSave = async () => {
    setNoteSaving(true);
    try {
      await updateItem(id, { userNote: note });
    } catch (err) { console.error(err); }
    finally { setNoteSaving(false); }
  };

  const handleAddHighlight = async (highlight) => {
    try {
      const res = await addHighlight(id, highlight);
      setItem((prev) => ({ ...prev, highlights: res.data.highlights }));
    } catch (err) { console.error(err); }
  };

  const handleRemoveHighlight = async (hid) => {
    try {
      const res = await removeHighlight(id, hid);
      setItem((prev) => ({ ...prev, highlights: res.data.highlights }));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="item-detail__loading">Loading...</div>;
  if (!item) return <div className="item-detail__loading">Item not found</div>;

  const typeConfig = getTypeConfig(item.type);

  return (
    <div className="item-detail">
      {/* Back button */}
      <button className="item-detail__back" onClick={() => navigate("/library")}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Library
      </button>

      <div className="item-detail__layout">
        {/* Main content */}
        <article className="item-detail__main">
          {/* Header */}
          <div className="item-detail__header">
            <div className="item-detail__meta-row">
              {item.metadata?.favicon && (
                <img
                  src={item.metadata.favicon}
                  alt=""
                  className="item-detail__favicon"
                  onError={(e) => (e.target.style.display = "none")}
                />
              )}
              <span className="item-detail__site">
                {item.metadata?.siteName || item.type}
              </span>
              <span
                className="item-detail__type-badge"
                style={{ background: typeConfig.bg, color: typeConfig.color }}
              >
                {typeConfig.label}
              </span>
              {item.readAt && (
                <span className="item-detail__read-badge">✓ Read</span>
              )}
            </div>

            {/* Thumbnail */}
            {item.metadata?.thumbnail && (
              <div className="item-detail__thumb">
                <img
                  src={item.metadata.thumbnail}
                  alt={item.title}
                  onError={(e) => (e.target.parentElement.style.display = "none")}
                />
              </div>
            )}

            {/* Title */}
            <h1 className="item-detail__title">{item.title}</h1>

            {/* Meta info */}
            <div className="item-detail__info">
              {item.metadata?.author && (
                <span>By {item.metadata.author}</span>
              )}
              {item.metadata?.readingTime && (
                <span>{item.metadata.readingTime} min read</span>
              )}
              {item.metadata?.publishedAt && (
                <span>{new Date(item.metadata.publishedAt).toLocaleDateString()}</span>
              )}
              <span>Saved {timeAgo(item.createdAt)}</span>
            </div>
          </div>

          {/* AI Section */}
          {(item.aiSummary || item.aiTags?.length > 0) && (
            <div className="item-detail__ai-card">
              <div className="item-detail__ai-header">
                <span className="item-detail__ai-icon">✦</span>
                <span className="item-detail__ai-label">AI SUMMARY</span>
              </div>
              {item.aiSummary && (
                <p className="item-detail__ai-summary">{item.aiSummary}</p>
              )}
              {item.aiTags?.length > 0 && (
                <div className="item-detail__ai-tags">
                  {item.aiTags.map((tag) => (
                    <span className="item-detail__ai-tag" key={tag}>#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* User Note */}
          <div className="item-detail__note-section">
            <label className="item-detail__section-label">YOUR NOTE</label>
            <textarea
              className="item-detail__note"
              placeholder="Add a note about this item..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={handleNoteSave}
              rows={4}
            />
            {noteSaving && (
              <span className="item-detail__note-saving">Saving...</span>
            )}
          </div>

          {/* Highlights */}
          <HighlightsList
            highlights={item.highlights || []}
            onAdd={handleAddHighlight}
            onRemove={handleRemoveHighlight}
          />

          {/* Action buttons */}
          <div className="item-detail__actions">
            <button
              className={`item-detail__action-btn${item.isFavorite ? " item-detail__action-btn--active-yellow" : ""}`}
              onClick={handleFavorite}
            >
              <svg width="15" height="15" viewBox="0 0 24 24"
                fill={item.isFavorite ? "#f59e0b" : "none"}
                stroke="#f59e0b" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {item.isFavorite ? "Unfavorite" : "Favorite"}
            </button>

            {!item.readAt && (
              <button className="item-detail__action-btn" onClick={handleMarkRead}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Mark as Read
              </button>
            )}

            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="item-detail__action-btn item-detail__action-btn--primary"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Open Original
              </a>
            )}

            <button
              className="item-detail__action-btn item-detail__action-btn--danger"
              onClick={handleDelete}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
              </svg>
              Delete
            </button>
          </div>
        </article>

        {/* Similar Items sidebar */}
        <aside className="item-detail__sidebar">
          <SimilarItems itemId={id} />
        </aside>
      </div>
    </div>
  );
}