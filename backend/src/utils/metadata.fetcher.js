import axios from "axios";
import * as cheerio from "cheerio";
import logger from "../config/logger.js";

// ─── Helpers ───────────────────────────────────────────────────────────────

const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const TWEET_REGEX =
  /(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/;

function extractYouTubeId(url) {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

function extractTweetId(url) {
  const match = url.match(TWEET_REGEX);
  return match ? { tweetId: match[2], tweetAuthor: match[1] } : null;
}

function estimateReadingTime(text) {
  if (!text) return null;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
}

// ─── Type Detector ─────────────────────────────────────────────────────────

export function detectType(url) {
  if (!url) return "note";
  if (YOUTUBE_REGEX.test(url)) return "youtube";
  if (TWEET_REGEX.test(url)) return "tweet";
  if (/\.(pdf)(\?.*)?$/i.test(url)) return "pdf";
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) return "image";
  return "article";
}

// ─── Fetchers ──────────────────────────────────────────────────────────────

async function fetchArticleMetadata(url) {
  try {
    const { data: html } = await axios.get(url, {
      timeout: 8000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LinkMindBot/1.0; +https://linkmind.app)",
      },
      maxContentLength: 5 * 1024 * 1024,
    });

    const $ = cheerio.load(html);

    const og = (name) =>
      $(`meta[property="og:${name}"]`).attr("content") ||
      $(`meta[name="${name}"]`).attr("content") ||
      null;

    const meta = (name) =>
      $(`meta[name="${name}"]`).attr("content") ||
      $(`meta[property="${name}"]`).attr("content") ||
      null;

    $("script, style, nav, footer, header, aside").remove();
    const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 5000);

    const title =
      og("title") ||
      $("title").text().trim() ||
      $("h1").first().text().trim() ||
      "Untitled";

    const description =
      og("description") || meta("description") || bodyText.slice(0, 200) || "";

    const thumbnail = og("image") || null;
    const siteName =
      og("site_name") || new URL(url).hostname.replace("www.", "");
    const author =
      meta("author") ||
      og("article:author") ||
      $('[rel="author"]').first().text().trim() ||
      null;

    const publishedRaw =
      og("article:published_time") ||
      meta("article:published_time") ||
      meta("date") ||
      null;

    const favicon = `https://www.google.com/s2/favicons?sz=64&domain=${new URL(url).hostname}`;

    return {
      title,
      description,
      content: bodyText,
      metadata: {
        thumbnail,
        favicon,
        siteName,
        author,
        publishedAt: publishedRaw ? new Date(publishedRaw) : null,
        readingTime: estimateReadingTime(bodyText),
      },
    };
  } catch (err) {
    logger.warn(`fetchArticleMetadata failed for ${url}: ${err.message}`);
    return {
      title: new URL(url).hostname,
      description: "",
      content: "",
      metadata: {
        favicon: `https://www.google.com/s2/favicons?sz=64&domain=${new URL(url).hostname}`,
      },
    };
  }
}

async function fetchYouTubeMetadata(url) {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

  try {
    const { data } = await axios.get(oembedUrl, { timeout: 6000 });
    return {
      title: data.title || "YouTube Video",
      description: data.author_name ? `By ${data.author_name}` : "",
      content: data.title || "",
      metadata: {
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        favicon: "https://www.google.com/s2/favicons?sz=64&domain=youtube.com",
        siteName: "YouTube",
        videoId,
        channelName: data.author_name || null,
      },
    };
  } catch {
    return {
      title: "YouTube Video",
      description: "",
      content: "",
      metadata: {
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        favicon: "https://www.google.com/s2/favicons?sz=64&domain=youtube.com",
        siteName: "YouTube",
        videoId,
      },
    };
  }
}

async function fetchTweetMetadata(url) {
  const tweetData = extractTweetId(url);
  if (!tweetData) throw new Error("Invalid Tweet URL");

  const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;

  try {
    const { data } = await axios.get(oembedUrl, { timeout: 6000 });
    const textContent = data.html
      ? cheerio.load(data.html)("p").first().text().trim()
      : "";

    return {
      title: `Tweet by @${tweetData.tweetAuthor}`,
      description: textContent.slice(0, 280),
      content: textContent,
      metadata: {
        thumbnail: null,
        favicon: "https://www.google.com/s2/favicons?sz=64&domain=twitter.com",
        siteName: "X (Twitter)",
        tweetId: tweetData.tweetId,
        tweetAuthor: tweetData.tweetAuthor,
        author: `@${tweetData.tweetAuthor}`,
      },
    };
  } catch {
    return {
      title: `Tweet by @${tweetData.tweetAuthor}`,
      description: "",
      content: "",
      metadata: {
        favicon: "https://www.google.com/s2/favicons?sz=64&domain=twitter.com",
        siteName: "X (Twitter)",
        ...tweetData,
      },
    };
  }
}

// ─── Main Fetcher ──────────────────────────────────────────────────────────

export async function fetchMetadata(url) {
  const type = detectType(url);

  switch (type) {
    case "youtube":
      return { type, ...(await fetchYouTubeMetadata(url)) };
    case "tweet":
      return { type, ...(await fetchTweetMetadata(url)) };
    case "pdf":
      return {
        type,
        title: url.split("/").pop().replace(".pdf", "") || "PDF Document",
        description: "",
        content: "",
        metadata: {
          favicon: null,
          siteName: "PDF",
        },
      };
    default:
      return { type, ...(await fetchArticleMetadata(url)) };
  }
}