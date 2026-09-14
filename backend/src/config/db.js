const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    
    // Automatically use an in-memory database if no URI is provided so the demo runs seamlessly
    if (!uri) {
      console.log("No MONGO_URI provided. Starting in-memory MongoDB...");
      const mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    }
    
    await mongoose.connect(uri);
    console.log("MongoDB Connected at: " + uri);
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;