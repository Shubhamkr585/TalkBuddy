import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Important: Apply CORS middleware to Express FIRST
app.use(cors({
  origin:'*',  // ← your frontend origin(s)
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,  // if you ever use cookies/auth
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Handle OPTIONS preflight requests for all routes (including /socket.io)
app.options("/*", cors());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with explicit CORS
const io = new Server(server, {
  cors: {
    origin:'*',  // ← match exactly what frontend uses
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Optional: increase timeout if needed
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on("connection", (socket) => {
  console.log("a user connected → ID:", socket.id);

  socket.on("message", (data) => {
    console.log("Message received:", data);
    socket.broadcast.emit ("message", {
      text: data.text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

// Your routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Yeh ready to build talkbuddy backend");
});

// Start server
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});