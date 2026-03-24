import winston from "winston";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ensure logs directory exists
const logsDir = join(__dirname, "../../logs");
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// ─── Custom Format ──────────────────────────────────────────────────────────

const { combine, timestamp, colorize, printf, errors, json } = winston.format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => {
    return stack
      ? `[${timestamp}] ${level}: ${message}\n${stack}`
      : `[${timestamp}] ${level}: ${message}`;
  })
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// ─── Transports ─────────────────────────────────────────────────────────────

const transports = [
  // Always log to console
  new winston.transports.Console({
    format: process.env.NODE_ENV === "production" ? prodFormat : devFormat,
  }),
];

// In production, also write to files
if (process.env.NODE_ENV === "production") {
  transports.push(
    // All logs: info and above
    new winston.transports.File({
      filename: join(logsDir, "app.log"),
      level: "info",
      format: prodFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    // Errors only
    new winston.transports.File({
      filename: join(logsDir, "error.log"),
      level: "error",
      format: prodFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    })
  );
}

// ─── Logger Instance ────────────────────────────────────────────────────────

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  transports,
  // Don't crash on uncaught exceptions in logger itself
  exitOnError: false,
});

export default logger;