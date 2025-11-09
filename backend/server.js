import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import dbConnect from "./config/db.js"; // CHANGED from connectDB
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import riderRoutes from "./routes/riderRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import locationRoutes from "./routes/location.js";
// import { initializeSocket } from './socket/socket.js'; 
// ❌ Socket.io not compatible sa Vercel serverless

import serverless from "serverless-http";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize DB connection when function starts
dbConnect();

// ❌ Temporarily comment out file uploads - not compatible with serverless
// app.use('/uploads', express.static('uploads'));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/riders", riderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/location", locationRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Food Booking System API is running...");
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// ✅ FIXED: Use default export for Vercel serverless
export default serverless(app);