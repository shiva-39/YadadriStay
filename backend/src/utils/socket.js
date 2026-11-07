/**
 * Socket.IO Utility
 * Real-time communication for notifications and updates
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Setup Socket.IO connection handlers
 */
const setupSocketHandlers = (io) => {
  // Authentication middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.user = user;
      socket.userId = user._id.toString();
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.fullName} (${socket.userId})`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Join role-based rooms
    socket.join(`role:${socket.user.role}`);

    // If lodge owner, join lodge rooms
    if (socket.user.role === 'lodge_owner') {
      // This would be populated with actual lodge IDs
      // socket.join(`lodge:${lodgeId}`);
    }

    // Handle joining specific rooms
    socket.on('join:lodge', (lodgeId) => {
      if (socket.user.role === 'lodge_owner' || socket.user.role === 'super_admin') {
        socket.join(`lodge:${lodgeId}`);
        console.log(`📍 User ${socket.userId} joined lodge room: ${lodgeId}`);
      }
    });

    socket.on('leave:lodge', (lodgeId) => {
      socket.leave(`lodge:${lodgeId}`);
    });

    // Handle booking updates subscription
    socket.on('subscribe:bookings', (filters = {}) => {
      const roomName = `bookings:${JSON.stringify(filters)}`;
      socket.join(roomName);
    });

    socket.on('unsubscribe:bookings', (filters = {}) => {
      const roomName = `bookings:${JSON.stringify(filters)}`;
      socket.leave(roomName);
    });

    // Handle typing indicators for complaints/chat
    socket.on('typing:start', (data) => {
      socket.to(`complaint:${data.complaintId}`).emit('user:typing', {
        userId: socket.userId,
        userName: socket.user.fullName,
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(`complaint:${data.complaintId}`).emit('user:stopped_typing', {
        userId: socket.userId,
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.userId} - ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.userId}:`, error);
    });
  });

  // Periodic cleanup of stale connections
  setInterval(() => {
    io.sockets.sockets.forEach((socket) => {
      if (socket.connected && !socket.userId) {
        socket.disconnect(true);
      }
    });
  }, 60000); // Every minute
};

/**
 * Emit notification to specific user
 */
const emitNotification = (io, userId, notification) => {
  io.to(`user:${userId}`).emit('notification', notification);
};

/**
 * Emit notification to all users with specific role
 */
const emitNotificationToRole = (io, role, notification) => {
  io.to(`role:${role}`).emit('notification', notification);
};

/**
 * Emit booking update to relevant parties
 */
const emitBookingUpdate = (io, booking, updateType) => {
  const payload = {
    type: 'booking_update',
    updateType,
    booking: {
      id: booking._id,
      bookingId: booking.bookingId,
      status: booking.status,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      lodge: booking.lodge,
      roomCategory: booking.roomCategory,
    },
    timestamp: new Date().toISOString(),
  };

  // Emit to customer
  if (booking.customer) {
    io.to(`user:${booking.customer.toString()}`).emit('booking_update', payload);
  }

  // Emit to lodge owner
  if (booking.lodge && booking.lodge.owner) {
    io.to(`user:${booking.lodge.owner.toString()}`).emit('booking_update', payload);
  }

  // Emit to lodge room
  if (booking.lodge) {
    io.to(`lodge:${booking.lodge.toString()}`).emit('booking_update', payload);
  }

  // Emit to admins
  io.to('role:super_admin').emit('booking_update', payload);
};

/**
 * Emit payment update
 */
const emitPaymentUpdate = (io, payment, updateType) => {
  const payload = {
    type: 'payment_update',
    updateType,
    payment: {
      id: payment._id,
      paymentId: payment.paymentId,
      status: payment.status,
      amount: payment.amount,
      booking: payment.booking,
      lodge: payment.lodge,
    },
    timestamp: new Date().toISOString(),
  };

  // Emit to customer
  if (payment.customer) {
    io.to(`user:${payment.customer.toString()}`).emit('payment_update', payload);
  }

  // Emit to lodge owner
  if (payment.lodge && payment.lodge.owner) {
    io.to(`user:${payment.lodge.owner.toString()}`).emit('payment_update', payload);
  }

  // Emit to admins
  io.to('role:super_admin').emit('payment_update', payload);
};

/**
 * Emit inventory update
 */
const emitInventoryUpdate = (io, lodgeId, roomCategoryId, date, availability) => {
  const payload = {
    type: 'inventory_update',
    lodgeId,
    roomCategoryId,
    date,
    availability,
    timestamp: new Date().toISOString(),
  };

  io.to(`lodge:${lodgeId}`).emit('inventory_update', payload);
  io.to('role:super_admin').emit('inventory_update', payload);
};

/**
 * Emit new complaint
 */
const emitNewComplaint = (io, complaint) => {
  const payload = {
    type: 'new_complaint',
    complaint: {
      id: complaint._id,
      complaintId: complaint.complaintId,
      category: complaint.category,
      priority: complaint.priority,
      subject: complaint.subject,
      customer: complaint.customer,
      lodge: complaint.lodge,
    },
    timestamp: new Date().toISOString(),
  };

  io.to('role:super_admin').emit('new_complaint', payload);

  if (complaint.lodge && complaint.lodge.owner) {
    io.to(`user:${complaint.lodge.owner.toString()}`).emit('new_complaint', payload);
  }
};

/**
 * Emit complaint update
 */
const emitComplaintUpdate = (io, complaint, updateType) => {
  const payload = {
    type: 'complaint_update',
    updateType,
    complaint: {
      id: complaint._id,
      complaintId: complaint.complaintId,
      status: complaint.status,
      category: complaint.category,
      priority: complaint.priority,
    },
    timestamp: new Date().toISOString(),
  };

  // Emit to customer
  if (complaint.customer) {
    io.to(`user:${complaint.customer.toString()}`).emit('complaint_update', payload);
  }

  // Emit to assigned admin
  if (complaint.assignedTo) {
    io.to(`user:${complaint.assignedTo.toString()}`).emit('complaint_update', payload);
  }

  // Emit to lodge owner
  if (complaint.lodge && complaint.lodge.owner) {
    io.to(`user:${complaint.lodge.owner.toString()}`).emit('complaint_update', payload);
  }

  io.to('role:super_admin').emit('complaint_update', payload);
};

/**
 * Emit transport request update
 */
const emitTransportUpdate = (io, transportRequest, updateType) => {
  const payload = {
    type: 'transport_update',
    updateType,
    request: {
      id: transportRequest._id,
      requestId: transportRequest.requestId,
      status: transportRequest.status,
      vehicleType: transportRequest.vehicleType,
      preferredDateTime: transportRequest.preferredDateTime,
    },
    timestamp: new Date().toISOString(),
  };

  if (transportRequest.customer) {
    io.to(`user:${transportRequest.customer.toString()}`).emit('transport_update', payload);
  }

  if (transportRequest.assignedTo) {
    io.to(`user:${transportRequest.assignedTo.toString()}`).emit('transport_update', payload);
  }

  io.to('role:super_admin').emit('transport_update', payload);
};

/**
 * Emit settlement update
 */
const emitSettlementUpdate = (io, settlement, updateType) => {
  const payload = {
    type: 'settlement_update',
    updateType,
    settlement: {
      id: settlement._id,
      settlementId: settlement.settlementId,
      status: settlement.status,
      amount: settlement.settlementAmount,
      lodge: settlement.lodge,
    },
    timestamp: new Date().toISOString(),
  };

  if (settlement.lodgeOwner) {
    io.to(`user:${settlement.lodgeOwner.toString()}`).emit('settlement_update', payload);
  }

  io.to('role:super_admin').emit('settlement_update', payload);
};

/**
 * Broadcast system announcement
 */
const broadcastAnnouncement = (io, announcement) => {
  io.emit('announcement', {
    type: 'announcement',
    ...announcement,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Get connected users count
 */
const getConnectedUsersCount = (io) => {
  return io.sockets.sockets.size;
};

/**
 * Get users in a room
 */
const getUsersInRoom = (io, room) => {
  const roomSockets = io.sockets.adapter.rooms.get(room);
  return roomSockets ? roomSockets.size : 0;
};

module.exports = {
  setupSocketHandlers,
  emitNotification,
  emitNotificationToRole,
  emitBookingUpdate,
  emitPaymentUpdate,
  emitInventoryUpdate,
  emitNewComplaint,
  emitComplaintUpdate,
  emitTransportUpdate,
  emitSettlementUpdate,
  broadcastAnnouncement,
  getConnectedUsersCount,
  getUsersInRoom,
};