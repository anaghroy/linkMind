import { useState } from "react";

const COLORS = ["yellow", "green", "blue", "pink"];
const COLOR_MAP = {
  yellow: "#f59e0b",
  green: "#10b981",
  blue: "#6366f1",
  pink: "#ec4899",
};

export default function HighlightsList({ highlights, onAdd, onRemove }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [color, setColor] = useState("yellow");

  const handleAdd = async () => {
    if (!text.trim()) return;
    await onAdd({ text: text.trim(), note: note.trim(), color });
    setText("");
    setNote("");
    setColor("yellow");
    setAdding(false);
  };

  return (
    <div className="highlights">
      <div className="highlights__header">
        <span className="item-detail__section-label">HIGHLIGHTS</span>
        <button
          className="highlights__add-btn"
          onClick={() => setAdding(!adding)}
        >
          {adding ? "Cancel" : "+ Add"}
        </button>
      </div>

      {adding && (
        <div className="highlights__form">
          <textarea
            className="highlights__input"
            placeholder="Paste highlighted text..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
          <input
            className="highlights__note-input"
            placeholder="Add a note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="highlights__color-row">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`highlights__color-dot${color === c ? " highlights__color-dot--active" : ""}`}
                style={{ background: COLOR_MAP[c] }}
                onClick={() => setColor(c)}
              />
            ))}
            <button className="highlights__save-btn" onClick={handleAdd}>
              Save Highlight
            </button>
          </div>
        </div>
      )}

      {highlights.length === 0 && !adding ? (
        <p className="highlights__empty">No highlights yet</p>
      ) : (
        <div className="highlights__list">
          {highlights.map((h) => (
            <div className="highlights__item" key={h._id}>
              <div
                className="highlights__item-bar"
                style={{ background: COLOR_MAP[h.color] || COLOR_MAP.yellow }}
              />
              <div className="highlights__item-content">
                <p className="highlights__item-text">"{h.text}"</p>
                {h.note && (
                  <p className="highlights__item-note">{h.note}</p>
                )}
              </div>
              <button
                className="highlights__item-remove"
                onClick={() => onRemove(h._id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}