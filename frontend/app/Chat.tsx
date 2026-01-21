"use client"; 

import React, { useState, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string | number;
  text: string;
  sender: 'user' | 'other';
  isOwn: boolean;
  timestamp: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "Connected! Start chatting...",
      sender: 'other',
      isOwn: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // ────────────────────────────────────────────────
  //          🔌 REAL-TIME CONFIGURATION AREA
  // ────────────────────────────────────────────────
  // Change this if your backend is running on a different URL/port
  // Local development → "http://localhost:5000"
  // Deployed → "https://your-app-domain.com"
  const SOCKET_URL = "http://localhost:5000";

useEffect(() => {
  console.log("Attempting to connect to:", SOCKET_URL);

  const socket = io(SOCKET_URL, {
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 10000,
    transports: [ 'websocket'],   // ← important: try polling first
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected! ID:", socket.id);
    setIsConnected(true);
  });

  socket.on("message", (incomingData) => {
    console.log("Message from other:", incomingData);
    
    const newMsg: Message = {
        id: Date.now() + Math.random(), // Unique ID generate kar lo
        text: incomingData.text,
        sender: 'other',
        isOwn: false,
        timestamp: incomingData.timestamp || new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, newMsg]);
});

  socket.on("connect_error", (err) => {
    console.error("❌ connect_error:", err.message);
    setIsConnected(false);
  });

  socket.on("error", (err) => {
    console.error("❌ socket error:", err);
  });

  socket.on("disconnect", (reason) => {
    console.log("Disconnected:", reason);
    setIsConnected(false);
  });

  socketRef.current = socket;

  return () => {
    socket.disconnect();
  };
}, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !socketRef.current || !isConnected) return;

    const messageText = input.trim();

    // Send message to server
    socketRef.current.emit('message', {
      text: messageText,
      // You can add more fields later, e.g.:
      // username: "Shubham",
      // room: "general"
    });

    // Optimistic UI update (show own message immediately)
    const ownMsg: Message = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      isOwn: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, ownMsg]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
            T
          </div>
          <div>
            <h1 className="font-semibold">TalkBuddy Chat</h1>
            <p className="text-xs flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-400'}`} />
              {isConnected ? 'Connected' : 'Reconnecting...'}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 pb-24">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-sm
                ${msg.isOwn
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                }
              `}
            >
              <p className="break-words leading-relaxed">{msg.text}</p>
              <span className="text-xs opacity-70 mt-1 block text-right">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <footer className="bg-white border-t p-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={!isConnected}
            className={`
              flex-1 px-5 py-3 bg-gray-100 rounded-full 
              focus:outline-none focus:ring-2 focus:ring-blue-500/50
              placeholder:text-gray-500 transition-all
              ${!isConnected && 'opacity-60 cursor-not-allowed'}
            `}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !isConnected}
            className={`
              px-6 py-3 rounded-full font-medium text-white min-w-[90px]
              transition-all duration-200
              ${input.trim() && isConnected
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md'
                : 'bg-gray-300 cursor-not-allowed'
              }
            `}
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Chat;