import { useState, useEffect } from "react";
import { getItemStats } from "../../api/items.api";

export default function StatsBar() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getItemStats()
      .then((res) => setStats(res.data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "TOTAL SAVED",
      value: stats?.total ?? 0,
      sub: "+12%",
      subColor: "var(--accent-green)",
    },
    {
      label: "UNREAD",
      value: stats?.unread ?? 0,
      sub: "Pending",
      subColor: "var(--text-muted)",
    },
    {
      label: "FAVORITES",
      value: stats?.favorites ?? 0,
      sub: "★",
      subColor: "var(--accent-yellow)",
    },
    {
      label: "COLLECTIONS",
      value: stats?.byType
        ? Object.keys(stats.byType).length
        : 0,
      sub: "Folders",
      subColor: "var(--text-muted)",
    },
  ];

  return (
    <div className="stats-bar">
      {cards.map((card) => (
        <div className="stats-bar__card" key={card.label}>
          <span className="stats-bar__label">{card.label}</span>
          <div className="stats-bar__value-row">
            {loading ? (
              <span className="stats-bar__skeleton" />
            ) : (
              <>
                <span className="stats-bar__value">
                  {card.value.toLocaleString()}
                </span>
                <span
                  className="stats-bar__sub"
                  style={{ color: card.subColor }}
                >
                  {card.sub}
                </span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}