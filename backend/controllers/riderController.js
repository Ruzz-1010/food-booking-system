import Order from "../models/Order.js";

// 🧾 Get all assigned orders for a rider
export const getRiderOrders = async (req, res) => {
  try {
    const riderId = req.user._id;

    const orders = await Order.find({ riderId })
      .populate("customerId", "name email")
      .populate("restaurantId", "name")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching rider orders", error: error.message });
  }
};

// 🚦 Update delivery status (picked_up, delivered)
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const riderId = req.user._id;

    const validStatuses = ["picked_up", "delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid delivery status" });
    }

    const order = await Order.findOne({ _id: id, riderId });
    if (!order) return res.status(404).json({ message: "Order not found or not assigned to you" });

    order.status = status === "picked_up" ? "out_for_delivery" : "delivered";
    await order.save();

    res.json({
      message: `Order marked as ${status}`,
      order,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating delivery status", error: error.message });
  }
};
