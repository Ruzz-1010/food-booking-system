import express from "express";
import { getRiderOrders, updateDeliveryStatus } from "../controllers/riderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================================
   🛵 RIDER ROUTES
===================================================== */

// 🧾 View assigned orders
router.get("/orders", protect, getRiderOrders);

// 🚦 Update delivery status (picked_up / delivered)
router.put("/orders/:id/status", protect, updateDeliveryStatus);

export default router;
