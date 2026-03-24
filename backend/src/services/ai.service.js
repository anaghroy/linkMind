import { GoogleGenAI } from "@google/genai";
import logger from "../config/logger.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateEmbedding(text) {
  try {
    const cleanText = text.slice(0, 8000);

    const response = await ai.models.embedContent({
      model: "models/gemini-embedding-001",
      contents: cleanText,
    });

    const vector = response.embeddings[0].values;
    logger.debug(`Embedding generated: ${vector.length} dimensions`);
    return vector;
  } catch (err) {
    logger.error(`Embedding generation failed: ${err.message}`);
    throw err;
  }
}

// ─── Generate Tags ───────────────────────────────────────────────────────────

export async function generateTags(title, description, content) {
  try {
    const prompt = `
You are a content tagging system. Analyze the following content and generate 3 to 7 relevant tags.

Title: ${title}
Description: ${description || ""}
Content: ${(content || "").slice(0, 2000)}

Rules:
- Return ONLY a JSON array of strings, nothing else
- Tags must be lowercase, single words or short hyphenated phrases
- Be specific and meaningful (e.g. "react-hooks" not "programming")
- No duplicates

Example output: ["javascript", "react-hooks", "frontend", "web-development"]
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text.trim();

    const jsonMatch = text.match(/\[.*\]/s);
    if (!jsonMatch) throw new Error("No JSON array found in response");

    const tags = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(tags)) throw new Error("Response is not an array");

    const sanitized = tags
      .filter((t) => typeof t === "string")
      .map((t) => t.toLowerCase().trim().replace(/\s+/g, "-"))
      .slice(0, 7);

    logger.debug(`Tags generated: ${sanitized.join(", ")}`);
    return sanitized;
  } catch (err) {
    logger.error(`Tag generation failed: ${err.message}`);
    return [];
  }
}

// ─── Generate Summary ────────────────────────────────────────────────────────

export async function generateSummary(title, content, type) {
  try {
    const prompt = `
Summarize the following ${type} in 2-3 sentences. Be concise and capture the key insight.

Title: ${title}
Content: ${(content || "").slice(0, 3000)}

Rules:
- Return ONLY the summary text, no labels or prefixes
- Maximum 3 sentences
- Focus on the main idea and why it matters
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const summary = response.text.trim();
    logger.debug(`Summary generated for: ${title}`);
    return summary;
  } catch (err) {
    logger.error(`Summary generation failed: ${err.message}`);
    return "";
  }
}

// ─── Process Item (all 3 in parallel) ───────────────────────────────────────

export async function processItem({ title, description, content, type }) {
  const textForEmbedding = [title, description, content]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (!textForEmbedding) {
    logger.warn("processItem: no text content to process");
    return { embedding: null, tags: [], summary: "" };
  }

  const [embedding, tags, summary] = await Promise.allSettled([
    generateEmbedding(textForEmbedding),
    generateTags(title, description, content),
    generateSummary(title, content, type),
  ]);

  return {
    embedding: embedding.status === "fulfilled" ? embedding.value : null,
    tags: tags.status === "fulfilled" ? tags.value : [],
    summary: summary.status === "fulfilled" ? summary.value : "",
  };
}