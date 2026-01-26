"use client";

import React, { useState, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { axiosInstance, chatAxiosInstance } from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

// Icons
import { Send, MoreVertical, Search, LogOut, MessageSquare, Phone, Video, Paperclip, Smile } from 'lucide-react';

// --- Types ---
interface User {
  _id: string;
  name: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
}

const SOCKET_URL = "http://localhost:5000";

const Chat = () => {
  // Authentication & Users State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const { logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
      logout(); 
      window.location.href = '/login'; 
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // 1. Fetch Current User & Users List
  useEffect(() => {
    const fetchData = async () => {
      try {
        const meRes = await axiosInstance.get('/auth/me');
        setCurrentUser(meRes.data.user || meRes.data); 

        const usersRes = await axiosInstance.get('/users');
        setUsers(usersRes.data);
        console.log(usersRes.data);
      } catch (err) {
        console.log(err);
        window.location.href = '/login'; 
      }
    };
    fetchData();
  }, []);

  // 2. Initialize Socket
  useEffect(() => {
    if (!currentUser) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true, 
    });

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("register_user", currentUser._id); 
    });

    socket.on("private_message", (incomingMsg: Message) => {
      setMessages((prev) => [...prev, incomingMsg]);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Fetch Chat History when a user is clicked
  useEffect(() => {
    // If I haven't clicked on anyone yet, do nothing.
    if (!currentUser || !selectedUser) return;

    const fetchChatHistory = async () => {
      try {
        // Call the new modular backend route
        const res = await chatAxiosInstance.get(`/api/messages/${currentUser._id}/${selectedUser._id}`);
        
        // Update the screen with the old messages
        setMessages(res.data);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };

    fetchChatHistory();

  }, [currentUser, selectedUser]); // 👈 Runs every time you click a different user

  // 3. Send Message Logic
  const handleSend = () => {
    if (!input.trim() || !socketRef.current || !selectedUser || !currentUser) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: currentUser._id,
      receiverId: selectedUser._id,
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    socketRef.current.emit('private_message', newMsg);
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
  };

  const activeChatMessages = messages.filter(
    (msg) => 
      (msg.senderId === currentUser?._id && msg.receiverId === selectedUser?._id) ||
      (msg.senderId === selectedUser?._id && msg.receiverId === currentUser?._id)
  );

  const filteredUsers = users.filter(u => 
    u._id !== currentUser?._id && u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) return <div className="flex h-screen items-center justify-center bg-[#eae6df]">Loading TalkBuddy...</div>;

  return (
    <div className="flex h-screen bg-[#eae6df] py-4 px-4 overflow-hidden">
      <div className="flex w-full max-w-7xl mx-auto h-full bg-white shadow-2xl rounded-xl overflow-hidden border">
        
        {/* LEFT SIDEBAR: User List */}
        <aside className="w-[380px] bg-white border-r border-gray-200 flex flex-col z-20">
          {/* Sidebar Header */}
          <header className="h-16 bg-gray-50 flex items-center justify-between px-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-gray-200">
                <AvatarFallback className="bg-emerald-600 text-white font-bold text-lg">
                  {currentUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-gray-800">{currentUser.name}</span>
            </div>
            
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-200">
                <MessageSquare className="h-5 w-5" />
              </Button>
              
              {/* Logout Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-200">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Search Bar */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search or start a new chat" 
                className="pl-9 bg-gray-50 border-none focus-visible:ring-emerald-500 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Users List */}
          <ScrollArea className="flex-1 bg-white">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors
                  ${selectedUser?._id === user._id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gray-300 text-gray-600 font-medium text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 border-b border-gray-100 pb-3 mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-medium text-gray-900">{user.name}</h3>
                    <span className="text-xs text-gray-400">Online</span>
                  </div>
                  <p className="text-xs text-emerald-600 font-medium">Click to chat</p>
                </div>
              </div>
            ))}
          </ScrollArea>
        </aside>

        {/* RIGHT MAIN: Chat Area */}
        <main className="flex-1 flex flex-col h-full bg-[#efeae2] relative">
          {selectedUser ? (
            <>
              {/* Chat Background Pattern */}
              <div className="absolute inset-0 opacity-[0.06] pointer-events-none" 
                   style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
              </div>

              {/* Chat Header */}
              <header className="h-16 bg-gray-50 flex items-center justify-between px-4 border-b z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gray-400 text-white font-bold">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-gray-800 leading-none">{selectedUser.name}</h2>
                    <span className="text-xs text-gray-500">online</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="text-gray-500">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-gray-500">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-gray-500">
                    <Search className="h-5 w-5" />
                  </Button>
                </div>
              </header>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-6 z-10">
                <div className="space-y-3">
                  {activeChatMessages.map((msg) => {
                    const isOwn = msg.senderId === currentUser._id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`relative max-w-[65%] px-3 py-1.5 rounded-lg shadow-sm text-[15px]
                          ${isOwn ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}
                        `}>
                          {/* WhatsApp little corner tail using pseudo-elements in standard CSS, but simple radius here */}
                          <p className="leading-snug">{msg.text}</p>
                          <span className={`text-[10px] float-right mt-1.5 ml-3 ${isOwn ? 'text-gray-500' : 'text-gray-400'}`}>
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <footer className="bg-gray-50 p-3 flex items-center gap-2 z-10">
                <Button variant="ghost" size="icon" className="text-gray-500">
                  <Smile className="h-6 w-6" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-500">
                  <Paperclip className="h-5 w-5" />
                </Button>
                
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message"
                  className="flex-1 bg-white border-none shadow-sm focus-visible:ring-emerald-500 px-4 py-5"
                />
                
                <Button 
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 w-10 p-0 rounded-full flex items-center justify-center shadow-md disabled:opacity-50"
                >
                  <Send className="h-5 w-5 ml-0.5" />
                </Button>
              </footer>
            </>
          ) : (
            // Empty State
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 z-10 border-l">
              <div className="bg-emerald-100 p-6 rounded-full mb-6">
                <MessageSquare className="h-12 w-12 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-light text-gray-700 mb-2">TalkBuddy Web</h1>
              <p className="text-gray-500 text-sm">Send and receive messages privately.</p>
              <div className="absolute bottom-10 flex items-center text-xs text-gray-400">
                End-to-end encrypted
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Chat;