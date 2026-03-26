// ─── Content Script ───────────────────────────────────────────────────────────
// Runs on every page — collects metadata for the extension popup

function getPageMetadata() {
  const og = (name) =>
    document.querySelector(`meta[property="og:${name}"]`)?.content ||
    document.querySelector(`meta[name="${name}"]`)?.content ||
    null;

  const meta = (name) =>
    document.querySelector(`meta[name="${name}"]`)?.content ||
    document.querySelector(`meta[property="${name}"]`)?.content ||
    null;

  return {
    title:
      og("title") ||
      document.title ||
      document.querySelector("h1")?.textContent?.trim() ||
      "Untitled",
    description: og("description") || meta("description") || "",
    thumbnail: og("image") || null,
    favicon:
      document.querySelector('link[rel="icon"]')?.href ||
      document.querySelector('link[rel="shortcut icon"]')?.href ||
      `${window.location.origin}/favicon.ico`,
    siteName: og("site_name") || window.location.hostname.replace("www.", ""),
    author:
      meta("author") ||
      og("article:author") ||
      document.querySelector('[rel="author"]')?.textContent?.trim() ||
      null,
    url: window.location.href,
  };
}

// Listen for metadata requests from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PAGE_METADATA") {
    sendResponse(getPageMetadata());
  }
});
