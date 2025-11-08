// controllers/authController.js
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Register User - UPDATED WITH ALL FIELDS
export const registerUser = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      phone, 
      address, 
      latitude, 
      longitude,
      vehicleType, 
      licenseNumber, 
      restaurantData 
    } = req.body;

    console.log("Registration data received:", { name, email, phone, address, latitude, longitude });

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      phone: phone || "",
      address: address || "",
      latitude: latitude || null,
      longitude: longitude || null,
      status: role === "customer" ? "active" : "pending"
    };

    if (role === "rider") {
      userData.vehicleType = vehicleType || "motorcycle";
      userData.licenseNumber = licenseNumber || "";
    }

    const user = await User.create(userData);

    if (role === "restaurant" && restaurantData) {
      const restaurant = await Restaurant.create({
        ownerId: user._id,
        name: restaurantData.name,
        address: restaurantData.address,
        description: restaurantData.description,
        category: restaurantData.category,
        status: "pending"
      });
      
      user.restaurantId = restaurant._id;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1d" }
    );

    let message = "User registered successfully";
    if (role === "customer") {
      message = "🎉 Account created successfully! You can now login.";
    } else if (role === "restaurant") {
      message = "⏳ Restaurant account created! Waiting for admin approval.";
    } else if (role === "rider") {
      message = "⏳ Rider account created! Waiting for admin approval.";
    }

    // RETURN COMPLETE USER DATA
    res.status(201).json({
      message,
      token,
      role: user.role,
      status: user.status,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        phone: user.phone,
        address: user.address,
        latitude: user.latitude,
        longitude: user.longitude,
        role: user.role,
        status: user.status
      },
    });

    console.log("User registered successfully:", { 
      id: user._id, 
      name: user.name, 
      phone: user.phone,
      address: user.address 
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Login User - UPDATED WITH ALL FIELDS
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt for:", email);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ 
        message: "Account deactivated. Please contact administrator." 
      });
    }

    // Status checks for restaurant and rider
    if (user.role === "restaurant") {
      if (user.status !== "approved") {
        return res.status(400).json({ 
          message: "⏳ Your restaurant account is pending admin approval." 
        });
      }

      const restaurant = await Restaurant.findOne({ ownerId: user._id });
      if (!restaurant) {
        return res.status(400).json({ 
          message: "❌ Restaurant not found. Please contact administrator." 
        });
      }

      if (restaurant.status !== "approved") {
        return res.status(400).json({ 
          message: "⏳ Your restaurant is pending admin approval." 
        });
      }
    }

    if (user.role === "rider" && user.status !== "approved") {
      return res.status(400).json({ 
        message: "⏳ Your rider account is pending admin approval." 
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1d" }
    );

    // RETURN COMPLETE USER DATA
    const userResponse = {
      id: user._id, 
      name: user.name, 
      email: user.email,
      phone: user.phone,
      address: user.address,
      latitude: user.latitude,
      longitude: user.longitude,
      role: user.role,
      status: user.status
    };

    console.log("Login successful, returning user data:", userResponse);

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      status: user.status,
      user: userResponse
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};