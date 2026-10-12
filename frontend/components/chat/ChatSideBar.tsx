import React, { useState } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, MoreVertical, LogOut, MessageSquarePlus, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { axiosInstance } from '@/lib/axios';
import { CreateGroupModal } from './CreateGroupModal';

export const ChatSideBar = () => {
  const { users, selectedUser, setSelectedUser, online } = useChatStore();
  const { authUser, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'direct'|'groups'>('direct');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
      logout();
      window.location.href = '/login';
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const filteredUsers = users.filter((u: any) => 
    u._id !== authUser?._id && u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-card shadow-[2px_0_12px_rgba(11,28,48,0.03)] z-10 border-r border-border/40">
      
      {/* Search & Filters Header */}
      <div className="p-4 flex flex-col gap-4 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h1 className="font-heading text-xl font-semibold text-foreground tracking-tight">Messages</h1>
            <span className="text-[11px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-accent">
              {filteredUsers.length}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-xl bg-accent text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all group" title="New message">
              <MessageSquarePlus className="w-4 h-4" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="w-8 h-8 flex items-center justify-center rounded-xl bg-accent text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all group focus:outline-none">
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-border shadow-md rounded-xl">
                 <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer focus:bg-destructive/10 rounded-lg">
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                 </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-12 py-2 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:bg-accent transition-all font-sans"
            placeholder="Search chats, contacts..." 
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-background text-muted-foreground text-[10px] font-medium font-mono border border-border/50">
            <span>⌘</span><span>K</span>
          </div>
        </div>
        
        {/* Segmented Tab Navigation */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center p-1 rounded-xl bg-muted">
            <button 
              onClick={() => setActiveTab('direct')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${activeTab === 'direct' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Direct
            </button>
            <button 
              onClick={() => setActiveTab('groups')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${activeTab === 'groups' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Groups
            </button>
          </div>
          <button 
            onClick={() => setIsGroupModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent hover:bg-accent/80 text-primary text-xs font-semibold transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>New Group</span>
          </button>
        </div>
      </div>

      {/* User List */}
      <ScrollArea className="flex-1 custom-scrollbar px-3 pt-2 pb-4">
        <div className="flex flex-col space-y-1">
          {/* Section Header */}
          <div className="px-2 pt-2 pb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recent Messages</span>
          </div>

          {filteredUsers.map((user: any) => {
            const isSelected = selectedUser?._id === user._id;
            const isOnline = online[user._id];
            
            return (
              <button 
                key={user._id} 
                onClick={() => setSelectedUser(user)} 
                className={`group relative flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer text-left w-full
                  ${isSelected ? 'bg-primary/10' : 'hover:bg-muted'}`}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-11 w-11 rounded-xl border border-border/20 shadow-sm">
                    <AvatarFallback className={`rounded-xl font-heading text-sm ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground'}`}>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-secondary shadow-[0_0_0_2px_var(--color-card)]" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`font-heading text-[14px] font-semibold truncate transition-colors ${isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
                      {user.name}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground flex-shrink-0">
                      {isOnline ? 'Active' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <p className={`text-xs truncate ${isSelected ? 'text-primary/80 font-medium' : 'text-muted-foreground'}`}>
                      {/* Placeholder for last message since we don't have it in data yet */}
                      Click to view chat...
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
          
          {filteredUsers.length === 0 && (
            <div className="text-center p-6 text-sm text-muted-foreground font-medium">
              No conversations found.
            </div>
          )}
        </div>
      </ScrollArea>
      <CreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
    </div>
  );
};