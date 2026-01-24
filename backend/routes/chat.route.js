import express from "express";
import { getChatHistory } from "../controllers/chat.controller.js";

const router = express.Router();

// GET /api/messages/:myId/:otherUserId
router.get("/:myId/:otherUserId", getChatHistory);

export default router;