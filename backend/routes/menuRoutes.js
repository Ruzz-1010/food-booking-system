import express from 'express';
import Menu from '../models/Menu.js';
import Restaurant from '../models/Restaurant.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Get menu for a specific restaurant - FIXED VERSION
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    console.log('🍽️ Fetching menu for restaurant:', req.params.restaurantId);
    
    // ✅ ADD VALIDATION FOR RESTAURANT ID
    if (!req.params.restaurantId || req.params.restaurantId === 'undefined') {
      return res.status(400).json({ error: 'Invalid restaurant ID' });
    }

    // ✅ CHECK IF RESTAURANT EXISTS
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    // Get menu for a specific restaurant - ENHANCED DEBUG VERSION
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    console.log('🍽️ Fetching menu for restaurant:', req.params.restaurantId);
    
    // ✅ ADD VALIDATION FOR RESTAURANT ID
    if (!req.params.restaurantId || req.params.restaurantId === 'undefined') {
      return res.status(400).json({ error: 'Invalid restaurant ID' });
    }

    // ✅ CHECK IF RESTAURANT EXISTS
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      console.log('❌ Restaurant not found for menu:', req.params.restaurantId);
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    console.log('✅ Restaurant exists:', restaurant.name);

    // ✅ ENHANCED DEBUGGING - CHECK ALL MENU ITEMS FIRST
    const allMenuItemsInDB = await Menu.find({});
    console.log('📊 TOTAL MENU ITEMS IN ENTIRE DATABASE:', allMenuItemsInDB.length);
    
    allMenuItemsInDB.forEach(item => {
      console.log(`   📝 ${item._id} - ${item.name} - Restaurant: ${item.restaurantId} - Available: ${item.isAvailable}`);
    });

    // ✅ GET MENU ITEMS FOR SPECIFIC RESTAURANT
    const menuItems = await Menu.find({ 
      restaurantId: req.params.restaurantId
    })
    .select('-__v')
    .sort({ createdAt: -1 });

    console.log('🎯 MENU ITEMS FOR RESTAURANT', req.params.restaurantId, ':', menuItems.length);
    
    // ✅ LOG EACH MENU ITEM DETAILS
    menuItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name} - ₱${item.price} - Available: ${item.isAvailable} - Category: ${item.category}`);
    });

    // ✅ CHECK IF THERE'S A FILTERING ISSUE
    const allItemsIncludingUnavailable = await Menu.find({ 
      restaurantId: req.params.restaurantId
    });
    
    console.log('🔍 All items (including unavailable):', allItemsIncludingUnavailable.length);
    console.log('✅ Available items only:', menuItems.length);

    res.json({ 
      success: true,
      menu: menuItems,
      count: menuItems.length,
      totalInDatabase: allMenuItemsInDB.length,
      debug: {
        allItemsCount: allItemsIncludingUnavailable.length,
        availableItemsCount: menuItems.length
      },
      restaurant: {
        id: restaurant._id,
        name: restaurant.name
      }
    });
  } catch (error) {
    console.error('❌ Error fetching menu:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }
    
    res.status(500).json({ error: 'Server error while fetching menu' });
  }
});
    if (!restaurant) {
      console.log('❌ Restaurant not found for menu:', req.params.restaurantId);
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    console.log('✅ Restaurant exists:', restaurant.name);

    // ✅ GET MENU ITEMS WITH COMPLETE DEBUGGING
    const menuItems = await Menu.find({ 
      restaurantId: req.params.restaurantId
    })
    .select('-__v')
    .sort({ createdAt: -1 });

    console.log('📋 Raw database query result:', menuItems);
    console.log('📋 Found menu items:', menuItems.length);

    // ✅ LOG EACH MENU ITEM DETAILS
    menuItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name} - ₱${item.price} - Available: ${item.isAvailable} - Category: ${item.category}`);
    });

    res.json({ 
      success: true,
      menu: menuItems,
      count: menuItems.length,
      restaurant: {
        id: restaurant._id,
        name: restaurant.name
      }
    });
  } catch (error) {
    console.error('❌ Error fetching menu:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }
    
    res.status(500).json({ error: 'Server error while fetching menu' });
  }
});

// Add new menu item - FIXED VERSION
router.post('/restaurant/:restaurantId', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    
    console.log('🆕 Adding menu item for restaurant:', req.params.restaurantId);
    console.log('📦 Menu item data:', { name, description, price, category });

    // ✅ VALIDATE REQUIRED FIELDS
    if (!name || !description || !price || !category) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const menuItem = new Menu({
      name,
      description,
      price: parseFloat(price),
      category,
      restaurantId: req.params.restaurantId,
      image: req.file ? `/uploads/${req.file.filename}` : '',
      isAvailable: true
    });

    await menuItem.save();
    
    const savedItem = await Menu.findById(menuItem._id).select('-__v');
    
    console.log('✅ Menu item added successfully:', savedItem.name);
    res.status(201).json({
      success: true,
      message: 'Menu item added successfully',
      menu: savedItem
    });
  } catch (error) {
    console.error('❌ Error adding menu item:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Server error while adding menu item' });
  }
});

// Update menu item - FIXED VERSION
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category, isAvailable } = req.body;
    
    console.log('✏️ Updating menu item:', req.params.id);
    console.log('📦 Update data:', { name, description, price, category, isAvailable });

    const updateData = {
      name,
      description,
      price: parseFloat(price),
      category,
      isAvailable: isAvailable !== undefined ? isAvailable : true
    };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updatedItem = await Menu.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updatedItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    console.log('✅ Menu item updated successfully:', updatedItem.name);
    res.json({
      success: true,
      message: 'Menu item updated successfully',
      menu: updatedItem
    });
  } catch (error) {
    console.error('❌ Error updating menu item:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Server error while updating menu item' });
  }
});

// Delete menu item - FIXED VERSION
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('🗑️ Deleting menu item:', req.params.id);
    
    const deletedItem = await Menu.findByIdAndDelete(req.params.id);
    
    if (!deletedItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    console.log('✅ Menu item deleted successfully:', deletedItem.name);
    res.json({ 
      success: true,
      message: 'Menu item deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Error deleting menu item:', error);
    res.status(500).json({ error: 'Server error while deleting menu item' });
  }
});

// Toggle menu item availability - FIXED VERSION
router.patch('/:id/availability', auth, async (req, res) => {
  try {
    console.log('🔄 Toggling availability for menu item:', req.params.id);
    
    const menuItem = await Menu.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();

    console.log('✅ Availability toggled:', menuItem.name, '->', menuItem.isAvailable);
    res.json({
      success: true,
      message: `Menu item ${menuItem.isAvailable ? 'enabled' : 'disabled'} successfully`,
      menu: menuItem
    });
  } catch (error) {
    console.error('❌ Error toggling menu availability:', error);
    res.status(500).json({ error: 'Server error while updating availability' });
  }
});

// ✅ DEBUG ROUTES FOR TROUBLESHOOTING

// Get all menu items in database
router.get('/debug/all-menus', async (req, res) => {
  try {
    const allMenus = await Menu.find({})
      .select('restaurantId name price isAvailable category')
      .sort({ createdAt: -1 });
    
    console.log('📋 ALL MENU ITEMS IN DATABASE:', allMenus);
    
    // Group by restaurant ID
    const menusByRestaurant = {};
    allMenus.forEach(menu => {
      const restId = menu.restaurantId.toString();
      if (!menusByRestaurant[restId]) {
        menusByRestaurant[restId] = [];
      }
      menusByRestaurant[restId].push({
        id: menu._id,
        name: menu.name,
        price: menu.price,
        category: menu.category,
        isAvailable: menu.isAvailable
      });
    });
    
    res.json({ 
      success: true,
      total: allMenus.length,
      menusByRestaurant: menusByRestaurant,
      allMenus: allMenus 
    });
  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug menu for specific restaurant
router.get('/debug/restaurant/:restaurantId', async (req, res) => {
  try {
    console.log('🍽️ DEBUG Fetching menu for restaurant:', req.params.restaurantId);
    
    const menuItems = await Menu.find({ 
      restaurantId: req.params.restaurantId
    })
    .select('-__v')
    .sort({ createdAt: -1 });

    console.log('📋 DEBUG Menu items found:', menuItems);
    
    res.json({ 
      success: true,
      restaurantId: req.params.restaurantId,
      menuCount: menuItems.length,
      menuItems: menuItems 
    });
  } catch (error) {
    console.error('❌ DEBUG Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if restaurant exists
router.get('/debug/check-restaurant/:restaurantId', async (req, res) => {
  try {
    console.log('🔍 Checking restaurant:', req.params.restaurantId);
    
    const restaurant = await Restaurant.findById(req.params.restaurantId)
      .select('name status isActive');
    
    if (!restaurant) {
      return res.json({ 
        exists: false,
        message: 'Restaurant not found' 
      });
    }
    
    res.json({
      exists: true,
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        status: restaurant.status,
        isActive: restaurant.isActive
      }
    });
  } catch (error) {
    console.error('❌ Check restaurant error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;