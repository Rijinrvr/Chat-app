"use client";

interface Message {
    sender: string;
    content: string;
    room: string;
    createdAt?: string;
}

interface MessageListProps {
    messages: Message[];
    currentUser: string;
}

export default function MessageList({ messages, currentUser }: MessageListProps) {
    return (
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {messages.length === 0 && (
                <p className="text-center text-gray-400 text-sm mt-10">
                    No messages yet. Start the conversation!
                </p>
            )}
            {messages.map((msg, i) => (
                <div
                    key={i}
                    className={`flex flex-col max-w-sm ${msg.sender === currentUser ? "ml-auto items-end" : "items-start"
                        }`}
                >
                    <span className="text-xs text-gray-500 mb-1">{msg.sender}</span>
                    <div
                        className={`px-4 py-2 rounded-2xl text-sm ${msg.sender === currentUser
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-800 shadow"
                            }`}
                    >
                        {msg.content}
                    </div>
                </div>
            ))}
        </div>
    );
}
