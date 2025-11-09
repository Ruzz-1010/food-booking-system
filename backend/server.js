// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import dbConnect from "./config/db.js"; // Database connection
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import riderRoutes from "./routes/riderRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import locationRoutes from "./routes/location.js";
import serverless from "serverless-http";

dotenv.config();

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
dbConnect();

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
  res.send("🍽️ Food Booking System API is running...");
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// ✅ Local development mode (Normal Express server)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally on http://localhost:${PORT}`);
  });
}

// ✅ Export for Vercel serverless deployment
export default serverless(app);
