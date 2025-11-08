// controllers/adminController.js
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import Order from "../models/Order.js";

// 📊 Dashboard Overview
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRestaurants = await Restaurant.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRiders = await User.countDocuments({ role: "rider" });
    const pendingRestaurants = await Restaurant.countDocuments({ status: "pending" });
    const pendingRiders = await User.countDocuments({ role: "rider", status: "pending" });
    const approvedRestaurants = await Restaurant.countDocuments({ status: "approved" });
    const approvedRiders = await User.countDocuments({ role: "rider", status: "approved" });

    // Calculate total revenue from delivered orders
    const deliveredOrders = await Order.find({ status: "delivered" });
    const totalRevenue = deliveredOrders.reduce((total, order) => total + (order.totalAmount || 0), 0);

    res.json({
      totalUsers,
      totalRestaurants,
      totalOrders,
      totalRiders,
      pendingRestaurants,
      pendingRiders,
      approvedRestaurants,
      approvedRiders,
      totalRevenue,
      completedOrders: deliveredOrders.length
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: error.message });
  }
};

// 👥 View All Users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
};

// 🍔 Approve or Reject Restaurant
export const updateRestaurantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('🔄 Updating restaurant status:', { id, status });

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use 'approved' or 'rejected'" });
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    restaurant.status = status;
    restaurant.isActive = status === "approved";
    await restaurant.save();

    // Also update the restaurant owner's status if exists
    if (restaurant.ownerId) {
      const restaurantOwner = await User.findById(restaurant.ownerId);
      if (restaurantOwner) {
        restaurantOwner.status = status;
        await restaurantOwner.save();
        console.log(`✅ Updated owner status: ${restaurantOwner.name} -> ${status}`);
      }
    }

    console.log(`✅ Restaurant ${status}: ${restaurant.name}`);
    
    res.json({
      message: `Restaurant ${status} successfully`,
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        status: restaurant.status
      },
    });
  } catch (error) {
    console.error('❌ Error updating restaurant status:', error);
    res.status(500).json({ message: error.message });
  }
};

// 🏍️ Approve or Reject Rider
export const updateRiderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('🔄 Updating rider status:', { id, status });

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use 'approved' or 'rejected'" });
    }

    const rider = await User.findById(id);
    if (!rider || rider.role !== "rider") {
      return res.status(404).json({ message: "Rider not found" });
    }

    rider.status = status;
    await rider.save();

    console.log(`✅ Rider ${status}: ${rider.name}`);
    
    res.json({
      message: `Rider ${status} successfully`,
      rider: {
        id: rider._id,
        name: rider.name,
        status: rider.status
      },
    });
  } catch (error) {
    console.error('❌ Error updating rider status:', error);
    res.status(500).json({ message: error.message });
  }
};

// 📦 View All Orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("restaurantId", "name")
      .populate("customerId", "name email")
      .populate("riderId", "name")
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: error.message });
  }
};

// 🔍 Get Pending Approvals
export const getPendingApprovals = async (req, res) => {
  try {
    const pendingRestaurants = await Restaurant.find({ status: "pending" })
      .populate("ownerId", "name email phone");
    const pendingRiders = await User.find({ role: "rider", status: "pending" });

    res.json({
      pendingRestaurants,
      pendingRiders,
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ message: error.message });
  }
};

// 🆕 Get All Restaurants (for admin view)
export const getAllRestaurantsAdmin = async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .populate("ownerId", "name email phone")
      .sort({ createdAt: -1 });
    
    res.json({ restaurants });
  } catch (error) {
    console.error('Error fetching restaurants for admin:', error);
    res.status(500).json({ message: error.message });
  }
};

// 🆕 Get All Riders (for admin view)
export const getAllRidersAdmin = async (req, res) => {
  try {
    const riders = await User.find({ role: "rider" })
      .select("-password")
      .sort({ createdAt: -1 });
    
    res.json({ riders });
  } catch (error) {
    console.error('Error fetching riders for admin:', error);
    res.status(500).json({ message: error.message });
  }
};

// 🛠️ FIX EXISTING RESTAURANT STATUS
export const fixRestaurantStatus = async (req, res) => {
  try {
    // Update all restaurant users to approved status
    const userResult = await User.updateMany(
      { role: "restaurant_owner" },
      { $set: { status: "approved" } }
    );

    // Update all restaurants to approved status
    const restaurantResult = await Restaurant.updateMany(
      { status: { $ne: "pending" } },
      { $set: { status: "approved", isActive: true } }
    );

    console.log(`✅ Fixed ${userResult.modifiedCount} users and ${restaurantResult.modifiedCount} restaurants`);

    res.json({
      message: "Restaurant status fixed successfully",
      usersUpdated: userResult.modifiedCount,
      restaurantsUpdated: restaurantResult.modifiedCount
    });
  } catch (error) {
    console.error('Error fixing restaurant status:', error);
    res.status(500).json({ message: error.message });
  }
};