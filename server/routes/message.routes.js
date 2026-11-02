
import express from "express";
import mongoose from "mongoose";
import verifyToken from "../middleware/auth.middleware.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const createMessageRouter = (io) => {
  const router = express.Router();

  // Configure file upload using memory storage.
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, callback) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/csv",
      ];

      if (allowedTypes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new Error("Unsupported file type."));
      }
    },
  });

  // Handle Multer errors.
  const handleUpload = (req, res, next) => {
    upload.single("attachment")(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message || "File upload failed.",
        });
      }

      next();
    });
  };

  // Helper: Validate message ID and find message.
  async function findMessage(messageId) {
    if (!mongoose.isValidObjectId(messageId)) {
      return null;
    }

    return Message.findById(messageId);
  }

  // POST /api/messages
  // Send a new text message.
  router.post("/", verifyToken, async (req, res) => {
    try {
      const { receiverId, text } = req.body;
      const senderId = String(req.userId);

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

      if (senderId === String(receiverId)) {
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
        attachment: message.attachment || null,
        status: message.status,
        deliveredAt: message.deliveredAt,
        readAt: message.readAt,
        createdAt: message.createdAt,
        isEdited: false,
        isForwarded: Boolean(message.isForwarded),
        deletedForEveryone: false,
      };

      io.to(String(receiverId)).emit("new_message", messageData);

      const unreadCount = await Message.countDocuments({
        sender: senderId,
        receiver: receiverId,
        status: { $ne: "read" },
        deletedForEveryone: false,
      });

      io.to(String(receiverId)).emit("unread_count_update", {
        senderId,
        count: unreadCount,
      });

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

  // POST /api/messages/upload
  // Upload an attachment and send it as a message.
  router.post("/upload", verifyToken, handleUpload, async (req, res) => {
    try {
      const { receiverId, text = "" } = req.body;
      const senderId = String(req.userId);
      const file = req.file;

      if (!mongoose.isValidObjectId(receiverId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid receiver ID.",
        });
      }

      if (senderId === String(receiverId)) {
        return res.status(400).json({
          success: false,
          message: "You cannot send a file to yourself.",
        });
      }

      const receiver = await User.findById(receiverId);

      if (!receiver) {
        return res.status(404).json({
          success: false,
          message: "Receiver not found.",
        });
      }

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "Please select a file.",
        });
      }

      if (typeof text !== "string" || text.length > 5000) {
        return res.status(400).json({
          success: false,
          message: "Invalid message text.",
        });
      }

      // Upload file to Cloudinary.
      const cloudinaryResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "knot/messages",
            resource_type: "auto",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        stream.end(file.buffer);
      });

      const attachmentType = file.mimetype.startsWith("image/")
        ? "image"
        : "file";

      const message = await Message.create({
        sender: senderId,
        receiver: receiverId,
        text: text.trim(),
        attachment: {
          url: cloudinaryResult.secure_url,
          publicId: cloudinaryResult.public_id,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: cloudinaryResult.bytes,
          type: attachmentType,
        },
      });

      const messageData = {
        id: String(message._id),
        sender: String(message.sender),
        receiver: String(message.receiver),
        text: message.text,
        attachment: message.attachment,
        status: message.status,
        deliveredAt: message.deliveredAt,
        readAt: message.readAt,
        createdAt: message.createdAt,
        isEdited: false,
        isForwarded: Boolean(message.isForwarded),
        deletedForEveryone: false,
      };

      io.to(String(receiverId)).emit("new_message", messageData);

      const unreadCount = await Message.countDocuments({
        sender: senderId,
        receiver: receiverId,
        status: { $ne: "read" },
        deletedForEveryone: false,
      });

      io.to(String(receiverId)).emit("unread_count_update", {
        senderId,
        count: unreadCount,
      });

      return res.status(201).json({
        success: true,
        message: messageData,
      });
    } catch (error) {
      console.error("File upload error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to upload attachment.",
      });
    }
  });

  // POST /api/messages/forward
  // Forward an existing text message or attachment.
  router.post("/forward", verifyToken, async (req, res) => {
    try {
      const currentUserId = String(req.userId);
      const { messageId, receiverId } = req.body;

      if (!mongoose.isValidObjectId(messageId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid message ID.",
        });
      }

      if (!mongoose.isValidObjectId(receiverId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid receiver ID.",
        });
      }

      if (currentUserId === String(receiverId)) {
        return res.status(400).json({
          success: false,
          message: "You cannot forward a message to yourself.",
        });
      }

      // Find the original message.
      const originalMessage = await findMessage(messageId);

      if (!originalMessage) {
        return res.status(404).json({
          success: false,
          message: "Original message not found.",
        });
      }

      // Only conversation participants can forward.
      const isParticipant =
        String(originalMessage.sender) === currentUserId ||
        String(originalMessage.receiver) === currentUserId;

      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to forward this message.",
        });
      }

      if (originalMessage.deletedForEveryone) {
        return res.status(400).json({
          success: false,
          message: "Deleted messages cannot be forwarded.",
        });
      }

      const hiddenForCurrentUser = originalMessage.deletedFor.some(
        (id) => String(id) === currentUserId
      );

      if (hiddenForCurrentUser) {
        return res.status(404).json({
          success: false,
          message: "Original message not found.",
        });
      }

      const receiver = await User.findById(receiverId);

      if (!receiver) {
        return res.status(404).json({
          success: false,
          message: "Receiver not found.",
        });
      }

      const forwardedText = originalMessage.text || "";

      const forwardedAttachment = originalMessage.attachment?.url
        ? {
            url: originalMessage.attachment.url,
            publicId: originalMessage.attachment.publicId || null,
            filename: originalMessage.attachment.filename || null,
            mimeType: originalMessage.attachment.mimeType || null,
            size: originalMessage.attachment.size || null,
            type: originalMessage.attachment.type || "file",
          }
        : null;

      if (!forwardedText.trim() && !forwardedAttachment) {
        return res.status(400).json({
          success: false,
          message: "This message has no content to forward.",
        });
      }

      // Create a separate message.
      // Original message remains unchanged.
      const forwardedMessage = await Message.create({
        sender: currentUserId,
        receiver: String(receiverId),
        text: forwardedText,
        attachment: forwardedAttachment || undefined,
        isForwarded: true,
      });

      const messageData = {
        id: String(forwardedMessage._id),
        sender: String(forwardedMessage.sender),
        receiver: String(forwardedMessage.receiver),
        text: forwardedMessage.text || "",
        attachment: forwardedMessage.attachment || null,
        status: forwardedMessage.status || "sent",
        deliveredAt: forwardedMessage.deliveredAt || null,
        readAt: forwardedMessage.readAt || null,
        createdAt: forwardedMessage.createdAt,
        isEdited: false,
        isForwarded: true,
        deletedForEveryone: false,
      };

      // Real-time delivery.
      io.to(String(receiverId)).emit("new_message", messageData);

      // Update unread count.
      const unreadCount = await Message.countDocuments({
        sender: currentUserId,
        receiver: String(receiverId),
        status: { $ne: "read" },
        deletedForEveryone: false,
      });

      io.to(String(receiverId)).emit("unread_count_update", {
        senderId: currentUserId,
        count: unreadCount,
      });

      return res.status(201).json({
        success: true,
        message: messageData,
      });
    } catch (error) {
      console.error("Forward message error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to forward message.",
      });
    }
  });

  // PATCH /api/messages/:messageId
  // Edit a message. Only the sender can edit it.
  router.patch("/:messageId", verifyToken, async (req, res) => {
    try {
      const { text } = req.body;
      const currentUserId = String(req.userId);

      if (typeof text !== "string" || !text.trim()) {
        return res.status(400).json({
          success: false,
          message: "Message text cannot be empty.",
        });
      }

      if (text.trim().length > 5000) {
        return res.status(400).json({
          success: false,
          message: "Message cannot exceed 5000 characters.",
        });
      }

      const message = await findMessage(req.params.messageId);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found.",
        });
      }

      if (String(message.sender) !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: "You can only edit your own messages.",
        });
      }

      if (message.deletedForEveryone) {
        return res.status(400).json({
          success: false,
          message: "Deleted messages cannot be edited.",
        });
      }

      message.text = text.trim();
      message.isEdited = true;

      await message.save();

      const updateData = {
        messageId: String(message._id),
        text: message.text,
        isEdited: true,
      };

      io.to(String(message.sender))
        .to(String(message.receiver))
        .emit("message_edited", updateData);

      return res.status(200).json({
        success: true,
        message: "Message updated successfully.",
        updatedMessage: updateData,
      });
    } catch (error) {
      console.error("Edit message error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to edit message.",
      });
    }
  });

  // DELETE /api/messages/:messageId/everyone
  // Delete a message for both participants.
  router.delete("/:messageId/everyone", verifyToken, async (req, res) => {
    try {
      const currentUserId = String(req.userId);

      const message = await findMessage(req.params.messageId);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found.",
        });
      }

      if (String(message.sender) !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: "Only the sender can delete this message for everyone.",
        });
      }

      if (message.deletedForEveryone) {
        return res.status(400).json({
          success: false,
          message: "Message has already been deleted.",
        });
      }

      message.deletedForEveryone = true;
      message.text = "This message was deleted";

      await message.save();

      const deleteData = {
        messageId: String(message._id),
        deletedForEveryone: true,
      };

      io.to(String(message.sender))
        .to(String(message.receiver))
        .emit("message_deleted_everyone", deleteData);

      return res.status(200).json({
        success: true,
        message: "Message deleted for everyone.",
        deletedMessage: deleteData,
      });
    } catch (error) {
      console.error("Delete for everyone error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to delete message.",
      });
    }
  });

  // DELETE /api/messages/:messageId/me
  // Hide a message from the current user's chat only.
  router.delete("/:messageId/me", verifyToken, async (req, res) => {
    try {
      const currentUserId = String(req.userId);

      const message = await findMessage(req.params.messageId);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found.",
        });
      }

      const isParticipant =
        String(message.sender) === currentUserId ||
        String(message.receiver) === currentUserId;

      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          message: "You cannot delete this message.",
        });
      }

      if (message.deletedForEveryone) {
        return res.status(400).json({
          success: false,
          message: "Message has already been deleted for everyone.",
        });
      }

      const alreadyDeleted = message.deletedFor.some(
        (id) => String(id) === currentUserId
      );

      if (!alreadyDeleted) {
        message.deletedFor.push(currentUserId);
        await message.save();
      }

      const deleteData = {
        messageId: String(message._id),
        userId: currentUserId,
      };

      io.to(currentUserId).emit("message_deleted_for_me", deleteData);

      return res.status(200).json({
        success: true,
        message: "Message deleted from your chat.",
        deletedMessage: deleteData,
      });
    } catch (error) {
      console.error("Delete for me error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to delete message.",
      });
    }
  });

  // GET /api/messages/unread-counts
  // Get unread counts for all conversations.
  router.get("/unread-counts", verifyToken, async (req, res) => {
    try {
      const currentUserId = String(req.userId);

      const unreadMessages = await Message.aggregate([
        {
          $match: {
            receiver: new mongoose.Types.ObjectId(currentUserId),
            status: { $ne: "read" },
            deletedForEveryone: { $ne: true },
            deletedFor: {
              $nin: [new mongoose.Types.ObjectId(currentUserId)],
            },
          },
        },
        {
          $group: {
            _id: "$sender",
            count: { $sum: 1 },
          },
        },
      ]);

      const unreadCounts = {};

      unreadMessages.forEach((item) => {
        unreadCounts[String(item._id)] = item.count;
      });

      return res.status(200).json({
        success: true,
        unreadCounts,
      });
    } catch (error) {
      console.error("Unread counts error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve unread counts.",
      });
    }
  });

  // PATCH /api/messages/:userId/read
  // Mark messages from another user as read.
  router.patch("/:userId/read", verifyToken, async (req, res) => {
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

      const readAt = new Date();

      const result = await Message.updateMany(
        {
          sender: otherUserId,
          receiver: currentUserId,
          status: { $ne: "read" },
        },
        {
          $set: {
            status: "read",
            readAt,
          },
        }
      );

      io.to(otherUserId).emit("messages_read", {
        readerId: currentUserId,
        conversationId: currentUserId,
        readAt,
      });

      io.to(currentUserId).emit("unread_count_update", {
        senderId: otherUserId,
        count: 0,
      });

      return res.status(200).json({
        success: true,
        message: "Messages marked as read.",
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error("Mark messages read error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to mark messages as read.",
      });
    }
  });

  // GET /api/messages/:userId
  // Retrieve conversation history.
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
          {
            sender: currentUserId,
            receiver: otherUserId,
          },
          {
            sender: otherUserId,
            receiver: currentUserId,
          },
        ],
        deletedForEveryone: { $ne: true },
        deletedFor: {
          $ne: new mongoose.Types.ObjectId(currentUserId),
        },
      })
        .sort({ createdAt: 1 })
        .lean();

      return res.status(200).json({
        success: true,
        messages: messages.map((message) => ({
          id: String(message._id),
          sender: String(message.sender),
          receiver: String(message.receiver),
          text: message.text || "",
          attachment: message.attachment || null,
          status: message.status || "sent",
          deliveredAt: message.deliveredAt || null,
          readAt: message.readAt || null,
          createdAt: message.createdAt,
          isEdited: Boolean(message.isEdited),
          isForwarded: Boolean(message.isForwarded),
          deletedForEveryone: Boolean(message.deletedForEveryone),
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
