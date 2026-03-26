import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { useThemeStore } from "../store/theme";
import { MoonStar } from "lucide-react";
import { Sun } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [search, setSearch] = useState("");

  const handleSearch = (e) => {
    if (e.key === "Enter" && search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "LM";

  return (
    <header className="navbar">
      {/* Search */}
      <div className="navbar__search">
        <span className="navbar__search-icon">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          className="navbar__search-input"
          placeholder="Search across your collections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearch}
        />
        <span className="navbar__search-shortcut">⌘K</span>
      </div>

      {/* Right actions */}
      <div className="navbar__actions">
        {/* Notification bell */}
        <button className="navbar__action-btn">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
        {/* Theme toggle */}
        <button className="navbar__action-btn" onClick={toggleTheme}>
          {theme === "dark" ? <MoonStar /> : <Sun />}
        </button>

        {/* User avatar */}
        <button
          className="navbar__avatar"
          onClick={() => navigate("/settings")}
          title={user?.name}
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
