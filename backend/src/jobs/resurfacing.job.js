import { addToQueue } from "../ai/ai.queue.js";
import User from "../models/auth.model.js";
import { getResurfacedItems, markAsSurfaced } from "../services/resurfacing.service.js";
import logger from "../config/logger.js";

// ─── Queue Job: resurface-user ────────────────────────────────────────────────

/**
 * Queues resurfacing jobs for all users.
 * Called by the cron scheduler daily.
 */
export async function queueResurfacingForAllUsers() {
  try {
    const users = await User.find({}, "_id").lean();

    logger.info(`Queueing resurfacing for ${users.length} users`);

    for (const user of users) {
      await addToQueue(
        "ai-resurface",
        { userId: user._id.toString() },
        {
          // Spread jobs over time to avoid hammering DB
          delay: Math.random() * 60 * 1000, // random delay up to 1 min
        }
      );
    }
  } catch (err) {
    logger.error(`Failed to queue resurfacing jobs: ${err.message}`);
  }
}

// ─── Process: resurface-user ──────────────────────────────────────────────────

/**
 * Handles the "ai-resurface" job from the worker.
 * Gets surfaced items and stores them for the user's next login.
 */
export async function processResurfacingJob(userId) {
  try {
    logger.info(`Processing resurfacing for user: ${userId}`);

    const items = await getResurfacedItems(userId, 5);

    if (!items.length) {
      logger.debug(`No items to resurface for user: ${userId}`);
      return { surfaced: 0 };
    }

    // Mark items as surfaced
    const itemIds = items.map((i) => i._id);
    await markAsSurfaced(userId, itemIds);

    logger.info(`Resurfaced ${items.length} items for user: ${userId}`);
    return { surfaced: items.length, items };
  } catch (err) {
    logger.error(`Resurfacing job failed for user ${userId}: ${err.message}`);
    throw err;
  }
}