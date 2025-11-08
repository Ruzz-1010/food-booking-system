import Restaurant from "../models/Restaurant.js";

// 🍴 Register a new restaurant (linked to restaurant user)
export const registerRestaurant = async (req, res) => {
  try {
    const { name, address, description, category, image } = req.body;
    const ownerId = req.user._id; // Get from JWT token

    console.log("🔄 Registering restaurant for owner:", ownerId);

    // Check if user already has a restaurant
    const existingRestaurant = await Restaurant.findOne({ ownerId });
    if (existingRestaurant) {
      return res.status(400).json({ 
        message: "You already have a registered restaurant" 
      });
    }

    // Create the restaurant
    const restaurant = await Restaurant.create({
      ownerId,
      name,
      address,
      description,
      category,
      image: image || "",
      status: "pending" // Needs admin approval
    });

    console.log("✅ Restaurant created:", restaurant);

    res.status(201).json({
      message: "Restaurant registered successfully! Waiting for admin approval.",
      restaurant,
    });
  } catch (error) {
    console.error("❌ Error registering restaurant:", error);
    res.status(500).json({ 
      message: "Error registering restaurant", 
      error: error.message 
    });
  }
};

// 📋 Get all restaurants (for customers)
export const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ status: "approved" });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 👀 Get restaurants by owner
export const getRestaurantsByOwner = async (req, res) => {
  try {
    const ownerId = req.user._id; // From JWT
    const restaurants = await Restaurant.find({ ownerId });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔍 Get restaurant by ID
export const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};