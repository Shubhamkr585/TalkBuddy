import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";

// Imports from your modules
import connectDB from "./config/db.js";
import chatRoutes from "./routes/chat.route.js";
import { initSocket } from "./sockets/sockethandlers.js";

dotenv.config();

// Initialize App & DB
const app = express();
connectDB();

// Middlewares
app.use(cors({
  origin: ['http://localhost:3000'], 
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/messages", chatRoutes);

app.get("/", (req, res) => res.send("Chat Microservice is running"));

// Create HTTP Server & Initialize Socket.io
const server = http.createServer(app);
initSocket(server); // 👈 Socket logic lives here now

// Start Server
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Chat Server listening on port ${port}`);
});