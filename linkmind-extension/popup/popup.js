// ─── Config ───────────────────────────────────────────────────────────────────
const API_BASE = "https://linkmind-q8k1.onrender.com/api";

// ─── Storage helpers ──────────────────────────────────────────────────────────
const storage = {
  get: (key) => chrome.storage.local.get(key).then((r) => r[key]),
  set: (key, val) => chrome.storage.local.set({ [key]: val }),
  remove: (key) => chrome.storage.local.remove(key),
};

// ─── API helpers ──────────────────────────────────────────────────────────────
async function apiRequest(path, options = {}) {
  const token = await storage.get("lm_token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, data };
  return data;
}

// ─── State management ─────────────────────────────────────────────────────────
function showState(id) {
  document.querySelectorAll(".state").forEach((el) => el.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function showError(elId, msg) {
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.classList.remove("hidden");
}

function hideError(elId) {
  document.getElementById(elId).classList.add("hidden");
}

// ─── Get current tab info ─────────────────────────────────────────────────────
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// ─── Load collections into select ────────────────────────────────────────────
async function loadCollections() {
  try {
    const data = await apiRequest("/collections");
    const select = document.getElementById("collection-select");
    const collections = data.collections || [];

    collections.forEach((col) => {
      const opt = document.createElement("option");
      opt.value = col._id;
      opt.textContent = col.name;
      select.appendChild(opt);

      // Add subcollections
      (col.subcollections || []).forEach((sub) => {
        const subOpt = document.createElement("option");
        subOpt.value = sub._id;
        subOpt.textContent = `  ↳ ${sub.name}`;
        select.appendChild(subOpt);
      });
    });
  } catch {
    // ignore — collections are optional
  }
}

// ─── Init save state ──────────────────────────────────────────────────────────
async function initSaveState() {
  const tab = await getCurrentTab();

  // Try to get richer metadata from content script
  let title = tab.title || "";
  let favicon = tab.favIconUrl || "";

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        title: document.title,
        favicon:
          document.querySelector('link[rel="icon"]')?.href ||
          document.querySelector('link[rel="shortcut icon"]')?.href ||
          `${location.origin}/favicon.ico`,
      }),
    });
    if (result?.result) {
      title = result.result.title || title;
      favicon = result.result.favicon || favicon;
    }
  } catch {
    // content script may not run on chrome:// pages
  }

  // Populate UI
  document.getElementById("page-title").textContent = title || "Untitled";
  document.getElementById("page-url").textContent = tab.url || "";

  const faviconEl = document.getElementById("page-favicon");
  if (favicon) {
    faviconEl.src = favicon;
    faviconEl.onerror = () => (faviconEl.style.display = "none");
  } else {
    faviconEl.style.display = "none";
  }

  await loadCollections();
  showState("state-save");
}

// ─── Login ────────────────────────────────────────────────────────────────────
async function handleLogin() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  hideError("login-error");

  if (!email || !password) {
    showError("login-error", "Please enter email and password");
    return;
  }

  const btn = document.getElementById("btn-login");
  btn.textContent = "Signing in...";
  btn.disabled = true;

  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    await storage.set("lm_token", data.token);
    await storage.set("lm_user", data.user);
    await initSaveState();
  } catch (err) {
    showError("login-error", err.data?.message || "Login failed. Try again.");
    btn.textContent = "Sign In";
    btn.disabled = false;
  }
}

// ─── Save item ────────────────────────────────────────────────────────────────
async function handleSave() {
  const tab = await getCurrentTab();
  const note = document.getElementById("save-note").value.trim();
  const collectionId = document.getElementById("collection-select").value;
  hideError("save-error");

  const btn = document.getElementById("btn-save");
  btn.textContent = "Saving...";
  btn.disabled = true;

  try {
    const payload = {
      url: tab.url,
      ...(note && { userNote: note }),
      ...(collectionId && { collections: collectionId }),
    };

    const data = await apiRequest("/items", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (data.duplicate) {
      showState("state-duplicate");
    } else {
      // Store item id for "View in Library" button
      await storage.set("lm_last_item_id", data.item._id);
      showState("state-success");
    }
  } catch (err) {
    showError("save-error", err.data?.message || "Failed to save. Try again.");
    btn.textContent = "Save to LinkMind";
    btn.disabled = false;
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
async function handleLogout() {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } catch { /* ignore */ }
  await storage.remove("lm_token");
  await storage.remove("lm_user");
  showState("state-login");
}

// ─── Open app ─────────────────────────────────────────────────────────────────
async function openApp(path = "") {
  const appUrl = `http://localhost:5173${path}`;
  await chrome.tabs.create({ url: appUrl });
}

// ─── Main init ────────────────────────────────────────────────────────────────
async function init() {
  const token = await storage.get("lm_token");

  if (token) {
    // Verify token is still valid
    try {
      await apiRequest("/auth/me");
      await initSaveState();
    } catch {
      // Token expired — show login
      await storage.remove("lm_token");
      await storage.remove("lm_user");
      showState("state-login");
    }
  } else {
    showState("state-login");
  }
}

// ─── Event listeners ─────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  init();

  // Login
  document.getElementById("btn-login").addEventListener("click", handleLogin);
  document.getElementById("login-email").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("login-password").focus();
  });
  document.getElementById("login-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });

  // Open app from login screen
  document.getElementById("btn-open-app").addEventListener("click", () => openApp("/login"));

  // Save
  document.getElementById("btn-save").addEventListener("click", handleSave);

  // Logout
  document.getElementById("btn-logout").addEventListener("click", handleLogout);

  // View in library
  document.getElementById("btn-view").addEventListener("click", async () => {
    const itemId = await storage.get("lm_last_item_id");
    openApp(itemId ? `/library/${itemId}` : "/library");
  });

  document.getElementById("btn-view-duplicate").addEventListener("click", () => openApp("/library"));

  // Save another — reset to save state
  document.getElementById("btn-save-another").addEventListener("click", async () => {
    document.getElementById("save-note").value = "";
    document.getElementById("collection-select").value = "";
    await initSaveState();
  });
});