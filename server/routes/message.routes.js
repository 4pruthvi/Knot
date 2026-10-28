
import express from "express";
import mongoose from "mongoose";
import verifyToken from "../middleware/auth.middleware.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

const createMessageRouter = (io) => {
  const router = express.Router();

  // POST /api/messages
  // Save a message and deliver it to the recipient in real time.
  router.post("/", verifyToken, async (req, res) => {
    try {
      const { receiverId, text } = req.body;
      const senderId = req.userId;

      if (!mongoose.isValidObjectId(receiverId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid receiver ID.",
        });
      }

      if (typeof text !== "string" || !text.trim()) {
        return res.status(400).json({
          success: false,
          message: "Message cannot be empty.",
        });
      }

      if (String(senderId) === String(receiverId)) {
        return res.status(400).json({
          success: false,
          message: "You cannot send a message to yourself.",
        });
      }

      const receiver = await User.findById(receiverId);

      if (!receiver) {
        return res.status(404).json({
          success: false,
          message: "Receiver not found.",
        });
      }

      // Save the message in MongoDB first.
      const message = await Message.create({
        sender: senderId,
        receiver: receiverId,
        text: text.trim(),
      });

      const messageData = {
        id: String(message._id),
        sender: String(message.sender),
        receiver: String(message.receiver),
        text: message.text,
        createdAt: message.createdAt,
      };

      // Send the saved message to the recipient's Socket.IO room.
      io.to(String(receiverId)).emit("new_message", messageData);

      return res.status(201).json({
        success: true,
        message: messageData,
      });
    } catch (error) {
      console.error("Send message error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to send message.",
      });
    }
  });

  // GET /api/messages/:userId
  // Retrieve conversation history between the logged-in user and another user.
  router.get("/:userId", verifyToken, async (req, res) => {
    try {
      const currentUserId = String(req.userId);
      const otherUserId = req.params.userId;

      if (!mongoose.isValidObjectId(otherUserId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID.",
        });
      }

      if (currentUserId === otherUserId) {
        return res.status(400).json({
          success: false,
          message: "Invalid conversation.",
        });
      }

      const otherUser = await User.findById(otherUserId);

      if (!otherUser) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const messages = await Message.find({
        $or: [
          { sender: currentUserId, receiver: otherUserId },
          { sender: otherUserId, receiver: currentUserId },
        ],
      })
        .sort({ createdAt: 1 })
        .lean();

      return res.status(200).json({
        success: true,
        messages: messages.map((message) => ({
          id: String(message._id),
          sender: String(message.sender),
          receiver: String(message.receiver),
          text: message.text,
          createdAt: message.createdAt,
        })),
      });
    } catch (error) {
      console.error("Get messages error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve messages.",
      });
    }
  });

  return router;
};

export default createMessageRouter;
