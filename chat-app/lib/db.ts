import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
const cached = (global as any).__mongoose || { conn: null, promise: null };
(global as any).__mongoose = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    try {
      // Try the configured MongoDB URI first
      cached.promise = mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      cached.conn = await cached.promise;
      console.log("✅ MongoDB connected to:", MONGODB_URI);
    } catch (err) {
      console.warn("⚠️  Could not connect to MongoDB at", MONGODB_URI);
      console.warn("   Falling back to in-memory MongoDB...");

      // Fallback: use mongodb-memory-server
      try {
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        cached.promise = mongoose.connect(uri);
        cached.conn = await cached.promise;
        console.log("✅ In-memory MongoDB started at:", uri);
        console.log("   ⚠️  Data will be lost when the server stops.");
      } catch (memErr) {
        console.error("❌ Failed to start in-memory MongoDB:", memErr);
        throw memErr;
      }
    }
  } else {
    cached.conn = await cached.promise;
  }

  return cached.conn;
}
