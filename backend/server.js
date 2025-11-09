import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import riderRoutes from "./routes/riderRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import locationRoutes from "./routes/location.js"; // NEW IMPORT
// import { initializeSocket } from './socket/socket.js'; 
// ❌ Socket.io not compatible sa Vercel serverless

import serverless from "serverless-http";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Static uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/riders", riderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/location", locationRoutes); // NEW ROUTE

// Default route
app.get("/", (req, res) => {
  res.send("Food Booking System API is running...");
});

// ❌ Remove app.listen() for serverless
// const PORT = process.env.PORT || 5000;
// const server = app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// ❌ Socket.io initialization removed for Vercel serverless

// Export serverless handler for Vercel
export const handler = serverless(app);
