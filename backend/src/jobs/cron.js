import cron from "node-cron";
import { queueResurfacingForAllUsers } from "./resurfacing.job.js";
import logger from "../config/logger.js";

/**
 * Schedules all background cron jobs for LinkMind.
 * Call startCronJobs() once on server startup.
 */
export function startCronJobs() {
  // ─── Daily Resurfacing ────────────────────────────────────────────────────
  // Runs every day at 8:00 AM server time
  cron.schedule("0 8 * * *", async () => {
    logger.info("Cron: Starting daily resurfacing job");
    await queueResurfacingForAllUsers();
  });

  // ─── Dev: Run every 2 minutes for testing ─────────────────────────────────
  // Comment this out in production, uncomment to test resurfacing locally
  // cron.schedule("*/2 * * * *", async () => {
  //   logger.info("Cron: [DEV] Running resurfacing test");
  //   await queueResurfacingForAllUsers();
  // });

  logger.info("Cron jobs started — daily resurfacing at 8:00 AM");
}