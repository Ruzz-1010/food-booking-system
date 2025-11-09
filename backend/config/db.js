import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Use the correct environment variable name and remove deprecated options
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error.message);
    // Don't exit process in serverless environment
  }
};

// Serverless connection handler
let isConnected = false;

const dbConnect = async () => {
  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return;
  }
  
  try {
    await connectDB();
    isConnected = true;
    console.log('MongoDB connection established successfully');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    isConnected = false;
  }
};

// MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
  isConnected = false;
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

export default dbConnect;