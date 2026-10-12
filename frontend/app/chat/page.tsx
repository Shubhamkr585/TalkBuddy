"use client";

import React, { useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ChatSideBar } from '@/components/chat/ChatSideBar';
import { ChatArea } from '@/components/chat/ChatArea';
import { MessageSquare, Users, Hash, Phone, Bookmark, Settings, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

const ChatPage = () => {
  const { authUser, isCheckingAuth } = useAuthStore();
  const { getUsers, connectSocket, disconnectSocket, selectedUser } = useChatStore();
  const { theme, setTheme } = useTheme();

  // Initialize Data & Socket ONCE
  useEffect(() => {
    if (!authUser) return;
    
    getUsers();
    connectSocket();

    return () => disconnectSocket();
  }, [authUser, getUsers, connectSocket, disconnectSocket]);

  if (isCheckingAuth && !authUser) return <div className="flex h-screen items-center justify-center bg-background text-foreground">Loading TalkBuddy...</div>;

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden text-sm">
      
      {/* 1. Icon Rail (Global Navigation) */}
      <aside className="hidden md:flex flex-col items-center justify-between w-16 h-full bg-muted shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 py-4">
        <div className="flex flex-col items-center gap-6 w-full">
          <a className="flex items-center justify-center p-1 rounded-xl bg-card shadow-sm" href="#">
             <MessageSquare className="w-8 h-8 text-primary" />
          </a>
          <div className="w-8 h-[1px] bg-border/50"></div>
          <nav className="flex flex-col items-center gap-2 w-full px-2">
            <a href="#" className="w-10 h-10 flex items-center justify-center transition-colors bg-primary text-primary-foreground rounded-xl" title="All Chats">
              <MessageSquare className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" title="Contacts">
              <Users className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" title="Channels">
              <Hash className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" title="Calls">
              <Phone className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" title="Saved Messages">
              <Bookmark className="w-5 h-5" />
            </a>
          </nav>
        </div>
        <div className="flex flex-col items-center gap-4 w-full px-2">
          <a href="#" className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" title="Settings">
            <Settings className="w-5 h-5" />
          </a>
          <div className="w-8 h-[1px] bg-border/50"></div>
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
              {authUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-secondary ring-2 ring-muted" title="Active Online"></span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-h-screen overflow-hidden">
        
        {/* Global Header */}
        <header className="h-16 bg-background/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-4 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              <span className="font-heading text-lg text-foreground tracking-tight font-semibold">TalkBuddy</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-muted rounded-full">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="text-[11px] font-semibold text-foreground">Active Network</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="relative">
              <button className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-background"></span>
              </button>
            </div>
            <div className="hidden sm:block h-6 w-[1px] bg-border/40"></div>
            <div className="hidden sm:flex items-center gap-2 pl-1">
              <div className="relative flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
                  {authUser?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-secondary ring-2 ring-background" title="Online"></span>
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="font-heading text-[13px] text-foreground font-semibold">{authUser?.name || 'User'}</span>
                <span className="text-[11px] font-semibold text-secondary">Online</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Area (Sidebar + ChatArea) */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar: Show on mobile only if no user is selected. Show always on md+ */}
          <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] lg:w-[380px] shrink-0 h-full flex-col`}>
            <ChatSideBar /> 
          </div>

          {/* Chat Area: Show on mobile only if a user is selected. Show always on md+ */}
          <div className={`${!selectedUser ? 'hidden md:flex' : 'flex'} flex-1 h-full flex-col relative`}>
            <ChatArea />    
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChatPage;