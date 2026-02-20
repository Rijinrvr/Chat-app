"use client";
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
    sender: string;
    content: string;
    room: string;
    createdAt?: string;
}

interface ChatBoxProps {
    username: string;
    room: string;
}

let socket: Socket | null = null;

function getSocket(): Socket {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000");
    }
    return socket;
}

export default function ChatBox({ username, room }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const s = getSocket();
        s.emit("join_room", room);

        const handleHistory = (history: Message[]) => setMessages(history);
        const handleMessage = (data: Message) =>
            setMessages((prev) => [...prev, data]);

        s.on("message_history", handleHistory);
        s.on("receive_message", handleMessage);

        return () => {
            s.off("message_history", handleHistory);
            s.off("receive_message", handleMessage);
        };
    }, [room]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = () => {
        if (!input.trim()) return;
        const s = getSocket();
        s.emit("send_message", { sender: username, content: input, room });
        setInput("");
    };

    return (
        <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {messages.length === 0 && (
                    <p className="text-center text-gray-400 text-sm mt-10">
                        No messages yet. Start the conversation!
                    </p>
                )}
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex flex-col max-w-sm ${msg.sender === username ? "ml-auto items-end" : "items-start"
                            }`}
                    >
                        <span className="text-xs text-gray-500 mb-1">{msg.sender}</span>
                        <div
                            className={`px-4 py-2 rounded-2xl text-sm ${msg.sender === username
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-800 shadow"
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
            <div className="bg-white px-6 py-4 flex gap-3 shadow-inner">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 border px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={sendMessage}
                    className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
