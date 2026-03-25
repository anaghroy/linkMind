import { Worker } from "bullmq";
import Item from "../models/item.model.js";
import { processItem } from "../services/ai.service.js";
import { processResurfacingJob } from "../services/resurfacing.service.js";
import { buildGraph } from "../services/graph.service.js";
import logger from "../config/logger.js";

// ─── BullMQ Redis Connection ──────────────────────────────────────────────────

const redisURL = new URL(process.env.REDIS_URL);

const bullMQConnection = {
  host: redisURL.hostname,
  port: Number(redisURL.port) || 6379,
  ...(redisURL.password && { password: decodeURIComponent(redisURL.password) }),
  ...(redisURL.username && { username: redisURL.username }),
};

// ─── Job Router ───────────────────────────────────────────────────────────────

async function processAIJob(job) {
  logger.info(`Processing job: ${job.name} | jobId: ${job.id}`);

  switch (job.name) {
    case "ai-process-item":
      return await handleProcessItem(job);
    case "ai-resurface":
      return await processResurfacingJob(job.data.userId);
    default:
      logger.warn(`Unknown job type: ${job.name}`);
  }
}

// ─── Handle: Process Item ─────────────────────────────────────────────────────

async function handleProcessItem(job) {
  const { itemId, userId } = job.data;

  await Item.findByIdAndUpdate(itemId, {
    $set: { aiProcessingStatus: "processing" },
  });

  const item = await Item.findById(itemId);
  if (!item) {
    logger.warn(`Item not found for AI processing: ${itemId}`);
    return;
  }

  const { embedding, tags, summary } = await processItem({
    title: item.title,
    description: item.description,
    content: item.content,
    type: item.type,
  });

  const update = { aiProcessingStatus: "done" };

  if (embedding) {
    update["embedding.vector"] = embedding;
    update["embedding.model"] = "gemini-embedding-001";
    update["embedding.processedAt"] = new Date();
  }

  if (tags.length > 0) update.aiTags = tags;
  if (summary) update.aiSummary = summary;

  await Item.findByIdAndUpdate(item._id, { $set: update });

  logger.info(
    `AI done: ${item._id} | tags: [${tags.join(", ")}] | embedding: ${embedding ? "✓" : "✗"}`
  );

  // ── Auto-rebuild graph edges after AI processing ──────────────────────────
  // Run in background — don't block the job completion
  buildGraph(userId).catch((err) =>
    logger.error(`Graph build failed after item processing: ${err.message}`)
  );
}

// ─── Worker Instance ──────────────────────────────────────────────────────────

const worker = new Worker("ai-processing", processAIJob, {
  connection: bullMQConnection,
  concurrency: 3,
});

worker.on("completed", (job) => {
  logger.info(`Job completed: ${job.name} | jobId: ${job.id}`);
});

worker.on("failed", async (job, err) => {
  logger.error(`Job failed: ${job?.name} | jobId: ${job?.id} | ${err.message}`);

  if (job?.name === "ai-process-item" && job?.attemptsMade >= job?.opts?.attempts) {
    await Item.findByIdAndUpdate(job.data.itemId, {
      $set: { aiProcessingStatus: "failed" },
    });
  }
});

worker.on("error", (err) => {
  logger.error(`Worker error: ${err.message}`);
});

logger.info("AI Worker started — listening for jobs...");

export default worker;