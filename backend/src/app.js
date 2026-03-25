import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import routes from "./routes/index.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";

const app = express();

// Middlewares
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

// Logger (dev only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health check route
app.get("/", (req, res) => {
  res.send(" API is running...");
});

// API Routes
app.use("/api", routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use(errorMiddleware);

export default app;
