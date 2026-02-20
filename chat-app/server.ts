import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import mongoose from "mongoose";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// ── DB Connection Helper (same logic as lib/db.ts) ──────────
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/chatapp";

const cached = (global as any).__mongoose || { conn: null, promise: null };
(global as any).__mongoose = cached;

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    try {
      cached.promise = mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      cached.conn = await cached.promise;
      console.log("✅ MongoDB connected to:", MONGODB_URI);
    } catch (err) {
      console.warn("⚠️  Could not connect to MongoDB at", MONGODB_URI);
      console.warn("   Falling back to in-memory MongoDB...");
      try {
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        // Reset mongoose connection before reconnecting
        cached.promise = mongoose.connect(uri);
        cached.conn = await cached.promise;
        console.log("✅ In-memory MongoDB started at:", uri);
        console.log("   ⚠️  Data will be lost when the server stops.");
      } catch (memErr) {
        console.error("❌ Failed to start in-memory MongoDB:", memErr);
        cached.promise = null;
        throw memErr;
      }
    }
  } else {
    cached.conn = await cached.promise;
  }

  return cached.conn;
}

// ── Message Schema ──────────────────────────────────────────
const MessageSchema = new mongoose.Schema(
  {
    sender: { type: String, required: true },
    content: { type: String, required: true },
    room: { type: String, required: true },
  },
  { timestamps: true }
);

const Message =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);

// ── Start server ────────────────────────────────────────────
app.prepare().then(async () => {
  await connectDB();

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", async (room: string) => {
      socket.join(room);
      try {
        const history = await Message.find({ room })
          .sort({ createdAt: 1 })
          .limit(100)
          .lean();
        socket.emit("message_history", history);
      } catch (err) {
        console.error("Error fetching message history:", err);
        socket.emit("message_history", []);
      }
    });

    socket.on(
      "send_message",
      async (data: { sender: string; content: string; room: string }) => {
        try {
          const saved = await Message.create({
            sender: data.sender,
            content: data.content,
            room: data.room,
          });
          io.to(data.room).emit("receive_message", {
            sender: saved.sender,
            content: saved.content,
            room: saved.room,
            createdAt: saved.createdAt,
          });
        } catch (err) {
          console.error("Error saving message:", err);
          io.to(data.room).emit("receive_message", {
            ...data,
            createdAt: new Date().toISOString(),
          });
        }
      }
    );

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
