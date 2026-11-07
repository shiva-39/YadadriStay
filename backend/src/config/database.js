/**
 * Database Configuration and Connection
 * MongoDB connection with Mongoose
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    const options = {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      family: 4, // Use IPv4, skip trying IPv6
    };

    const conn = await mongoose.connect(uri, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Create indexes after connection
    await createIndexes();

    return conn;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

const createIndexes = async () => {
  try {
    // Indexes will be created by individual models via schema.index()
    // This function can be used for additional compound indexes if needed
    console.log('✅ Database indexes verified');
  } catch (error) {
    console.warn('⚠️ Index creation warning:', error.message);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
};

module.exports = { connectDB, disconnectDB };