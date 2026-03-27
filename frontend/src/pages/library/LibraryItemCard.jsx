import { timeAgo } from "../../utils/timeAgo";
import { getTypeConfig } from "../../utils/typeColors";

export default function LibraryItemCard({
  item,
  collections,
  collectionPickerOpen,
  onClick,
  onFavorite,
  onDelete,
  onOpenPicker,
  onAddToCollection,
  onRemoveFromCollection,
}) {
  const typeConfig = getTypeConfig(item.type);

  // Resolve current collection — handle both ObjectId string and populated object
  const itemColId = item.collections?._id || item.collections;
  const itemCollection = itemColId
    ? collections.find(
        (c) => c._id === itemColId || c._id === itemColId?.toString()
      )
    : null;

  return (
    <div className="lib-card" onClick={onClick}>
      {/* ── Thumbnail ── */}
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

        <span
          className="lib-card__type-badge"
          style={{ background: typeConfig.bg, color: typeConfig.color }}
        >
          {typeConfig.label}
        </span>

        {item.aiProcessingStatus === "processing" && (
          <span className="lib-card__ai-badge">✦ AI PROCESSING...</span>
        )}
      </div>

      {/* ── Body ── */}
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

        {/* AI Tags */}
        {item.aiTags?.length > 0 && (
          <div className="lib-card__tags">
            {item.aiTags.slice(0, 3).map((tag) => (
              <span className="lib-card__tag" key={tag}>#{tag}</span>
            ))}
          </div>
        )}

        {/* Collection badge — shows which collection this item belongs to */}
        {itemCollection && (
          <div className="lib-card__collection-badge">
            <span
              className="lib-card__collection-dot"
              style={{ background: itemCollection.color || "#6366f1" }}
            />
            <span>{itemCollection.name}</span>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="lib-card__footer">
          <span className="lib-card__time">{timeAgo(item.createdAt)}</span>

          <div className="lib-card__actions">
            {/* Favorite */}
            <button
              className={`lib-card__action-btn${item.isFavorite ? " lib-card__action-btn--active-yellow" : ""}`}
              onClick={onFavorite}
              title={item.isFavorite ? "Unfavorite" : "Favorite"}
            >
              <svg
                width="14" height="14" viewBox="0 0 24 24"
                fill={item.isFavorite ? "#f59e0b" : "none"}
                stroke="#f59e0b" strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>

            {/* Collection picker */}
            <div style={{ position: "relative" }}>
              <button
                className={`lib-card__action-btn${itemCollection ? " lib-card__action-btn--active-accent" : ""}`}
                onClick={onOpenPicker}
                title="Add to collection"
              >
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={itemCollection ? "var(--accent)" : "currentColor"}
                  strokeWidth="2"
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </button>

              {/* Dropdown */}
              {collectionPickerOpen && (
                <div
                  className="lib-card__col-picker"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="lib-card__col-picker-header">
                    Add to Collection
                  </div>

                  {collections.length === 0 ? (
                    <p className="lib-card__col-picker-empty">
                      No collections yet
                    </p>
                  ) : (
                    collections.map((col) => (
                      <button
                        key={col._id}
                        className={`lib-card__col-picker-item${
                          itemColId === col._id
                            ? " lib-card__col-picker-item--active"
                            : ""
                        }`}
                        onClick={(e) => onAddToCollection(e, col._id)}
                      >
                        <span
                          className="lib-card__col-picker-dot"
                          style={{ background: col.color || "#6366f1" }}
                        />
                        {col.name}
                        <span className="lib-card__col-picker-count">
                          {col.itemCount || 0}
                        </span>
                      </button>
                    ))
                  )}

                  {itemCollection && (
                    <button
                      className="lib-card__col-picker-remove"
                      onClick={onRemoveFromCollection}
                    >
                      Remove from collection
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Delete */}
            <button
              className="lib-card__action-btn lib-card__action-btn--danger"
              onClick={onDelete}
              title="Delete"
            >
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
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