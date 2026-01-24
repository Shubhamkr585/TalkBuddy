import { Server } from "socket.io";
import Message from "../models/message.model.js";

// MAP: { userId: socketId }
const userSocketMap = new Map();

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 User connected -> Socket:", socket.id);

    // 1. REGISTER USER
    socket.on("register_user", (userId) => {
      userSocketMap.set(userId, socket.id);
      console.log(`👤 User ${userId} is online.`);
    });

    // 2. HANDLE PRIVATE MESSAGES
    socket.on("private_message", async (msgData) => {
      try {
        // Save to DB immediately
        const newMsg = await Message.create(msgData);

        // Check if receiver is online
        const receiverSocketId = userSocketMap.get(msgData.receiverId);

        if (receiverSocketId) {
          // Send to the specific user's socket
          io.to(receiverSocketId).emit("private_message", {
            id: newMsg._id.toString(),
            ...msgData
          });
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    });

    // 3. DISCONNECT
    socket.on("disconnect", () => {
      for (let [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          console.log(`👋 User ${userId} went offline.`);
          break;
        }
      }
    });
  });
};