"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";

interface Message {
  sender: string;
  content: string;
  room: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [room, setRoom] = useState("general");
  const [username, setUsername] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) {
      router.push("/login");
      return;
    }
    setUsername(storedUsername);
    socket.emit("join_room", room);

    socket.on("receive_message", (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, [room]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const messageData: Message = { sender: username, content: input, room };
    socket.emit("send_message", messageData);
    setMessages((prev) => [...prev, messageData]);
    setInput("");
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("username");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Chat App — #{room}</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">Hello, {username}</span>
          <button
            onClick={handleLogout}
            className="bg-white text-blue-600 px-3 py-1 rounded-lg text-sm hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Room selector */}
      <div className="flex gap-2 px-6 py-3 bg-white shadow">
        {["general", "tech", "random"].map((r) => (
          <button
            key={r}
            onClick={() => {
              setRoom(r);
              setMessages([]);
            }}
            className={`px-4 py-1 rounded-full text-sm font-medium transition ${
              room === r
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            #{r}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col max-w-sm ${
              msg.sender === username ? "ml-auto items-end" : "items-start"
            }`}
          >
            <span className="text-xs text-gray-500 mb-1">{msg.sender}</span>
            <div
              className={`px-4 py-2 rounded-2xl text-sm ${
                msg.sender === username
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

      {/* Input */}
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
