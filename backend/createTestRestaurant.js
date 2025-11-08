// Run this in your backend temporarily to create a test restaurant
// Create a file called createTestRestaurant.js and run: node createTestRestaurant.js

import mongoose from 'mongoose';
import Restaurant from './models/Restaurant.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createTestRestaurant = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find a restaurant user
    const restaurantUser = await User.findOne({ role: 'restaurant' });
    
    if (!restaurantUser) {
      console.log('❌ No restaurant users found');
      return;
    }

    console.log('👤 Found restaurant user:', restaurantUser.email);

    // Create a restaurant for this user
    const restaurant = await Restaurant.create({
      ownerId: restaurantUser._id,
      name: 'Test Restaurant',
      address: '123 Test Street, Test City',
      description: 'A test restaurant for approval',
      category: 'Fast Food',
      status: 'pending'
    });

    console.log('✅ Test restaurant created:', restaurant);
    console.log('📝 Restaurant ID:', restaurant._id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createTestRestaurant();