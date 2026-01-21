import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectToMongoDB from "./db/connectionToMongoDB.js";
import { sessionConfig } from "./config/session.js";
import authRoutes from "./routes/auth.route.js"; // Import moved up

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// 1. Database Connection
connectToMongoDB();

// 2. CORS Setup (Bahut Zaroori hai Cookies ke liye)
app.use(cors({
  origin: "[http://localhost:3000,http://localhost:3000]", // Aapke Frontend ka URL (Change karein jab deploy karein)
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // Ye TRUE hona chahiye tabhi cookie pass hogi
}));

// 3. Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Session Middleware (Routes se pehle aana chahiye)
app.use(sessionConfig);

// 5. Routes
app.get("/", (req, res) => {
  res.send("TalkBuddy Backend is Running");
}); 

app.use("/auth", authRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});