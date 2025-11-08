// controllers/locationController.js
import Order from "../models/Order.js";
import User from "../models/User.js";

// Update rider's current location
export const updateRiderLocation = async (req, res) => {
  try {
    const { orderId, latitude, longitude } = req.body;
    const riderId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify rider is assigned to this order
    if (order.riderId.toString() !== riderId.toString()) {
      return res.status(403).json({ message: "Not authorized to update location for this order" });
    }

    // Add location update to order
    order.locationUpdates.push({
      rider: {
        latitude,
        longitude,
        timestamp: new Date()
      }
    });

    await order.save();

    // Emit real-time location update via Socket.io
    req.io.to(`order_${orderId}`).emit('riderLocationUpdate', {
      orderId,
      riderLocation: { latitude, longitude },
      timestamp: new Date()
    });

    res.json({ 
      message: "Location updated successfully",
      location: { latitude, longitude }
    });
  } catch (error) {
    console.error("Error updating rider location:", error);
    res.status(500).json({ message: "Error updating location" });
  }
};

// Get order locations (customer, restaurant, rider)
export const getOrderLocations = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(orderId)
      .populate('customerId', 'name latitude longitude address')
      .populate('restaurantId', 'name latitude longitude address')
      .populate('riderId', 'name latitude longitude vehicleType');

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify user has access to this order
    const userRole = req.user.role;
    const hasAccess = 
      userRole === 'admin' ||
      order.customerId._id.toString() === userId.toString() ||
      order.restaurantId._id.toString() === userId.toString() ||
      (order.riderId && order.riderId._id.toString() === userId.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    const locations = {
      customer: {
        name: order.customerId.name,
        latitude: order.customerId.latitude,
        longitude: order.customerId.longitude,
        address: order.customerId.address
      },
      restaurant: {
        name: order.restaurantId.name,
        latitude: order.restaurantId.latitude,
        longitude: order.restaurantId.longitude,
        address: order.restaurantId.address
      },
      rider: order.riderId ? {
        name: order.riderId.name,
        latitude: order.riderId.latitude,
        longitude: order.riderId.longitude,
        vehicleType: order.riderId.vehicleType,
        currentLocation: order.locationUpdates.length > 0 
          ? order.locationUpdates[order.locationUpdates.length - 1].rider
          : null
      } : null
    };

    res.json({ locations });
  } catch (error) {
    console.error("Error fetching order locations:", error);
    res.status(500).json({ message: "Error fetching locations" });
  }
};