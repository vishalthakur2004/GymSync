import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`,
      {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      },
    );
    console.log(
      `MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`,
    );
  } catch (error) {
    console.log("MONGODB connection error: ", error);
    console.log(
      "⚠️  Running in development mode without MongoDB. Some features may not work.",
    );
    console.log("📋  To set up MongoDB:");
    console.log("   1. Install MongoDB locally, or");
    console.log("   2. Use MongoDB Atlas (cloud), or");
    console.log("   3. Use Docker: docker run -d -p 27017:27017 mongo");
    // Don't exit in development when MongoDB is unavailable
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

export default connectDB;
