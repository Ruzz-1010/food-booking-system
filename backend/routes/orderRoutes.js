import express from "express";
import auth from "../middleware/auth.js";
import { 
    createOrder, 
    getOrdersByRestaurant, 
    getAvailableDeliveries,      
    getDeliveriesByRider,        
    getDeliveryHistoryByRider,  
    assignRiderToOrder,          
    updateOrderStatus,           
    getOrdersByCustomer,         
    getOrderById                 
} from "../controllers/orderController.js"; 

const router = express.Router();

// ===================================================
// 🛒 CUSTOMER ROUTES
// ===================================================

// POST /api/orders - Create a new order
router.post("/", auth, createOrder);

// GET /api/orders/customer/:customerId - Get all orders for a customer
router.get("/customer/:customerId", auth, getOrdersByCustomer);

// ===================================================
// 🏪 RESTAURANT ROUTES
// ===================================================

// GET /api/orders/restaurant/:restaurantId - Get all orders for a restaurant
router.get("/restaurant/:restaurantId", auth, getOrdersByRestaurant);

// ===================================================
// 🚴 RIDER ROUTES
// ===================================================

// GET /api/orders/available-deliveries - Orders ready for pickup and unassigned
router.get("/available-deliveries", auth, getAvailableDeliveries);

// GET /api/orders/rider/:riderId/deliveries - Active assigned deliveries (ready, picked_up)
router.get("/rider/:riderId/deliveries", auth, getDeliveriesByRider);

// GET /api/orders/rider/:riderId/history - Completed deliveries (delivered)
router.get("/rider/:riderId/history", auth, getDeliveryHistoryByRider);

// PATCH /api/orders/:orderId/assign-rider - Rider accepts the delivery
router.patch("/:orderId/assign-rider", auth, assignRiderToOrder);

// ===================================================
// 🔄 SHARED ROUTES
// ===================================================

// PATCH /api/orders/:orderId - Update order status (used by both restaurant and rider)
router.patch("/:orderId", auth, updateOrderStatus);

// GET /api/orders/:id - Get details for a single order
router.get("/:id", auth, getOrderById);

export default router;