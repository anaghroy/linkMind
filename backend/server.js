import dotenv from "dotenv";
dotenv.config();

// All dynamic imports run AFTER dotenv.config()
const { default: app } = await import("./src/app.js");
const { default: connectDB } = await import("./src/config/database.js");
const { connectRedis } = await import("./src/config/redis.js");
await import("./src/ai/ai.worker.js"); // dynamic, not static

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    await connectRedis();
    app.listen(PORT, () => {
      console.log(`Server running on PORT: ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();