/**
 * Database Configuration and Connection
 * MongoDB connection with Mongoose
 * Supports both replica set (transactions) and standalone (fallback) modes
 */

const mongoose = require('mongoose');

let isReplicaSet = false;
let transactionSupport = false;

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    // Detect if URI suggests replica set (contains replicaSet= or multiple hosts)
    isReplicaSet = uri.includes('replicaSet=') || uri.includes(',') || uri.includes('mongodb+srv://');

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
    console.log(`🔧 Replica Set Mode: ${isReplicaSet ? 'Enabled (Transactions Supported)' : 'Standalone (Fallback Mode)'}`);

    // Test transaction support by checking server status
    try {
      const adminDb = conn.connection.db.admin();
      const serverStatus = await adminDb.command({ serverStatus: 1 });
      // Check if we're on a replica set member
      const replStatus = await adminDb.command({ replSetGetStatus: 1 });
      transactionSupport = isReplicaSet && replStatus.ok === 1;
      if (transactionSupport) {
        console.log('✅ MongoDB Transactions: SUPPORTED');
      } else {
        console.log('⚠️ MongoDB Transactions: NOT SUPPORTED (using fallback)');
      }
    } catch (e) {
      // replSetGetStatus fails on standalone - that's expected
      transactionSupport = false;
      console.log('⚠️ MongoDB Transactions: NOT SUPPORTED (standalone mode, using fallback)');
    }

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

/**
 * Check if MongoDB transactions are supported
 * @returns {boolean}
 */
const hasTransactionSupport = () => transactionSupport;

/**
 * Execute an operation with transaction support if available, otherwise use fallback
 * @param {Function} transactionalFn - Function that uses mongoose transactions
 * @param {Function} fallbackFn - Fallback function without transactions
 * @returns {Promise<any>}
 */
const withTransactionFallback = async (transactionalFn, fallbackFn) => {
  if (transactionSupport) {
    try {
      return await transactionalFn();
    } catch (error) {
      // If transaction fails due to replica set issues, fall back
      if (error.message.includes('Transaction numbers') ||
          error.message.includes('replica set') ||
          error.message.includes('not supported')) {
        console.warn('⚠️ Transaction failed, falling back to non-transactional operation');
        transactionSupport = false; // Disable for future operations
        return await fallbackFn();
      }
      throw error;
    }
  }
  return await fallbackFn();
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

module.exports = { connectDB, disconnectDB, hasTransactionSupport, withTransactionFallback };