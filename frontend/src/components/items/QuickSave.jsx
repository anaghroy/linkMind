import { useState, useEffect } from "react";

export default function QuickSave() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!open) return null;

  return (
    <div className="quicksave-overlay" onClick={() => setOpen(false)}>
      <div className="quicksave" onClick={(e) => e.stopPropagation()}>
        <div className="quicksave__header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <input
            type="url"
            className="quicksave__input"
            placeholder="Paste a URL to save..."
            autoFocus
          />
        </div>
        <div className="quicksave__hint">Press Enter to save · Esc to close</div>
      </div>
    </div>
  );
}