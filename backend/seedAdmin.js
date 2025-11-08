// seedAdmin.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/foodbooking');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@foodexpress.com' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@foodexpress.com',
      password: hashedPassword,
      role: 'admin',
      status: 'approved'
    });

    console.log('✅ Admin user created successfully:');
    console.log(`📧 Email: admin@foodexpress.com`);
    console.log(`🔑 Password: admin123`);
    console.log(`👤 Role: admin`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();