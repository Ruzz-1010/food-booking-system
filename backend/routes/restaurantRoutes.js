import express from 'express';
import Restaurant from '../models/Restaurant.js';
import Menu from '../models/Menu.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// ✅ Get ONLY APPROVED restaurants for customers
router.get('/', async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ 
      status: 'approved', 
      isActive: true 
    })
      .select('-__v')
      .sort({ createdAt: -1 });
    
    console.log('🍽️ Fetching APPROVED restaurants for customers');
    console.log('📋 Approved restaurants found:', restaurants.length);
    
    restaurants.forEach(rest => {
      console.log(`   ✅ ${rest.name} - Status: ${rest.status}`);
    });
    
    res.json({ restaurants });
  } catch (error) {
    console.error('❌ Error fetching restaurants:', error);
    res.status(500).json({ error: 'Server error while fetching restaurants' });
  }
});

// ✅ Get ALL restaurants (for admin only)
router.get('/admin/all', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const restaurants = await Restaurant.find()
      .populate('ownerId', 'name email phone')
      .select('-__v')
      .sort({ createdAt: -1 });
    
    console.log('👑 Admin fetching ALL restaurants');
    console.log('📋 Total restaurants found:', restaurants.length);
    
    restaurants.forEach(rest => {
      console.log(`   🏪 ${rest.name} - Status: ${rest.status} - Active: ${rest.isActive}`);
    });
    
    res.json({ restaurants });
  } catch (error) {
    console.error('❌ Error fetching all restaurants:', error);
    res.status(500).json({ error: 'Server error while fetching restaurants' });
  }
});

// Get single restaurant by ID
router.get('/:id', async (req, res) => {
  try {
    console.log('🔍 Fetching restaurant with ID:', req.params.id);
    
    const restaurant = await Restaurant.findById(req.params.id)
      .select('-__v');
    
    if (!restaurant) {
      console.log('❌ Restaurant not found with ID:', req.params.id);
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    // ✅ Check if restaurant is approved before showing to customers
    if (restaurant.status !== 'approved' && !req.user?.role === 'admin') {
      return res.status(403).json({ error: 'Restaurant not available' });
    }
    
    console.log('✅ Restaurant found:', restaurant.name);
    res.json(restaurant);
  } catch (error) {
    console.error('❌ Error fetching restaurant:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }
    
    res.status(500).json({ error: 'Server error while fetching restaurant' });
  }
});

// Update restaurant profile
router.put('/:id', auth, upload.single('logo'), async (req, res) => {
  try {
    const {
      name,
      description,
      phone,
      address,
      category,
      latitude,
      longitude
    } = req.body;

    console.log('🔄 Update request for restaurant ID:', req.params.id);

    // Prepare update data
    const updateData = {};

    if (name !== undefined && name !== '' && name !== null) updateData.name = name;
    if (description !== undefined && description !== '' && description !== null) updateData.description = description;
    if (phone !== undefined && phone !== '' && phone !== null) updateData.phone = phone;
    if (address !== undefined && address !== '' && address !== null) updateData.address = address;
    if (category !== undefined && category !== '' && category !== null) updateData.category = category;

    // Handle coordinates
    if (latitude !== undefined && latitude !== null && latitude !== 'null' && latitude !== '') {
      updateData.latitude = parseFloat(latitude);
    }
    if (longitude !== undefined && longitude !== null && longitude !== 'null' && longitude !== '') {
      updateData.longitude = parseFloat(longitude);
    }

    // Handle logo upload
    if (req.file) {
      updateData.logo = `/uploads/${req.file.filename}`;
    }

    console.log('✅ Final update data:', updateData);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const existingRestaurant = await Restaurant.findById(req.params.id);
    if (!existingRestaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    console.log('✅ Restaurant updated successfully:', restaurant.name);
    res.json(restaurant);
  } catch (error) {
    console.error('❌ Error updating restaurant:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Server error while updating restaurant' });
  }
});

// Get restaurant menu
router.get('/:id/menu', async (req, res) => {
  try {
    console.log('🍽️ Fetching menu for restaurant:', req.params.id);
    
    // Check if restaurant exists and is approved
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    if (restaurant.status !== 'approved') {
      return res.status(403).json({ error: 'Restaurant not available' });
    }
    
    const menuItems = await Menu.find({ 
      restaurantId: req.params.id,
      isAvailable: true
    })
    .select('-__v')
    .sort({ createdAt: -1 });

    console.log('📋 Found menu items:', menuItems.length);
    res.json({ menu: menuItems });
  } catch (error) {
    console.error('❌ Error fetching restaurant menu:', error);
    res.status(500).json({ error: 'Server error while fetching menu' });
  }
});

// ✅ Get restaurant by owner ID
router.get('/owner/:ownerId', auth, async (req, res) => {
  try {
    console.log('🔍 Fetching restaurant by owner ID:', req.params.ownerId);
    
    const restaurant = await Restaurant.findOne({ 
      ownerId: req.params.ownerId 
    }).select('-__v');
    
    if (!restaurant) {
      console.log('❌ No restaurant found for owner:', req.params.ownerId);
      return res.status(404).json({ error: 'Restaurant not found for this owner' });
    }
    
    console.log('✅ Restaurant found for owner:', restaurant.name);
    res.json(restaurant);
  } catch (error) {
    console.error('❌ Error fetching restaurant by owner:', error);
    res.status(500).json({ error: 'Server error while fetching restaurant by owner' });
  }
});

// ✅ Create new restaurant
router.post('/', auth, upload.single('logo'), async (req, res) => {
  try {
    const {
      name,
      description,
      phone,
      address,
      category,
      latitude,
      longitude,
      ownerId
    } = req.body;

    console.log('🆕 Creating new restaurant:', name);

    // Check if restaurant already exists for this owner
    const existingRestaurant = await Restaurant.findOne({ ownerId });
    if (existingRestaurant) {
      return res.status(400).json({ error: 'Restaurant already exists for this owner' });
    }

    const restaurantData = {
      name,
      description: description || '',
      phone: phone || '',
      address: address || '',
      category: category || 'General',
      ownerId,
      status: 'pending', // ✅ Default to pending for approval
      isActive: false    // ✅ Not active until approved
    };

    if (latitude && latitude !== 'null') {
      restaurantData.latitude = parseFloat(latitude);
    }
    if (longitude && longitude !== 'null') {
      restaurantData.longitude = parseFloat(longitude);
    }

    if (req.file) {
      restaurantData.logo = `/uploads/${req.file.filename}`;
    }

    const restaurant = new Restaurant(restaurantData);
    await restaurant.save();

    console.log('✅ Restaurant created successfully (pending approval):', restaurant.name);
    res.status(201).json(restaurant);
  } catch (error) {
    console.error('❌ Error creating restaurant:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Server error while creating restaurant' });
  }
});

// ✅ FIX RESTAURANT STATUS ROUTE
router.post('/fix/status', async (req, res) => {
  try {
    // Set all existing restaurants without status to 'pending'
    const result = await Restaurant.updateMany(
      { 
        $or: [
          { status: { $exists: false } },
          { status: { $in: [null, ''] } }
        ]
      },
      { 
        $set: { 
          status: 'pending',
          isActive: false
        } 
      }
    );
    
    console.log('✅ Fixed restaurant statuses:', result.modifiedCount);
    res.json({ 
      message: `Fixed ${result.modifiedCount} restaurants`,
      fixedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error fixing restaurant status:', error);
    res.status(500).json({ error: 'Error fixing status' });
  }
});

export default router;