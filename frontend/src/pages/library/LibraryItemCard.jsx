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
  const itemColId = item.collections?._id || item.collections;
  const itemCollection = itemColId
    ? collections.find((c) => c._id === itemColId)
    : null;

  return (
    <div className="lib-card" onClick={onClick}>
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

      <div className="lib-card__body">
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

        <h3 className="lib-card__title">{item.title}</h3>

        {item.aiSummary && (
          <p className="lib-card__summary">{item.aiSummary}</p>
        )}

        {item.aiTags?.length > 0 && (
          <div className="lib-card__tags">
            {item.aiTags.slice(0, 3).map((tag) => (
              <span className="lib-card__tag" key={tag}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Collection badge */}
        {itemCollection && (
          <div className="lib-card__collection-badge">
            <span
              className="lib-card__collection-dot"
              style={{ background: itemCollection.color }}
            />
            <span>{itemCollection.name}</span>
          </div>
        )}

        <div className="lib-card__footer">
          <span className="lib-card__time">
            {timeAgo(item.createdAt)}
          </span>

          <div className="lib-card__actions">
            {/* Favorite */}
            <button
              className="lib-card__action-btn"
              onClick={onFavorite}
              title="Favorite"
            >
              ⭐
            </button>

            {/* Collection */}
            <div style={{ position: "relative" }}>
              <button
                className={`lib-card__action-btn${
                  itemCollection
                    ? " lib-card__action-btn--active-accent"
                    : ""
                }`}
                onClick={onOpenPicker}
              >
                📁
              </button>

              {collectionPickerOpen && (
                <div
                  className="lib-card__col-picker"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="lib-card__col-picker-header">
                    Add to Collection
                  </div>

                  {collections.map((col) => (
                    <button
                      key={col._id}
                      onClick={(e) => onAddToCollection(e, col._id)}
                    >
                      {col.name}
                    </button>
                  ))}

                  {itemCollection && (
                    <button onClick={onRemoveFromCollection}>
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Delete */}
            <button
              className="lib-card__action-btn lib-card__action-btn--danger"
              onClick={onDelete}
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}