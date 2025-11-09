import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Use MONGODB_URI (not MONGO_URI) and remove deprecated options
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error.message);
    // Don't exit process in serverless - remove process.exit(1)
  }
};

// For serverless compatibility
let isConnected = false;

export default async function dbConnect() {
  if (isConnected) {
    return;
  }
  
  try {
    await connectDB();
    isConnected = true;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}