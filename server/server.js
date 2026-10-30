
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import createMessageRouter from "./routes/message.routes.js";
import Message from "./models/message.model.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// API routes
app.use("/api/messages", createMessageRouter(io));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRouter);

app.get("/", (req, res) => {
  res.send("KNOT backend is running!");
});

// Track active connections for each user.
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Register user and join their personal room.
  socket.on("register_user", (userId) => {
    if (
      typeof userId !== "string" ||
      !mongoose.isValidObjectId(userId)
    ) {
      console.log("Invalid Socket.IO user registration");
      return;
    }

    if (socket.data.userId === userId) return;

    // Remove previous registration if necessary.
    if (socket.data.userId) {
      const previousUserId = socket.data.userId;
      const previousSockets = onlineUsers.get(previousUserId);

      socket.leave(previousUserId);

      if (previousSockets) {
        previousSockets.delete(socket.id);

        if (previousSockets.size === 0) {
          onlineUsers.delete(previousUserId);

          io.emit("user_status", {
            userId: previousUserId,
            online: false,
          });
        }
      }
    }

    socket.data.userId = userId;
    socket.join(userId);

    const wasOffline = !onlineUsers.has(userId);

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }

    onlineUsers.get(userId).add(socket.id);

    console.log(`User ${userId} joined their socket room`);

    socket.emit("online_users", Array.from(onlineUsers.keys()));

    if (wasOffline) {
      io.emit("user_status", {
        userId,
        online: true,
      });
    }
  });

  // Typing indicators.
  socket.on("typing", (receiverId) => {
    const senderId = socket.data.userId;

    if (
      !senderId ||
      typeof receiverId !== "string" ||
      !mongoose.isValidObjectId(receiverId) ||
      senderId === receiverId
    ) {
      return;
    }

    socket.to(receiverId).emit("user_typing", {
      userId: senderId,
    });
  });

  socket.on("stop_typing", (receiverId) => {
    const senderId = socket.data.userId;

    if (
      !senderId ||
      typeof receiverId !== "string" ||
      !mongoose.isValidObjectId(receiverId) ||
      senderId === receiverId
    ) {
      return;
    }

    socket.to(receiverId).emit("user_stop_typing", {
      userId: senderId,
    });
  });

  // MESSAGE DELIVERED
  socket.on("message_delivered", async (messageId) => {
    try {
      const receiverId = socket.data.userId;

      if (
        !receiverId ||
        !mongoose.isValidObjectId(messageId)
      ) {
        return;
      }

      // Only the actual recipient can acknowledge delivery.
      const message = await Message.findOneAndUpdate(
        {
          _id: messageId,
          receiver: receiverId,
          status: "sent",
        },
        {
          $set: {
            status: "delivered",
            deliveredAt: new Date(),
          },
        },
        {
          new: true,
        }
      );

      if (!message) return;

      const update = {
        messageId: String(message._id),
        status: "delivered",
        deliveredAt: message.deliveredAt,
      };

      // Notify the sender on all their connected devices.
      io.to(String(message.sender)).emit("message_status", update);

      console.log(`Message ${messageId} delivered`);
    } catch (error) {
      console.error("Delivery acknowledgement error:", error.message);
    }
  });

  // MESSAGE READ
  socket.on("message_read", async (senderId) => {
    try {
      const receiverId = socket.data.userId;

      if (
        !receiverId ||
        typeof senderId !== "string" ||
        !mongoose.isValidObjectId(senderId) ||
        receiverId === senderId
      ) {
        return;
      }

      // Mark unread messages from this sender to this receiver as read.
      const unreadMessages = await Message.find({
        sender: senderId,
        receiver: receiverId,
        status: { $ne: "read" },
      }).select("_id");

      if (unreadMessages.length === 0) return;

      const readAt = new Date();

      await Message.updateMany(
        {
          _id: { $in: unreadMessages.map((message) => message._id) },
          receiver: receiverId,
          status: { $ne: "read" },
        },
        {
          $set: {
            status: "read",
            readAt,
          },
        }
      );

      const update = {
        messageIds: unreadMessages.map((message) =>
          String(message._id)
        ),
        status: "read",
        readAt,
      };

      // Notify the original sender.
      io.to(senderId).emit("messages_read", update);

      console.log(
        `${unreadMessages.length} messages marked as read`
      );
    } catch (error) {
      console.error("Read acknowledgement error:", error.message);
    }
  });

  // Socket disconnection.
  socket.on("disconnect", () => {
    const userId = socket.data.userId;

    console.log("Socket disconnected:", socket.id);

    if (!userId) return;

    const userSockets = onlineUsers.get(userId);

    if (!userSockets) return;

    userSockets.delete(socket.id);

    if (userSockets.size === 0) {
      onlineUsers.delete(userId);

      io.emit("user_status", {
        userId,
        online: false,
      });

      console.log(`User ${userId} is now offline`);
    }
  });
});

// Connect MongoDB and start server.
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`KNOT server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
