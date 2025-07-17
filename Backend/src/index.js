import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({ path: "./.env" });

const startServer = async () => {
  // Try to connect to MongoDB with a timeout
  const connectWithTimeout = () => {
    return Promise.race([
      connectDB(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("MongoDB connection timeout")),
          10000,
        ),
      ),
    ]);
  };

  try {
    await connectWithTimeout();
    console.log("✅ MongoDB connected successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.log("⚠️  Continuing without MongoDB - some features may not work");
  }

  app.on("error", (error) => {
    console.error("❌ Server Error:", error);
  });

  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`✅ Server is running at port: ${PORT}`);
    console.log(`🌐 Frontend: http://localhost:5173`);
    console.log(`🔗 Backend: http://localhost:${PORT}`);
  });
};

startServer();
