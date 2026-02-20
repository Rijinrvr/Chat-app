"use client";
import { useState } from "react";

interface MessageInputProps {
    onSend: (message: string) => void;
}

export default function MessageInput({ onSend }: MessageInputProps) {
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (!input.trim()) return;
        onSend(input);
        setInput("");
    };

    return (
        <div className="bg-white px-6 py-4 flex gap-3 shadow-inner">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="flex-1 border px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
                onClick={handleSend}
                className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition"
            >
                Send
            </button>
        </div>
    );
}
