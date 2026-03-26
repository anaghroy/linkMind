// ─── Background Service Worker ────────────────────────────────────────────────
// Handles right-click context menu save option

chrome.runtime.onInstalled.addListener(() => {
  // Add right-click context menu option
  chrome.contextMenus.create({
    id: "linkmind-save",
    title: "Save to LinkMind",
    contexts: ["page", "link"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "linkmind-save") {
    const url = info.linkUrl || info.pageUrl || tab?.url;
    if (!url) return;

    // Get stored token
    const result = await chrome.storage.local.get("lm_token");
    const token = result.lm_token;

    if (!token) {
      // Open popup if not logged in
      chrome.action.openPopup();
      return;
    }

    // Save directly via API
    try {
      const res = await fetch("http://localhost:3000/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (data.success) {
        // Show notification
        chrome.notifications.create({
          type: "basic",
          iconUrl: "../icons/icon48.png",
          title: "LinkMind",
          message: data.duplicate
            ? "Already saved in your library!"
            : "Saved! AI is processing...",
        });
      }
    } catch {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "../icons/icon48.png",
        title: "LinkMind",
        message: "Failed to save. Make sure LinkMind is running.",
      });
    }
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_TOKEN") {
    chrome.storage.local.get("lm_token").then((r) => {
      sendResponse({ token: r.lm_token });
    });
    return true; // keep channel open for async
  }
});