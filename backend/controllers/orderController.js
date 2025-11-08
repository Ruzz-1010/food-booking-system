import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js"; // ✅ ADDED: Import Restaurant model

/* =====================================================
   🧠 ORDER CONTROLLER - Complete Logic
===================================================== */

// --- Shared Helper for Population ---
const populateOrderFields = (query) => {
    return query
        .populate("customerId", "name email phone")
        .populate("restaurantId", "name address phone")
        .populate("riderId", "name phone vehicleType");
};

// 🛒 CUSTOMER: Create a new order
export const createOrder = async (req, res) => {
  try {
    const { restaurantId, items, totalAmount, deliveryAddress, specialInstructions } = req.body;

    if (!restaurantId || !items || items.length === 0 || !totalAmount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const order = new Order({
      customerId: req.user.id,
      restaurantId,
      items,
      totalAmount,
      deliveryAddress: deliveryAddress || 'Not specified',
      customerPhone: req.user.phone || 'Not specified',
      specialInstructions: specialInstructions || '',
      status: "pending"
    });

    await order.save();
    
    const populatedOrder = await populateOrderFields(Order.findById(order._id));

    res.status(201).json({ 
      message: 'Order placed successfully', 
      order: populatedOrder
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// 🧾 RESTAURANT: Get all orders for a specific restaurant
export const getOrdersByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const userId = req.user.id;
    
    // ✅ FIXED: Check if this restaurant belongs to the user
    const userRestaurant = await Restaurant.findOne({ 
      _id: restaurantId, 
      ownerId: userId 
    });
    
    if (!userRestaurant) {
      return res.status(403).json({ 
        message: "Forbidden: You don't have access to this restaurant's orders" 
      });
    }
    
    const orders = await populateOrderFields(
        Order.find({ restaurantId })
    ).sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    console.error('❌ Error fetching restaurant orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// 📦 RIDER: Get available orders (Status: 'ready', Rider: null)
export const getAvailableDeliveries = async (req, res) => {
    try {
        if (req.user.role !== 'rider') {
            return res.status(403).json({ message: "Forbidden: Only riders can view available deliveries." });
        }

        const orders = await populateOrderFields(
            Order.find({ 
                status: 'ready',    // Must be ready for pickup
                riderId: null       // Must be unassigned
            })
        ).sort({ createdAt: 1 });

        res.json({ orders });
    } catch (error) {
        console.error('❌ Error fetching available deliveries:', error);
        res.status(500).json({ error: 'Failed to fetch available deliveries' });
    }
};

// 🚚 RIDER: Get rider's current active deliveries
export const getDeliveriesByRider = async (req, res) => {
    try {
        const { riderId } = req.params;
        
        if (req.user.id.toString() !== riderId.toString() || req.user.role !== 'rider') {
            return res.status(403).json({ message: "Forbidden: You can only view your own assigned deliveries." });
        }

        const deliveries = await populateOrderFields(
            Order.find({ 
                riderId: riderId,
                // Orders actively assigned and in progress
                status: { $in: ['ready', 'picked_up', 'out_for_delivery'] } 
            })
        ).sort({ createdAt: -1 });

        res.json({ deliveries });
    } catch (error) {
        console.error('❌ Error fetching rider deliveries:', error);
        res.status(500).json({ error: 'Failed to fetch rider deliveries' });
    }
};

// 📜 RIDER: Get delivery history (Completed deliveries)
export const getDeliveryHistoryByRider = async (req, res) => {
    try {
        const { riderId } = req.params;
        
        if (req.user.id.toString() !== riderId.toString() || req.user.role !== 'rider') {
            return res.status(403).json({ message: "Forbidden: You can only view your own history." });
        }

        const history = await populateOrderFields(
            Order.find({ 
                riderId: riderId,
                status: 'delivered' // Only fetch delivered orders
            })
        ).sort({ deliveredAt: -1, createdAt: -1 });

        res.json({ history });
    } catch (error) {
        console.error('❌ Error fetching rider delivery history:', error);
        res.status(500).json({ error: 'Failed to fetch delivery history' });
    }
};

// 🤝 RIDER: Accept delivery (Assignment)
export const assignRiderToOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { riderId } = req.body; 
        
        // Security Check 1: Ensure the requested riderId matches the authenticated user
        if (req.user.id.toString() !== riderId.toString() || req.user.role !== 'rider') {
            return res.status(403).json({ message: "Forbidden: Cannot assign delivery to a different user." });
        }

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });
        
        // Security Check 2: Order must be 'ready' and unassigned
        if (order.status !== 'ready' || order.riderId !== null) {
            return res.status(400).json({ message: "Order is not available for assignment (Status must be 'ready' and riderId must be null)." });
        }
        
        // Final Update: Assign the rider
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { 
              riderId: riderId,
            },
            { new: true }
        );
        
        const finalOrder = await populateOrderFields(Order.findById(orderId));

        res.json({ 
            message: `Delivery accepted. Rider ${riderId} assigned to order ${orderId}.`,
            order: finalOrder 
        });
    } catch (error) {
        console.error('❌ Error assigning rider to order:', error);
        res.status(500).json({ error: 'Failed to assign delivery' });
    }
};

// 🚦 SHARED: Update order status (Restaurant/Rider logic)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params; 
    const { status } = req.body;
    
    const validStatuses = [
      "pending", "accepted", "preparing", "ready", "rejected", // Restaurant
      "picked_up", "out_for_delivery", "delivered" // Rider
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }
    
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Authorization based on role
    const userRole = req.user.role;
    const userId = req.user.id; 

    if (userRole === 'restaurant') {
        // Only allowed to set status to: accepted, preparing, ready, rejected
        if (!['accepted', 'preparing', 'ready', 'rejected'].includes(status)) {
            return res.status(403).json({ message: `Restaurants cannot set status to '${status}'.` });
        }
        
        // ✅ FIXED: Get the restaurant owned by this user
        const userRestaurant = await Restaurant.findOne({ ownerId: userId });
        
        if (!userRestaurant) {
            return res.status(404).json({ message: "Restaurant not found for this user" });
        }
        
        // ✅ FIXED: Compare with the actual restaurant ID
        if (order.restaurantId.toString() !== userRestaurant._id.toString()) {
            return res.status(403).json({ message: "Forbidden: Order does not belong to this restaurant." });
        }
    } else if (userRole === 'rider') {
        // Only allowed to set status to: picked_up, out_for_delivery, delivered
        if (!['picked_up', 'out_for_delivery', 'delivered'].includes(status)) {
            return res.status(403).json({ message: `Riders cannot set status to '${status}'.` });
        }
        // Must be assigned to the order to update its status
        if (order.riderId === null || order.riderId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Forbidden: You are not assigned to this delivery." });
        }
    } else {
         return res.status(403).json({ message: "Forbidden: User role not authorized to update order status." });
    }

    // Final Update
    order.status = status;
    if (status === 'delivered') {
         order.deliveredAt = new Date();
    }
    await order.save();
    
    const updatedOrder = await populateOrderFields(Order.findById(orderId));

    res.json({
      message: `Order status updated to '${status}'`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    res.status(500).json({ message: "Error updating order status", error: error.message });
  }
};

// 👀 Get details of a single order
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await populateOrderFields(Order.findById(id));

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Error fetching order details", error: error.message });
    }
};

// 👤 Customer gets all their orders (tracking)
export const getOrdersByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;
    
        if (req.user.id.toString() !== customerId.toString() || req.user.role !== 'customer') {
            return res.status(403).json({ error: 'Forbidden: You can only view your own orders.' });
        }

        const orders = await populateOrderFields(
            Order.find({ customerId })
        ).sort({ createdAt: -1 });
    
        res.json({ orders });
    } catch (error) {
        console.error('❌ Error fetching customer orders:', error);
        res.status(500).json({ error: 'Failed to fetch customer orders' });
    }
};