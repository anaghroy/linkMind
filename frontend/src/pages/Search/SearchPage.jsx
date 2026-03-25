import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { searchItems } from "../../api/search.api";
import { getTypeConfig } from "../../utils/typeColors";
import { timeAgo } from "../../utils/timeAgo";

const MODES = ["hybrid", "semantic", "text"];
const TYPE_FILTERS = [
  { label: "All", value: "" },
  { label: "Article", value: "article" },
  { label: "YouTube", value: "youtube" },
  { label: "Tweet", value: "tweet" },
  { label: "PDF", value: "pdf" },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [mode, setMode] = useState("hybrid");
  const [typeFilter, setTypeFilter] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [total, setTotal] = useState(0);
  const [resultMode, setResultMode] = useState("");

  const inputRef = useRef(null);

  // Auto search if q param exists on mount
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      handleSearch(q, mode, typeFilter);
    }
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (q = query, m = mode, t = typeFilter) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchItems({
        q: q.trim(),
        mode: m,
        ...(t && { type: t }),
        limit: 20,
      });
      setResults(res.data.results || []);
      setTotal(res.data.total || 0);
      setResultMode(res.data.mode || m);
      setSearchParams({ q: q.trim() });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleModeChange = (m) => {
    setMode(m);
    if (searched) handleSearch(query, m, typeFilter);
  };

  const handleTypeChange = (t) => {
    setTypeFilter(t);
    if (searched) handleSearch(query, mode, t);
  };

  return (
    <div className="search-page">
      {/* Page heading */}
      <div className="search-page__heading">
        <h1 className="search-page__title">Find Wisdom.</h1>
      </div>

      {/* Search input + mode toggle */}
      <div className="search-page__bar-wrap">
        <div className="search-page__bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" className="search-page__bar-icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-page__input"
            placeholder="Search your knowledge base..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              className="search-page__clear"
              onClick={() => { setQuery(""); setResults([]); setSearched(false); }}
            >
              ×
            </button>
          )}
        </div>

        {/* Mode toggle */}
        <div className="search-page__modes">
          {MODES.map((m) => (
            <button
              key={m}
              className={`search-page__mode-btn${mode === m ? " search-page__mode-btn--active" : ""}`}
              onClick={() => handleModeChange(m)}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Type filter pills */}
      <div className="search-page__types">
        {TYPE_FILTERS.map((t) => (
          <button
            key={t.value}
            className={`search-page__type-pill${typeFilter === t.value ? " search-page__type-pill--active" : ""}`}
            onClick={() => handleTypeChange(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Results meta */}
      {searched && !loading && (
        <div className="search-page__meta">
          <span>
            Showing <strong>{total}</strong> result{total !== 1 ? "s" : ""}
          </span>
          <span className="search-page__meta-mode">
            • Mode: <strong>{resultMode} Intelligence</strong>
          </span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="search-page__grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="search-page__skeleton" key={i} />
          ))}
        </div>
      )}

      {/* Results grid */}
      {!loading && results.length > 0 && (
        <div className="search-page__grid">
          {results.map((item) => (
            <SearchResultCard
              key={item._id}
              item={item}
              onClick={() => navigate(`/library/${item._id}`)}
              onSimilar={() => navigate(`/search?q=${encodeURIComponent(item.title)}`)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && searched && results.length === 0 && (
        <div className="search-page__empty">
          <p>No results found for "{query}"</p>
          <div className="search-page__empty-actions">
            <button
              className="search-page__empty-btn"
              onClick={() => handleModeChange("text")}
            >
              Try broadening terms
            </button>
            <button
              className="search-page__empty-btn"
              onClick={() => handleModeChange("semantic")}
            >
              Switch to Semantic Mode
            </button>
          </div>
        </div>
      )}

      {/* Initial state */}
      {!searched && !loading && (
        <div className="search-page__initial">
          <div className="search-page__initial-hint">
            <span>⌘</span> Press Enter to search
          </div>
          <div className="search-page__modes-info">
            <div className="search-page__mode-info-card">
              <strong>Hybrid</strong>
              <p>Combines semantic meaning + keyword matching for best results</p>
            </div>
            <div className="search-page__mode-info-card">
              <strong>Semantic</strong>
              <p>Finds items by meaning even if exact words don't match</p>
            </div>
            <div className="search-page__mode-info-card">
              <strong>Text</strong>
              <p>Classic keyword search across titles, tags and notes</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Search Result Card ───────────────────────────────────────────────────────

function SearchResultCard({ item, onClick, onSimilar }) {
  const typeConfig = getTypeConfig(item.type);
  const score = item.score ? Math.round(item.score * 100) : null;

  return (
    <div className="search-card" onClick={onClick}>
      {/* Header */}
      <div className="search-card__header">
        <div className="search-card__type-row">
          <span
            className="search-card__type"
            style={{ color: typeConfig.color }}
          >
            {typeConfig.label.toUpperCase()}
          </span>
          {item.metadata?.siteName && (
            <span className="search-card__site">
              {item.metadata.siteName}
            </span>
          )}
        </div>
        {score && (
          <span
            className="search-card__score"
            style={{
              color: score >= 80 ? "var(--accent-green)" : "var(--accent-yellow)",
              borderColor: score >= 80 ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)",
              background: score >= 80 ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
            }}
          >
            {score}% Match
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="search-card__title">{item.title}</h3>

      {/* Summary */}
      {(item.aiSummary || item.description) && (
        <p className="search-card__summary">
          {item.aiSummary || item.description}
        </p>
      )}

      {/* Tags */}
      {item.aiTags?.length > 0 && (
        <div className="search-card__tags">
          {item.aiTags.slice(0, 3).map((tag) => (
            <span className="search-card__tag" key={tag}>#{tag}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="search-card__footer">
        <span className="search-card__time">{timeAgo(item.createdAt)}</span>
        <button
          className="search-card__similar-btn"
          onClick={(e) => { e.stopPropagation(); onSimilar(); }}
        >
          Similar to this ↗
        </button>
      </div>
    </div>
  );
}