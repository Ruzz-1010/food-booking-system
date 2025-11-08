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
import locationRoutes from "./routes/location.js"; // 🆕 ADD THIS IMPORT
import { initializeSocket } from './socket/socket.js';

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// 🆕 ADD THIS - Make sure uploads directory exists
app.use('/uploads', express.static('uploads'));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/riders", riderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/location", locationRoutes); // 🆕 NOW THIS WILL WORK

// Default route
app.get("/", (req, res) => {
  res.send("Food Booking System API is running...");
});

const PORT = process.env.PORT || 5000;

// 🆕 FIXED - Create server first, then initialize socket
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 🆕 FIXED - Initialize socket after server is created
const io = initializeSocket(server);

// 🆕 FIXED - Make io accessible to routes (must be after socket initialization)
app.use((req, res, next) => {
  req.io = io;
  next();
});