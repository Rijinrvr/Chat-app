import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Message from "@/models/Message";

// GET /api/socket?room=general — fetch messages for a room
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const room = req.nextUrl.searchParams.get("room") || "general";
        const messages = await Message.find({ room })
            .sort({ createdAt: 1 })
            .limit(100)
            .lean();
        return NextResponse.json({ messages });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch messages" },
            { status: 500 }
        );
    }
}
