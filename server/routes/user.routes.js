
import express from "express";
import verifyToken from "../middleware/auth.middleware.js";
import User from "../models/user.model.js";

const router = express.Router();

// GET /api/users/me
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User authenticated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user details.",
    });
  }
});

// GET /api/users
router.get("/", verifyToken, async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.userId },
    }).select("name email avatar");

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve users.",
    });
  }
});

export default router;
