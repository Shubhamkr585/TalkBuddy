import { Server } from "socket.io";
import prisma from "../prismaClient.js";
import { parseCookie } from "cookie";
import jwt from "jsonwebtoken";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import crypto from "crypto";

const getOrCreateConversation = async (user1, user2) => {
  const participants = [user1, user2].sort();
  const participantsKey = participants.join("-");
  
  let convo = await prisma.conversation.findUnique({ where: { participantsKey } });
  if (!convo) {
    try {
      convo = await prisma.conversation.create({ 
        data: { participantsKey, participants } 
      });
    } catch (e) {
      if (e.code === 'P2002') convo = await prisma.conversation.findUnique({ where: { participantsKey } });
      else throw e;
    }
  }
  return convo;
};

import promClient from "prom-client";

// Prometheus Metrics
const activeConnectionsGauge = new promClient.Gauge({
  name: 'talkbuddy_active_websocket_connections',
  help: 'Total number of active WebSocket connections',
});

const messageLatencyHistogram = new promClient.Histogram({
  name: 'talkbuddy_message_latency_ms',
  help: 'Latency of message processing in milliseconds',
  buckets: [10, 50, 100, 250, 500, 1000, 2000],
});

export const initSocket = async (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:8080"], 
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Redis Setup
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  pubClient.on("error", (err) => console.log("Redis Pub Error", err));
  subClient.on("error", (err) => console.log("Redis Sub Error", err));

  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
  console.log("✅ Redis Adapter Connected");

  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) return next(new Error("unauthorized"));
      
      const cookies = parseCookie(cookieHeader);
      const token = cookies.jwt;
      if (!token) return next(new Error("unauthorized"));
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    activeConnectionsGauge.inc();
    const instanceId = process.env.INSTANCE_ID || "unknown";
    console.log(`🔌 User ${socket.userId} connected to instance ${instanceId} -> Socket: ${socket.id}`);
    
    // Join a room specifically for this user
    socket.join(`user:${socket.userId}`);
    
    // Fetch and join groups
    prisma.conversation.findMany({ 
      where: { 
        type: "group", 
        participants: { has: socket.userId } 
      }
    })
      .then(groups => {
        groups.forEach(g => socket.join(`group:${g.id}`));
      })
      .catch(err => console.error("Error joining groups:", err));
    
    // Presence: Mark user as online
    const presenceKey = `presence:${socket.userId}`;
    const updatePresence = () => {
      pubClient.zAdd(presenceKey, [{ score: Date.now(), value: socket.id }]).catch(err => console.error("Presence zAdd error:", err.message));
      pubClient.expire(presenceKey, 120).catch(err => console.error("Presence expire error:", err.message));
    };

    updatePresence();
    io.emit("presence:update", { userId: socket.userId, online: true });

    // Mark pending messages as delivered
    setTimeout(async () => {
      try {
        const msgs = await prisma.message.findMany({ 
          where: { receiverId: socket.userId, status: "sent" } 
        });
        
        if (msgs.length > 0) {
          const updateIds = msgs.map(m => m.id);
          await prisma.message.updateMany({ 
            where: { id: { in: updateIds } }, 
            data: { status: "delivered" } 
          });

          // Group by sender to emit updates
          const bySender = {};
          for (const msg of msgs) {
            if (!bySender[msg.senderId]) bySender[msg.senderId] = [];
            bySender[msg.senderId].push({
              messageId: msg.id,
              clientMsgId: msg.clientMsgId,
              status: "delivered"
            });
          }

          // Emit status update to senders
          for (const [senderId, updates] of Object.entries(bySender)) {
            io.to(`user:${senderId}`).emit("message:status_update", {
              updates,
              receiverId: socket.userId
            });
          }
        }
      } catch (err) {
        console.error("Error marking messages delivered on connect:", err);
      }
    }, 1000);

    // 15s heartbeat
    const heartbeatTimer = setInterval(updatePresence, 15000);

    socket.on("presence:query", async (ids, ack) => {
      try {
        if (!Array.isArray(ids) || ids.length > 200) {
          if (ack) ack({ error: "invalid_request" });
          return;
        }
        const result = {};
        const cutoff = Date.now() - 45000;
        for (const id of ids) {
          const count = await pubClient.zCount(`presence:${id}`, cutoff, "+inf");
          result[id] = count > 0;
        }
        if (ack) ack({ data: result });
      } catch (err) {
        console.error("Presence query error:", err);
        if (ack) ack({ error: "server_error" });
      }
    });

    socket.on("group:create", async ({ name, memberIds }, ack) => {
      try {
        if (!name || name.length > 50 || !Array.isArray(memberIds)) {
          if (ack) ack({ ok: false, error: "invalid_input" });
          return;
        }
        let members = [...new Set([...memberIds, socket.userId])];
        if (members.length < 2 || members.length > 100) {
          if (ack) ack({ ok: false, error: "invalid_members_count" });
          return;
        }

        const participantsKey = "group:" + crypto.randomUUID();
        const group = await prisma.conversation.create({
          data: {
            participantsKey,
            participants: members,
            type: "group",
            name,
            admins: [socket.userId],
            createdBy: socket.userId
          }
        });

        for (const id of members) {
          io.in(`user:${id}`).socketsJoin(`group:${group.id}`);
          io.to(`user:${id}`).emit("group:created", group);
        }
        
        if (ack) ack({ ok: true, group });
      } catch (err) {
        console.error("group:create error:", err);
        if (ack) ack({ ok: false, error: "server_error" });
      }
    });

    socket.on("group:list", async (ack) => {
      try {
        const groups = await prisma.conversation.findMany({ 
          where: { type: "group", participants: { has: socket.userId } },
          orderBy: { lastMessageAt: 'desc' }
        });
        if (ack) ack({ ok: true, groups });
      } catch (err) {
        console.error("group:list error:", err);
        if (ack) ack({ ok: false, error: "server_error" });
      }
    });

    socket.on("message:send", async (msgData, ack) => {
      const endTimer = messageLatencyHistogram.startTimer();
      try {
        const { receiverId, groupId, text, clientMsgId } = msgData;
        const senderId = socket.userId;
        const key = `idem:${senderId}:${clientMsgId}`;

        // Fast path: Check Redis for duplicate
        const hit = await pubClient.get(key);
        if (hit) {
          if (ack) ack({ ok: true, duplicate: true, ...JSON.parse(hit) });
          return;
        }

        let updatedConvo;
        let convoId;
        
        if (groupId) {
          updatedConvo = await prisma.conversation.update({
            where: { id: groupId }, // Access control check omitted for speed, or verify participants earlier
            data: { lastSeq: { increment: 1 }, lastMessageAt: new Date() }
          });
          convoId = updatedConvo.id;
        } else {
          const convo = await getOrCreateConversation(senderId, receiverId);
          convoId = convo.id;
          updatedConvo = await prisma.conversation.update({
            where: { id: convoId },
            data: { lastSeq: { increment: 1 }, lastMessageAt: new Date() }
          });
        }

        const newMsgId = crypto.randomUUID();
        const createdAt = new Date();

        const socketPayload = {
          id: newMsgId,
          senderId,
          receiverId: groupId ? null : receiverId,
          groupId,
          conversationId: convoId,
          seq: updatedConvo.lastSeq,
          text,
          createdAt,
          clientMsgId,
          status: "sent",
          instanceId
        };

        // 2. Await PostgreSQL Insert to guarantee persistence
        await prisma.message.create({
          data: {
            id: newMsgId,
            senderId,
            receiverId: groupId ? null : receiverId,
            conversationId: convoId,
            seq: updatedConvo.lastSeq,
            text,
            clientMsgId,
            createdAt
          }
        });

        // Cache idempotency key for 24h AFTER successful insert
        await pubClient.set(key, JSON.stringify(socketPayload), { EX: 86400 });

        // 3. Ack to Sender
        if (ack) {
          ack({ ok: true, ...socketPayload });
        }

        // 4. Emit to Receiver's room or Group's room
        if (groupId) {
          io.to(`group:${groupId}`).emit("message:new", socketPayload);
        } else {
          io.to(`user:${receiverId}`).emit("private_message", socketPayload);
        }
        
        endTimer(); // Record message latency

      } catch (error) {
        endTimer(); // Record even on error
        console.error("Error handling message:", error);
        if (ack) {
          ack({ ok: false, error: "Server error" });
        }
      }
    });

    socket.on("sync:since", async ({ conversationId, lastSeq }, ack) => {
      try {
        const convo = await prisma.conversation.findFirst({
          where: { id: conversationId, participants: { has: socket.userId } }, select: { id: true } 
        });
        if (!convo) return ack?.({ ok: false, error: "not_a_member" });
        
        const missed = await prisma.message.findMany({
          where: { conversationId, seq: { gt: lastSeq } },
          orderBy: { seq: 'asc' }
        });
        if (ack) ack({ ok: true, messages: missed });
      } catch (e) {
        if (ack) ack({ ok: false, error: "Sync failed" });
      }
    });

    socket.on("message:status", async ({ messageIds, status }, ack) => {
      try {
        if (!["delivered", "read"].includes(status)) return;
        if (!Array.isArray(messageIds) || messageIds.length === 0) return;
        
        const msgs = await prisma.message.findMany({ 
          where: { id: { in: messageIds }, receiverId: socket.userId } 
        });
        
        const toUpdate = msgs.filter(msg => 
          msg.status !== "read" && !(msg.status === "delivered" && status === "delivered")
        );

        if (toUpdate.length === 0) return;

        const updateIds = toUpdate.map(m => m.id);
        await prisma.message.updateMany({ 
          where: { id: { in: updateIds } }, 
          data: { status } 
        });

        const bySender = {};
        for (const msg of toUpdate) {
          if (!bySender[msg.senderId]) bySender[msg.senderId] = [];
          bySender[msg.senderId].push({
            messageId: msg.id,
            clientMsgId: msg.clientMsgId,
            status
          });
        }

        for (const [senderId, updates] of Object.entries(bySender)) {
          io.to(`user:${senderId}`).emit("message:status_update", {
            updates,
            receiverId: socket.userId
          });
        }
        
        if (ack) ack({ ok: true });
      } catch (e) {
        console.error("Error updating message status:", e);
        if (ack) ack({ ok: false, error: "Status update failed" });
      }
    });

    socket.on("disconnect", async () => {
      activeConnectionsGauge.dec();
      clearInterval(heartbeatTimer);
      try {
        await pubClient.zRem(presenceKey, socket.id);
        const count = await pubClient.zCount(presenceKey, Date.now() - 45000, "+inf");
        if (count === 0) {
          io.emit("presence:update", { userId: socket.userId, online: false });
        }
      } catch (err) {
        console.error("Disconnect presence error:", err);
      }
      console.log(`👋 User ${socket.userId} went offline from instance ${instanceId}.`);
    });
  });
};