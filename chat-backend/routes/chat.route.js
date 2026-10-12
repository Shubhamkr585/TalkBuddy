import express from "express";
import { getChatHistory, getGroupHistory } from "../controllers/chat.controller.js";

const router = express.Router();

// GET /api/messages/group/:groupId
router.get("/group/:groupId", getGroupHistory);

// GET /api/messages/:myId/:otherUserId
router.get("/:myId/:otherUserId", getChatHistory);

export default router;