import express from "express";
import {
  initiateChat,
  getChatHistory,
  sendMessage,
  getUserChats,
  deleteMessage,
  markMessagesAsRead,
} from "../controllers/chat.controller.js";
import {
  authenticateUser,
  requireRole,
  requireVerification,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Middleware: All chat routes require authentication
router.use(authenticateUser);

// Middleware: All chat routes require verified account
router.use(requireVerification);

// Middleware: Only trainers and members can access chat features
router.use(requireRole("trainer", "member"));

// Chat management routes
router.post("/initiate", initiateChat);
router.get("/", getUserChats);
router.get("/:chatId/history", getChatHistory);
router.put("/:chatId/read", markMessagesAsRead);

// Message management routes
router.post("/message", sendMessage);
router.delete("/message/:messageId", deleteMessage);

export default router;