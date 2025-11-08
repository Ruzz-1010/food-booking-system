// PALITAN MO ITO SA: backend/models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',  // ✅ CORRECT - reference to Restaurant model
    required: true
  },
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  items: [{
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'picked_up', 'on_the_way', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  specialInstructions: {
    type: String,
    default: ''
  },
  
  // 🆕 DAGDAG MO ITO - LOCATION TRACKING FIELDS
  locations: {
    customer: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    restaurant: {
      latitude: Number,
      longitude: Number,
      address: String
    }
  },
  
  locationUpdates: [{
    rider: {
      latitude: Number,
      longitude: Number,
      timestamp: { type: Date, default: Date.now }
    }
  }],
  
  estimatedDelivery: Date
  
}, {
  timestamps: true
});

const Order = mongoose.model("Order", orderSchema);
export default Order;