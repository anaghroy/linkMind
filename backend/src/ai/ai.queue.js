import { Queue } from "bullmq";
import logger from "../config/logger.js";

// Parse REDIS_URL for BullMQ
const redisURL = new URL(process.env.REDIS_URL);

const bullMQConnection = {
  host: redisURL.hostname,
  port: Number(redisURL.port) || 6379,
  ...(redisURL.password && { password: redisURL.password }),
  ...(redisURL.username &&
    redisURL.username !== "default" && { username: redisURL.username }),
};

// ─── Queue Instance ─────────────────────────────────────────────────────────

const aiQueue = new Queue("ai-processing", {
  connection: bullMQConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000, // 2s, 4s, 8s
    },
    removeOnComplete: 100, // keep last 100 completed jobs
    removeOnFail: 50, // keep last 50 failed jobs
  },
});

aiQueue.on("error", (err) => {
  logger.error(`AI Queue error: ${err.message}`);
});

// ─── Job Types ──────────────────────────────────────────────────────────────
// "ai-process-item"  → generate embedding + AI tags for a saved item
// "ai-resurface"     → resurfacing job (scheduled)
// "ai-cluster"       → topic clustering

// ─── Add To Queue ───────────────────────────────────────────────────────────

export async function addToQueue(jobName, data, options = {}) {
  try {
    const job = await aiQueue.add(jobName, data, options);
    logger.debug(`Job added to queue: ${jobName} | jobId: ${job.id}`);
    return job;
  } catch (err) {
    logger.error(`Failed to add job "${jobName}" to queue: ${err.message}`);
    // Don't throw — queue failure should not break the save flow
    return null;
  }
}

// ─── Queue Health ────────────────────────────────────────────────────────────

export async function getQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    aiQueue.getWaitingCount(),
    aiQueue.getActiveCount(),
    aiQueue.getCompletedCount(),
    aiQueue.getFailedCount(),
  ]);

  return { waiting, active, completed, failed };
}

export { aiQueue };
export default aiQueue;
