export const TYPE_CONFIG = {
  article: {
    label: "Article",
    color: "#6366f1",
    bg: "rgba(99, 102, 241, 0.1)",
    icon: "📄",
  },
  youtube: {
    label: "YouTube",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.1)",
    icon: "▶️",
  },
  tweet: {
    label: "Tweet",
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.1)",
    icon: "🐦",
  },
  pdf: {
    label: "PDF",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.1)",
    icon: "📕",
  },
  image: {
    label: "Image",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.1)",
    icon: "🖼️",
  },
  note: {
    label: "Note",
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.1)",
    icon: "📝",
  },
};

export const getTypeConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.article;
