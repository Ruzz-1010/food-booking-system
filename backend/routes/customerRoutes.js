import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

/* =====================================================
   👤 CUSTOMER ROUTES with Location Support
===================================================== */

// 🧾 Get current customer profile
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
});

// 🔄 Update customer profile with location support
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, phone, address, latitude, longitude } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (latitude !== undefined) user.latitude = latitude;
    if (longitude !== undefined) user.longitude = longitude;

    const updatedUser = await user.save();
    
    // Return user without password
    const userResponse = await User.findById(updatedUser._id).select("-password");
    
    res.json({
      message: "Profile updated successfully",
      user: userResponse
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
});

// 🆕 UPDATE CUSTOMER BY ID (for frontend use)
router.put("/:id", protect, async (req, res) => {
  try {
    const { name, phone, address, latitude, longitude } = req.body;
    const userId = req.params.id;

    // Verify user is updating their own profile or admin
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to update this profile" });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
});

// 🆕 GET CUSTOMER BY ID
router.get("/:id", protect, async (req, res) => {
  try {
    const userId = req.params.id;

    // Verify user is accessing their own profile or admin
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to access this profile" });
    }

    const user = await User.findById(userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
});

// 🆕 GET ALL CUSTOMERS (Admin only)
router.get("/", protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to access customer data" });
    }

    const customers = await User.find({ role: 'customer' }).select("-password");
    res.json({
      message: "Customers retrieved successfully",
      customers: customers,
      count: customers.length
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Error fetching customers", error: error.message });
  }
});

export default router;