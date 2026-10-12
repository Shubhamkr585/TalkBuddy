import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Send, Smile, Paperclip, Search, MoreVertical, MessageSquare, WifiOff, Check, CheckCheck, Clock, Phone, Video, Pin, Bold, Italic, Code, Link as LinkIcon, Mic } from 'lucide-react';

const ConnectionBanner = () => {
  const { socket } = useChatStore();
  const [isConnected, setIsConnected] = useState(socket?.connected ?? false);

  useEffect(() => {
    if (!socket) return;
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    
    // Set initial state based on current socket status
    setIsConnected(socket.connected);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  if (isConnected) return null;

  return (
    <div className="bg-destructive/10 text-destructive text-xs py-1.5 px-4 flex items-center justify-center gap-2 border-b border-destructive/20 font-semibold absolute top-0 w-full z-50">
      <WifiOff className="h-4 w-4" />
      <span>Connecting to TalkBuddy Cloud...</span>
    </div>
  );
};

const StatusIcon = ({ isOwn, msgId, status }: { isOwn: boolean, msgId: string, status?: string }) => {
  if (!isOwn) return null;
  const isPending = msgId.length > 24; 
  
  if (isPending) {
    return <span title="Sending..."><Clock className="h-3 w-3 text-primary-foreground/50 ml-1" /></span>;
  }
  
  if (status === 'read') {
    return <span title="Read"><CheckCheck className="h-3.5 w-3.5 text-[#3b82f6] ml-1" /></span>; // Blue tick for read
  } else if (status === 'delivered') {
    return <span title="Delivered"><CheckCheck className="h-3.5 w-3.5 text-secondary ml-1" /></span>;
  }
  
  return <span title="Sent"><Check className="h-3.5 w-3.5 text-secondary ml-1" /></span>;
};

export const ChatArea = () => {
  const { messages, selectedUser, getMessages, sendMessage, loadMoreMessages, hasMoreMessages, isMessagesLoading } = useChatStore();
  const { authUser } = useAuthStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef<number>(0);

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser, getMessages]);

  // Handle resetting input safely when user changes
  useEffect(() => {
    if (selectedUser) {
      setInput('');
    }
  }, [selectedUser?._id]);

  // Handle auto-scroll or preserve scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // If we loaded older messages, preserve scroll position
    if (previousScrollHeightRef.current > 0 && messages.length > 0 && container.scrollHeight > previousScrollHeightRef.current) {
      container.scrollTop = container.scrollHeight - previousScrollHeightRef.current;
      previousScrollHeightRef.current = 0; // Reset after adjusting
    } else {
      // Normal scroll to bottom for new messages or initial load
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }); // Use auto to avoid jumpy scroll on first load
    }
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop === 0 && hasMoreMessages && !isMessagesLoading && selectedUser) {
      previousScrollHeightRef.current = target.scrollHeight;
      loadMoreMessages(selectedUser._id);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  };

  if (!selectedUser) {
    return (
      <section className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 bg-background overflow-y-auto relative">
        <div className="w-full max-w-xl flex flex-col items-center text-center my-auto py-12">
          
          <div className="relative w-48 h-48 mb-10 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 via-muted/50 to-secondary/20 blur-2xl transform -translate-y-2"></div>
            
            <div className="absolute -top-1 -right-2 w-28 h-24 rounded-2xl bg-card/80 backdrop-blur-sm shadow-md flex items-center justify-center p-3 transform rotate-6 transition-transform hover:rotate-3">
              <div className="w-full h-full flex flex-col justify-center gap-1.5 opacity-60">
                <div className="w-14 h-2 rounded-full bg-primary/20"></div>
                <div className="w-20 h-2 rounded-full bg-primary/10"></div>
                <div className="w-10 h-2 rounded-full bg-primary/20"></div>
              </div>
              <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-card/80 rotate-45"></div>
            </div>
            
            <div className="absolute -bottom-2 -left-3 w-20 h-16 rounded-xl bg-secondary/20 backdrop-blur-md shadow-sm flex items-center justify-center p-2.5 transform -rotate-12">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              </div>
              <div className="absolute -bottom-1 left-4 w-2 h-2 bg-secondary/20 rotate-45"></div>
            </div>
            
            <div className="relative z-10 w-28 h-28 rounded-3xl bg-primary text-primary-foreground shadow-xl flex flex-col items-center justify-center transform transition-transform hover:scale-105 duration-300">
              <MessageSquare className="w-12 h-12" />
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-primary rotate-45"></div>
            </div>
          </div>
          
          <h2 className="font-heading text-3xl text-foreground tracking-tight mb-3 font-semibold">
            Select a conversation
          </h2>
          <p className="font-sans text-base text-muted-foreground max-w-md mx-auto leading-relaxed mb-10">
            Choose someone from your contacts on the left, or create a group to start collaborating in real-time.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground shadow-md hover:opacity-90 transition-all duration-200 group" type="button">
              <MessageSquare className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="font-heading text-[15px] font-semibold">Start New Chat</span>
            </button>
          </div>
          
          <div className="w-full flex items-center justify-center pt-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted text-muted-foreground">
              <span className="text-[11px] font-semibold">Your messages are end-to-end encrypted and private</span>
            </div>
          </div>

        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 flex flex-col bg-background overflow-hidden relative">
      <ConnectionBanner />

      {/* Conversation Header */}
      <header className="h-16 px-6 flex items-center justify-between bg-card/80 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-20 flex-shrink-0 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-10 h-10 rounded-xl shadow-sm border border-border/20">
              <AvatarFallback className="rounded-xl font-heading text-sm bg-accent text-foreground">
                {selectedUser.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-secondary shadow-[0_0_0_2px_var(--color-card)]"></span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg text-foreground font-semibold leading-tight">{selectedUser.name}</h2>
              <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold text-[11px]">Direct</span>
            </div>
          </div>
        </div>
        
        {/* Chat Header Utility Actions */}
        <div className="flex items-center gap-1">
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Voice Channel Call">
            <Phone className="w-5 h-5" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Instant Video">
            <Video className="w-5 h-5" />
          </button>
          <div className="h-5 w-[1px] bg-border/50 mx-1"></div>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Search in this chat">
            <Search className="w-5 h-5" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Pinned Artifacts">
            <Pin className="w-5 h-5" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="More options">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Message History Stream */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6 custom-scrollbar" 
        id="messages-container"
      >
        
        {isMessagesLoading && (
          <div className="flex items-center justify-center my-2">
            <span className="px-4 py-1 rounded-full bg-muted text-muted-foreground font-semibold text-[11px] shadow-sm uppercase tracking-wider">
              Loading...
            </span>
          </div>
        )}

        {!hasMoreMessages && (
          <div className="flex items-center justify-center my-2">
            <span className="px-4 py-1 rounded-full bg-muted text-muted-foreground font-semibold text-[11px] shadow-sm uppercase tracking-wider">
              Beginning of Conversation
            </span>
          </div>
        )}

        {messages.map((msg: any) => {
          const isOwn = msg.senderId === authUser?._id;
          
          if (isOwn) {
            return (
              <div key={msg.id} className="flex flex-col items-end gap-1 max-w-xl self-end">
                <div className="flex items-baseline gap-2 pr-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  <span className="font-heading text-[13px] text-foreground font-semibold">You</span>
                </div>
                <div className="bg-primary text-primary-foreground p-3 sm:px-4 sm:py-3 rounded-[20px] rounded-br-[4px] shadow-[0_2px_8px_rgba(79,70,229,0.2)]">
                  <p className="font-sans text-[14px] leading-relaxed text-primary-foreground whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                </div>
                <div className="flex items-center gap-1 pr-1 text-primary">
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {msg.status === 'read' ? 'Read' : msg.status === 'delivered' ? 'Delivered' : 'Sent'}
                  </span>
                  <StatusIcon isOwn={isOwn} msgId={msg.id} status={msg.status} />
                </div>
              </div>
            );
          } else {
            return (
              <div key={msg.id} className="flex items-start gap-3 max-w-2xl">
                <Avatar className="w-8 h-8 rounded-xl shadow-sm flex-shrink-0 mt-1 border border-border/20">
                  <AvatarFallback className="rounded-xl font-heading text-xs bg-accent text-foreground">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1 items-start">
                  <div className="flex items-baseline gap-2 pl-1">
                    <span className="font-heading text-[13px] text-foreground font-semibold">{selectedUser.name}</span>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className="bg-card p-3 sm:px-4 sm:py-3 rounded-[20px] rounded-bl-[4px] shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.02)] text-foreground border border-border/40">
                    <p className="font-sans text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          }
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Sticky Chat Composer */}
      <div className="p-4 pt-0 bg-transparent flex-shrink-0 z-20">
        <div className="relative bg-card rounded-2xl p-2 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.08),0_8px_10px_-6px_rgba(15,23,42,0.04)] flex flex-col gap-2 border border-border/50">
          
          {/* Rich Toolbar Header */}
          <div className="flex items-center justify-between px-2 pt-1 border-b border-border/50 pb-1.5">
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Bold className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Italic className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Code className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">Markdown supported</span>
            </div>
          </div>

          {/* Input Area with Action Controls */}
          <div className="flex items-center gap-2 px-1">
            <button className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-primary transition-colors flex-shrink-0">
              <Paperclip className="w-5 h-5" />
            </button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent py-2.5 px-0 text-foreground text-[14px] placeholder:text-muted-foreground border-none focus-visible:ring-0 shadow-none h-auto"
              placeholder="Type a message or press '/' for actions..."
            />
            <button className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex-shrink-0">
              <Smile className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex-shrink-0">
              <Mic className="w-5 h-5" />
            </button>
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95 transition-all flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};