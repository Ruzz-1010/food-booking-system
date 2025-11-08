import Menu from "../models/Menu.js";

// ➕ Add new menu item
export const addMenuItem = async (req, res) => {
  try {
    const { restaurantId, name, description, price, image, category } = req.body;

    const newMenu = await Menu.create({
      restaurantId,
      name,
      description,
      price,
      image,
      category,
      isAvailable: true // ✅ ADDED: Set default availability
    });

    res.status(201).json({
      message: "Menu item added successfully",
      menu: newMenu,
    });
  } catch (error) {
    res.status(500).json({ message: "Error adding menu item", error: error.message });
  }
};

// 📋 Get menu items by restaurant
export const getMenuByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const menu = await Menu.find({ 
      restaurantId, 
      isAvailable: true // ✅ FIXED: isAvailable
    });
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: "Error fetching menu", error: error.message });
  }
};

// ✏️ Update menu item
export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Menu.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Menu item not found" });
    res.json({ message: "Menu item updated", updated });
  } catch (error) {
    res.status(500).json({ message: "Error updating menu", error: error.message });
  }
};

// ❌ Delete menu item
export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Menu.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Menu item not found" });
    res.json({ message: "Menu item deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting menu", error: error.message });
  }
};

// 🔄 Toggle menu item availability
export const toggleMenuAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const menuItem = await Menu.findById(id);
    
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();

    res.json({
      message: `Menu item ${menuItem.isAvailable ? 'enabled' : 'disabled'} successfully`,
      menuItem
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating menu availability", error: error.message });
  }
};