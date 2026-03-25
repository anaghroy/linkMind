import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import api from "../../api/api.instance";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, setAuth } = useAuthStore();

  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="settings">
      {/* Header */}
      <div className="settings__header">
        <h1 className="settings__title">Settings</h1>
        <p className="settings__sub">
          Configure your LinkMind environment and preferences.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="settings__tabs">
        {["profile", "security", "preferences"].map((tab) => (
          <button
            key={tab}
            className={`settings__tab${activeTab === tab ? " settings__tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="settings__content">
        {activeTab === "profile" && (
          <ProfileTab user={user} setAuth={setAuth} onSave={showToast} />
        )}
        {activeTab === "security" && (
          <SecurityTab onSave={showToast} />
        )}
        {activeTab === "preferences" && (
          <PreferencesTab onSave={showToast} />
        )}
      </div>

      {/* Danger zone */}
      <div className="settings__danger">
        <div className="settings__danger-info">
          <h3>Danger Zone</h3>
          <p>Permanently delete your account and all saved items. This is irreversible.</p>
        </div>
        <button
          className="settings__danger-btn"
          onClick={() => {
            if (confirm("Are you sure? This will delete your account permanently.")) {
              logout();
              navigate("/login");
            }
          }}
        >
          Delete Account
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="settings__toast">
          <span>✓</span> {toast}
        </div>
      )}
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab({ user, setAuth, onSave }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [loading, setLoading] = useState(false);

  const initials = form.name
    ? form.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "LM";

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.patch("/auth/me", form);
      setAuth(localStorage.getItem("linkmind_token"), res.data.user);
      onSave("Profile updated successfully");
    } catch (err) {
      onSave(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings__card">
      <div className="settings__card-header">
        <div>
          <h2>Profile</h2>
          <p>Update your public identity and contact details.</p>
        </div>
        <button
          className="settings__save-btn"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="settings__profile-body">
        {/* Avatar */}
        <div className="settings__avatar-wrap">
          <div className="settings__avatar">{initials}</div>
        </div>

        {/* Fields */}
        <div className="settings__fields">
          <div className="settings__field-row">
            <div className="settings__field">
              <label>FULL NAME</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div className="settings__field">
              <label>EMAIL ADDRESS</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab({ onSave }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await api.patch("/auth/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      onSave("Password updated successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings__card">
      <div className="settings__card-header">
        <div>
          <h2>Security</h2>
          <p>Manage your password and account security.</p>
        </div>
        <button
          className="settings__save-btn"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Update Password"}
        </button>
      </div>

      <div className="settings__fields">
        <div className="settings__field">
          <label>CURRENT PASSWORD</label>
          <input
            type="password"
            placeholder="••••••••"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          />
        </div>
        <div className="settings__field-row">
          <div className="settings__field">
            <label>NEW PASSWORD</label>
            <input
              type="password"
              placeholder="Min. 6 characters"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            />
          </div>
          <div className="settings__field">
            <label>CONFIRM PASSWORD</label>
            <input
              type="password"
              placeholder="Repeat new password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
          </div>
        </div>
        {error && <p className="settings__error">{error}</p>}
      </div>
    </div>
  );
}

// ─── Preferences Tab ──────────────────────────────────────────────────────────

function PreferencesTab({ onSave }) {
  const [prefs, setPrefs] = useState({
    semanticSearch: true,
    autoSummarize: true,
    resurfacing: true,
    emailDigest: false,
  });

  const togglePref = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const PREFS = [
    {
      key: "semanticSearch",
      label: "Semantic Search",
      desc: "Use AI embeddings to find items by meaning",
    },
    {
      key: "autoSummarize",
      label: "Auto-Summarize",
      desc: "Automatically generate AI summaries when saving",
    },
    {
      key: "resurfacing",
      label: "Memory Resurfacing",
      desc: "Get reminded of forgotten items daily",
    },
    {
      key: "emailDigest",
      label: "Email Digest",
      desc: "Receive a weekly summary of your saved items",
    },
  ];

  return (
    <div className="settings__card">
      <div className="settings__card-header">
        <div>
          <h2>Preferences</h2>
          <p>Customize your LinkMind experience.</p>
        </div>
        <button
          className="settings__save-btn"
          onClick={() => onSave("Preferences saved")}
        >
          Save Changes
        </button>
      </div>

      <div className="settings__prefs">
        {PREFS.map((pref) => (
          <div className="settings__pref-row" key={pref.key}>
            <div className="settings__pref-info">
              <span className="settings__pref-label">{pref.label}</span>
              <span className="settings__pref-desc">{pref.desc}</span>
            </div>
            <button
              className={`settings__toggle${prefs[pref.key] ? " settings__toggle--on" : ""}`}
              onClick={() => togglePref(pref.key)}
            >
              <span className="settings__toggle-thumb" />
            </button>
          </div>
        ))}
      </div>

      {/* Stats section */}
      <div className="settings__stats-section">
        <h3 className="settings__stats-title">Your LinkMind Stats</h3>
        <div className="settings__stats-grid">
          {[
            { label: "Items Saved", value: "–" },
            { label: "AI Tags Generated", value: "–" },
            { label: "Searches Made", value: "–" },
            { label: "Times Resurfaced", value: "–" },
          ].map((stat) => (
            <div className="settings__stat-card" key={stat.label}>
              <span className="settings__stat-value">{stat.value}</span>
              <span className="settings__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}