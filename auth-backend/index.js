import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;



app.use(cors({
  origin: ["http://localhost:3000", "http://localhost"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, 
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 

app.get("/", (req, res) => {
  res.send("TalkBuddy JWT Backend is Running");
}); 

app.use("/auth", authRoutes);
app.use("/users", userRoutes);


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});