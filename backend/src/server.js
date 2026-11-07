/**
 * Yadadri Stay - Backend Server Entry Point
 * Main application bootstrap and configuration
 */

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Import configurations and utilities
const { connectDB } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { setupSocketHandlers } = require('./utils/socket');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const lodgeRoutes = require('./routes/lodges');
const roomRoutes = require('./routes/rooms');
const inventoryRoutes = require('./routes/inventory');
const bookingRoutes = require('./routes/bookings');
const offlineBookingRoutes = require('./routes/offlineBookings');
const paymentRoutes = require('./routes/payments');
const settlementRoutes = require('./routes/settlements');
const reviewRoutes = require('./routes/reviews');
const transportRoutes = require('./routes/transport');
const complaintRoutes = require('./routes/complaints');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const reportRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const activityLogRoutes = require('./routes/activityLogs');
const uploadRoutes = require('./routes/upload');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.ADMIN_DASHBOARD_URL,
      process.env.OWNER_DASHBOARD_URL,
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in routes
app.set('io', io);
setupSocketHandlers(io);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disable for development, configure for production
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.ADMIN_DASHBOARD_URL,
      process.env.OWNER_DASHBOARD_URL,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Yadadri Stay API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lodges', lodgeRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/offline-bookings', offlineBookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Connect to database and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    YADADRI STAY BACKEND                       ║
╠══════════════════════════════════════════════════════════════╣
║  Server running on port ${PORT}                                 ║
║  Environment: ${process.env.NODE_ENV || 'development'}                            ║
║  API Base URL: ${process.env.API_BASE_URL || `http://localhost:${PORT}/api`}        ║
║  Health Check: http://localhost:${PORT}/health                        ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  httpServer.close(async () => {
    await mongoose.connection.close();
    console.log('Server closed. Database connection closed.');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  httpServer.close(async () => {
    await mongoose.connection.close();
    console.log('Server closed. Database connection closed.');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  httpServer.close(async () => {
    await mongoose.connection.close();
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();

module.exports = { app, httpServer, io };