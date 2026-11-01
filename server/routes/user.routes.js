
import express from "express";
import multer from "multer";
import { Readable } from "stream";

import verifyToken from "../middleware/auth.middleware.js";
import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// Multer configuration: temporarily store images in memory.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith("image/")) {
      callback(null, true);
    } else {
      callback(new Error("Only image files are allowed."));
    }
  },
});

// Handle Multer errors.
function handleAvatarUpload(req, res, next) {
  upload.single("avatar")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Image must be smaller than 5 MB."
            : error.message,
      });
    }

    next();
  });
}

// Upload image buffer to Cloudinary.
function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "knot/avatars",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    Readable.from(buffer).pipe(stream);
  });
}

// GET /api/users/me
// Get current logged-in user.
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

// PATCH /api/users/me
// Update current user's name and avatar URL.
router.patch("/me", verifyToken, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      if (name.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: "Name cannot exceed 50 characters.",
        });
      }

      updates.name = name.trim();
    }

    if (avatar !== undefined) {
      if (typeof avatar !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid avatar value.",
        });
      }

      updates.avatar = avatar.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No profile information provided.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
    });
  }
});

// POST /api/users/avatar
// Upload profile picture.
router.post(
  "/avatar",
  verifyToken,
  handleAvatarUpload,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select an image.",
        });
      }

      const result = await uploadToCloudinary(req.file.buffer);

      const updatedUser = await User.findByIdAndUpdate(
        req.userId,
        {
          $set: {
            avatar: result.secure_url,
          },
        },
        {
          new: true,
        }
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Profile picture uploaded successfully.",
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
        },
      });
    } catch (error) {
      console.error("Avatar upload error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to upload profile picture.",
      });
    }
  }
);

// GET /api/users
// Get all users except current user.
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
