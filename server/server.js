
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import createMessageRouter from "./routes/message.routes.js";


dotenv.config();

const app = express();

// Create the HTTP server.
const server = http.createServer(app);

// Attach Socket.IO to the HTTP server.
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

// Existing API routes.
app.use("/api/messages", createMessageRouter(io));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRouter);

app.get("/", (req, res) => {
  res.send("KNOT backend is running!");
});

// Socket.IO connection and user-room registration.
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("register_user", (userId) => {
    if (typeof userId !== "string" || !mongoose.isValidObjectId(userId)) {
      console.log("Invalid Socket.IO user registration");
      return;
    }

    socket.join(String(userId));

    console.log(`User ${userId} joined their socket room`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Connect MongoDB, then start the HTTP server.
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
