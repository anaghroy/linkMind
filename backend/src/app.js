import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import routes from "./routes/index.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logger (dev only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health check route
app.get("/api/health", (req, res) => {
  res.send(" API is running...");
});

// API Routes
app.use("/api", routes);

// Serve React build with correct absolute path
app.use(express.static(path.join(__dirname, "../public")));

// Correct catch-all wildcard so React Router handles all frontend routes
app.get((req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});
// Global Error Handler
app.use(errorMiddleware);

export default app;
