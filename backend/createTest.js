// createTest.js - ilagay sa backend folder
import mongoose from 'mongoose';
import Restaurant from './models/Restaurant.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createTestData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');

    // Hanap ng restaurant user
    const restaurantUser = await User.findOne({ role: 'restaurant' });
    
    if (!restaurantUser) {
      console.log('❌ Walang restaurant user. Mag-register muna ng restaurant user.');
      return;
    }

    console.log('👤 Found restaurant user:', restaurantUser.email);

    // Gumawa ng test restaurant
    const restaurant = await Restaurant.create({
      ownerId: restaurantUser._id,
      name: 'Test Restaurant',
      address: '123 Test Street, Manila',
      description: 'Ito ay test restaurant para ma-approve',
      category: 'Filipino Food',
      status: 'pending'
    });

    console.log('✅ Test restaurant created!');
    console.log('📝 Restaurant ID:', restaurant._id);
    console.log('🏪 Restaurant Name:', restaurant.name);
    console.log('📊 Status:', restaurant.status);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createTestData();