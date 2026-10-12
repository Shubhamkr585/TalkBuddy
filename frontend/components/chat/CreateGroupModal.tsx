import React, { useState } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { X, Camera, Lock, Loader2, Check, Search } from 'lucide-react';

export const CreateGroupModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { users, createGroup } = useChatStore();
  const { authUser } = useAuthStore();
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const filteredUsers = users.filter((u: any) => 
    u._id !== authUser?._id && 
    (u.name.toLowerCase().includes(search.toLowerCase()) || 
     u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleUser = (userId: string) => {
    setSelectedIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }
    if (selectedIds.length === 0) {
      setError('Select at least one member');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await createGroup(name.trim(), selectedIds);
      // Reset and close
      setName('');
      setTopic('');
      setSelectedIds([]);
      setSearch('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/40 backdrop-blur-md transition-opacity duration-300">
      <div className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border/50">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 bg-card">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-heading text-2xl text-foreground font-semibold tracking-tight">Create New Group</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-semibold text-[11px] uppercase tracking-wider">Fast Sync</span>
            </div>
            <p className="font-sans text-sm text-muted-foreground mt-0.5">Bring team members together in one real-time channel</p>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6 custom-scrollbar">
          
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20 font-medium">
              {error}
            </div>
          )}

          {/* Group Identity Section */}
          <div className="flex flex-col sm:flex-row items-start gap-5 bg-muted/50 p-4 rounded-xl border border-border/50">
            {/* Avatar Placeholder */}
            <div className="relative flex-shrink-0 mx-auto sm:mx-0">
              <div className="w-20 h-20 rounded-2xl bg-muted flex flex-col items-center justify-center text-primary border border-border/50 shadow-inner">
                <Camera className="w-7 h-7 mb-1 opacity-70" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Avatar</span>
              </div>
            </div>
            
            {/* Group Meta Form Fields */}
            <div className="flex-1 flex flex-col gap-3 w-full">
              <div>
                <label className="block text-sm text-foreground mb-1.5 font-medium" htmlFor="group-name">
                  Group Name <span className="text-destructive">*</span>
                </label>
                <input 
                  id="group-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow shadow-sm border border-border/50" 
                  placeholder="e.g. Design Systems, Marketing Ops" 
                  type="text" 
                />
              </div>
              <div>
                <label className="block text-sm text-foreground mb-1.5 font-medium" htmlFor="group-topic">
                  Topic & Description <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                </label>
                <textarea 
                  id="group-topic"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full p-3 rounded-lg bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow resize-none shadow-sm border border-border/50" 
                  placeholder="Describe team focus, key objectives..." 
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Contact Directory & Search Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm text-foreground">Select Members</span>
              <span className="font-semibold text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {selectedIds.length} selected
              </span>
            </div>

            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" />
              <input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent focus:border-primary/50" 
                placeholder="Search contacts by name..." 
                type="text"
              />
            </div>

            {/* Contacts Scroll Area */}
            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
              {filteredUsers.length === 0 ? (
                <div className="text-center p-4 text-sm text-muted-foreground">
                  No contacts found.
                </div>
              ) : (
                filteredUsers.map((user: any) => {
                  const isSelected = selectedIds.includes(user._id);
                  return (
                    <label 
                      key={user._id}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors border
                        ${isSelected ? 'bg-primary/5 border-primary/20' : 'bg-background border-transparent hover:bg-muted'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-accent text-foreground flex items-center justify-center font-heading text-sm font-semibold flex-shrink-0 border border-border/20 shadow-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-heading text-sm text-foreground truncate font-semibold">{user.name}</span>
                          <span className="text-xs text-muted-foreground truncate">{user.email || 'Member'}</span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded flex items-center justify-center ml-3 flex-shrink-0 transition-colors border
                        ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-transparent'}`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={isSelected}
                        onChange={() => toggleUser(user._id)}
                      />
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Action Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-muted border-t border-border/50">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Lock className="w-4 h-4 text-secondary" />
            <span className="text-xs font-medium">End-to-end encrypted channel</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreate}
              disabled={isLoading || selectedIds.length === 0 || !name.trim()}
              className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Create Group</span>
                  {selectedIds.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-primary-foreground/20 text-primary-foreground text-[10px] font-bold">
                      {selectedIds.length + 1}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
