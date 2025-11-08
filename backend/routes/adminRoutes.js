// routes/adminRoutes.js
import express from "express";
import {
  getDashboardStats,
  getAllUsers,
  updateRestaurantStatus,
  updateRiderStatus,
  getAllOrders,
  getPendingApprovals,
  getAllRestaurantsAdmin,
  getAllRidersAdmin,
  fixRestaurantStatus
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin routes
router.get("/dashboard", protect, adminOnly, getDashboardStats);
router.get("/users", protect, adminOnly, getAllUsers);
router.get("/restaurants", protect, adminOnly, getAllRestaurantsAdmin);
router.get("/riders", protect, adminOnly, getAllRidersAdmin);
router.get("/approvals/pending", protect, adminOnly, getPendingApprovals);
router.put("/restaurant/:id/status", protect, adminOnly, updateRestaurantStatus);
router.put("/rider/:id/status", protect, adminOnly, updateRiderStatus);
router.get("/orders", protect, adminOnly, getAllOrders);
router.post("/fix-restaurant-status", protect, adminOnly, fixRestaurantStatus);

export default router;