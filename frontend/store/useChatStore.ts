import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { axiosInstance } from '@/lib/axios';
import { useAuthStore } from './useAuthStore';
import { db } from '@/lib/db';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

// ... (Keep User and Message interfaces same as before) ...



import { User, Message } from '../types';

interface ChatState {
  messages: Message[];
  users: User[];
  selectedUser: User | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  hasMoreMessages: boolean;
  socket: Socket | null;
  online: Record<string, boolean>;

  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  loadMoreMessages: (userId: string) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
  connectSocket: () => void;
  disconnectSocket: () => void;
  sendMessage: (text: string) => Promise<void>;
  flushOutbox: () => Promise<void>;
  createGroup: (name: string, memberIds: string[]) => Promise<any>;
}

let isFlushing = false;

export const useChatStore = create<ChatState>((set, get) => ({
  // ... (Initial state same as before) ...
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  hasMoreMessages: true,
  socket: null,
  online: {},

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get('/users');
      set({ users: res.data });
    } catch (error) {
      console.error(error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const { authUser } = useAuthStore.getState();
      const { users } = get();

      if (!authUser) {
        console.warn("getMessages aborted: Not authenticated");
        return;
      }

      const selected = users.find(u => u._id === userId);
      const isGroup = (selected as any)?.isGroup;

      const url = isGroup ? `/messages/group/${userId}` : `/messages/${authUser._id}/${userId}`;
      console.log("Fetching messages from:", url);

      const res = await axiosInstance.get(url);
      set({ 
        messages: res.data,
        hasMoreMessages: res.data.length === 50
      });

      // Mark unread messages as read
      const unreadIds = res.data
        .filter((m: any) => m.receiverId === authUser._id && m.status !== 'read')
        .map((m: any) => m._id || m.id);

      const { socket } = get();
      if (unreadIds.length > 0 && socket?.connected) {
        socket.emit("message:status", { messageIds: unreadIds, status: 'read' });
      }

    } catch (error: any) {
      console.error("getMessages Error:", error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  loadMoreMessages: async (userId: string) => {
    const { messages, isMessagesLoading, users } = get();
    if (isMessagesLoading || messages.length === 0) return;

    set({ isMessagesLoading: true });
    try {
      const { authUser } = useAuthStore.getState();
      if (!authUser) return;

      const selected = users.find(u => u._id === userId);
      const isGroup = (selected as any)?.isGroup;

      const firstMessage = messages[0];
      const cursor = firstMessage.createdAt;
      
      if (!cursor) return;

      const url = isGroup ? `/messages/group/${userId}?cursor=${cursor}` : `/messages/${authUser._id}/${userId}?cursor=${cursor}`;

      const res = await axiosInstance.get(url);
      
      set((state) => ({ 
        messages: [...res.data, ...state.messages],
        hasMoreMessages: res.data.length === 50
      }));

    } catch (error: any) {
      console.error("loadMoreMessages Error:", error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // ... (setSelectedUser is simple) ...
  setSelectedUser: (user) => set({ selectedUser: user }),

  connectSocket: () => {
    const { authUser } = useAuthStore.getState();
    if (!authUser || get().socket) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"]
    });

    socket.connect();
    set({ socket: socket });

    socket.on("connect", async () => {
      console.log("✅ Socket Connected!", socket.id);
      get().flushOutbox();
      
      try {
        const users = get().users;
        if (users.length > 0) {
          const ids = users.map(u => u._id);
          const res = await socket.emitWithAck("presence:query", ids);
          if (res?.data) {
            set({ online: { ...get().online, ...res.data } });
          }
        }
        
        // Load groups
        const groupRes: any = await socket.timeout(5000).emitWithAck("group:list");
        if (groupRes?.ok && groupRes.groups) {
          // Add groups to users list with a flag
          const groupsAsUsers = groupRes.groups.map((g: any) => ({
            _id: g._id,
            name: g.name,
            isGroup: true,
            participants: g.participants
          }));
          
          set((state) => {
            const existingIds = new Set(state.users.map(u => u._id));
            const newGroups = groupsAsUsers.filter((g: any) => !existingIds.has(g._id));
            return { users: [...state.users, ...newGroups] };
          });
        }
      } catch (err) {
        console.error("Presence query error:", err);
      }
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket Connection Error:", err);
    });

    socket.on("private_message", (newMessage) => {
      const { selectedUser } = get();
      const { authUser } = useAuthStore.getState();
      
      const isRelevant =
        selectedUser &&
        (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id);

      if (isRelevant) {
        set((state) => {
          const isDuplicate = state.messages.some(m => m.id === newMessage.id || (m.clientMsgId && m.clientMsgId === newMessage.clientMsgId));
          if (isDuplicate) return state;
          
          return { messages: [...state.messages, newMessage] };
        });
      }

      // If we are the receiver, emit delivered or read
      if (authUser && newMessage.receiverId === authUser._id) {
        const isChatOpen = selectedUser && selectedUser._id === newMessage.senderId;
        const status = isChatOpen ? 'read' : 'delivered';
        socket.emit("message:status", { messageIds: [newMessage.id], status });
      }
    });

    socket.on("message:new", (newMessage) => {
      const { selectedUser } = get();
      
      const isRelevant = selectedUser && (newMessage.groupId === selectedUser._id);

      if (isRelevant) {
        set((state) => {
          const isDuplicate = state.messages.some(m => m.id === newMessage.id || (m.clientMsgId && m.clientMsgId === newMessage.clientMsgId));
          if (isDuplicate) return state;
          
          return { messages: [...state.messages, newMessage] };
        });
      }
    });

    socket.on("presence:update", ({ userId, online }) => {
      set((state) => ({
        online: { ...state.online, [userId]: online }
      }));
    });

    socket.on("message:status_update", ({ updates }) => {
      if (!Array.isArray(updates)) return;
      set((state) => {
        let changed = false;
        const newMessages = state.messages.map(m => {
          const update = updates.find((u: any) => u.messageId === m.id || (m.clientMsgId && u.clientMsgId === m.clientMsgId));
          if (update && m.status !== update.status) {
            changed = true;
            return { ...m, status: update.status };
          }
          return m;
        });
        return changed ? { messages: newMessages } : state;
      });
    });
  },

  // ... (disconnectSocket is simple) ...
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  sendMessage: async (text) => {
    const { selectedUser, socket, messages } = get();
    // ✅ FIX: Use 'authUser' correctly
    const { authUser } = useAuthStore.getState();

    if (!selectedUser || !authUser || !socket) return;

    const isGroup = (selectedUser as any).isGroup;

    const clientMsgId = crypto.randomUUID();
    const queuedAt = Date.now();

    const newMsg = {
      id: clientMsgId,
      clientMsgId,
      senderId: authUser._id,
      receiverId: isGroup ? undefined : selectedUser._id,
      groupId: isGroup ? selectedUser._id : undefined,
      text: text,
      createdAt: new Date().toISOString()
    };

    // Optimistic UI update
    set({ messages: [...messages, newMsg as any] });

    // Save to IndexedDB outbox
    await db.outbox.put({
      clientMsgId,
      senderId: authUser._id,
      receiverId: isGroup ? undefined : selectedUser._id,
      groupId: isGroup ? selectedUser._id : undefined,
      text,
      queuedAt
    });

    if (socket.connected) {
      await get().flushOutbox();
    }
  },

  flushOutbox: async () => {
    if (isFlushing) return;
    const { socket } = get();
    if (!socket || !socket.connected) return;

    isFlushing = true;
    try {
      const pending = await db.outbox.orderBy("queuedAt").toArray();
      for (const msg of pending) {
        try {
          const res: any = await socket.timeout(5000).emitWithAck("message:send", msg);
          if (res.ok) {
            await db.outbox.delete(msg.clientMsgId);
            console.log("Offline message flushed:", msg.clientMsgId);
            
            set((state) => ({
              messages: state.messages.map((m) =>
                m.id === msg.clientMsgId ? { ...m, id: res.id, createdAt: res.createdAt, status: res.status } : m
              )
            }));
          } else {
            break; // Stop if server returns error, retry later
          }
        } catch (err) {
          break; // Stop on timeout/disconnect, keep order
        }
      }
    } finally {
      isFlushing = false;
    }
  },

  createGroup: async (name, memberIds) => {
    const { socket } = get();
    if (!socket || !socket.connected) {
      throw new Error("Not connected to server");
    }

    try {
      const res: any = await socket.timeout(5000).emitWithAck("group:create", { name, memberIds });
      if (res.ok && res.group) {
        const newGroup = {
          _id: res.group._id,
          name: res.group.name,
          isGroup: true,
          participants: res.group.participants
        };
        set(state => ({ users: [newGroup, ...state.users] }));
        return res.group;
      } else {
        throw new Error(res.error || "Failed to create group");
      }
    } catch (err) {
      throw err;
    }
  }
}));