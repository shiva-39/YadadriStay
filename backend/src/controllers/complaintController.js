/**
 * Complaint Controller
 * Handles customer complaints, admin management, and resolution
 */

const Complaint = require('../models/Complaint');
const Booking = require('../models/Booking');
const Lodge = require('../models/Lodge');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');

/**
 * Create complaint
 */
const createComplaint = async (req, res) => {
  const customer = req.user;
  const {
    category,
    subject,
    description,
    priority = 'medium',
    lodgeId,
    bookingId,
  } = req.body;

  // Verify lodge if provided
  if (lodgeId) {
    const lodge = await Lodge.findById(lodgeId);
    if (!lodge) {
      throw new NotFoundError('Lodge not found');
    }
  }

  // Verify booking if provided
  if (bookingId) {
    const booking = await Booking.findOne({ _id: bookingId, customer: customer._id });
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
  }

  // Process attachments
  const attachments = [];
  if (req.files && req.files.attachments) {
    for (const file of req.files.attachments) {
      // In production, upload to Cloudinary
      attachments.push({
        url: `/uploads/${file.filename}`, // Placeholder
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      });
    }
  }

  const complaint = await Complaint.create({
    customer: customer._id,
    lodge: lodgeId,
    booking: bookingId,
    category,
    priority,
    subject,
    description,
    attachments,
  });

  // Notify admins
  const admins = await require('../models/User').find({ role: 'super_admin', isActive: true });
  for (const admin of admins) {
    await Notification.createNotification({
      user: admin._id,
      type: 'complaint_update',
      title: 'New Complaint Received',
      message: `New ${category} complaint ${complaint.complaintId} from ${customer.fullName}.`,
      relatedEntity: { entityType: 'complaint', entityId: complaint._id },
      actionUrl: `/admin/complaints/${complaint._id}`,
      actionText: 'View',
      priority: priority === 'urgent' ? 'urgent' : 'high',
    });
  }

  // Notify lodge owner if applicable
  if (lodgeId) {
    const lodge = await Lodge.findById(lodgeId);
    if (lodge) {
      await Notification.createNotification({
        user: lodge.owner,
        type: 'complaint_update',
        title: 'New Complaint for Your Lodge',
        message: `New ${category} complaint received for "${lodge.name}".`,
        relatedEntity: { entityType: 'complaint', entityId: complaint._id },
        priority: 'normal',
      });
    }
  }

  await ActivityLog.log({
    user: customer._id,
    userRole: customer.role,
    userName: customer.fullName,
    action: 'create_complaint',
    actionCategory: 'complaint',
    entityType: 'complaint',
    entityId: complaint._id,
    entityName: complaint.complaintId,
    description: `Created ${category} complaint: ${subject}`,
    metadata: { category, priority },
    ip: req.ip,
  });

  res.status(201).json({
    success: true,
    message: 'Complaint submitted successfully. Our team will review and respond shortly.',
    data: { complaint },
  });
};

/**
 * Get user's complaints
 */
const getMyComplaints = async (req, res) => {
  const complaints = await Complaint.find({ customer: req.user._id })
    .populate('lodge', 'name')
    .populate('booking', 'bookingId')
    .populate('assignedTo', 'fullName')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { complaints },
  });
};

/**
 * Get complaint by ID
 */
const getComplaintById = async (req, res) => {
  const { id } = req.params;

  const complaint = await Complaint.findOne({
    _id: id,
    $or: [{ customer: req.user._id }, { assignedTo: req.user._id }],
  })
    .populate('customer', 'fullName phone email')
    .populate('lodge', 'name')
    .populate('booking', 'bookingId')
    .populate('assignedTo', 'fullName')
    .populate('messages.sender', 'fullName role');

  if (!complaint) {
    throw new NotFoundError('Complaint not found');
  }

  res.json({
    success: true,
    data: { complaint },
  });
};

/**
 * Add message to complaint
 */
const addMessage = async (req, res) => {
  const { id } = req.params;
  const { message, isInternal = false } = req.body;

  if (!message) {
    throw new BadRequestError('Message is required');
  }

  const complaint = await Complaint.findById(id);
  if (!complaint) {
    throw new NotFoundError('Complaint not found');
  }

  // Check access
  const user = req.user;
  const isCustomer = user.role === 'customer' && complaint.customer.toString() === user._id.toString();
  const isAdmin = user.role === 'super_admin';
  const isAssigned = complaint.assignedTo?.toString() === user._id.toString();

  if (!isCustomer && !isAdmin && !isAssigned) {
    throw new ForbiddenError('Access denied');
  }

  // Customers cannot send internal messages
  if (isCustomer && isInternal) {
    throw new ForbiddenError('Customers cannot send internal messages');
  }

  const senderRole = user.role === 'super_admin' ? 'admin' : user.role === 'lodge_owner' ? 'lodge_owner' : 'customer';

  await complaint.addMessage(user._id, senderRole, message, [], isInternal);

  // Notify relevant parties
  if (isCustomer) {
    // Notify assigned admin
    if (complaint.assignedTo) {
      await Notification.createNotification({
        user: complaint.assignedTo,
        type: 'complaint_update',
        title: 'New Message on Complaint',
        message: `Customer replied to complaint ${complaint.complaintId}.`,
        relatedEntity: { entityType: 'complaint', entityId: complaint._id },
        priority: 'normal',
      });
    }
  } else {
    // Notify customer
    await Notification.createNotification({
      user: complaint.customer,
      type: 'complaint_update',
      title: 'Update on Your Complaint',
      message: `New update on complaint ${complaint.complaintId}.`,
      relatedEntity: { entityType: 'complaint', entityId: complaint._id },
      priority: 'normal',
    });
  }

  await ActivityLog.log({
    user: user._id,
    userRole: user.role,
    userName: user.fullName,
    action: 'add_complaint_message',
    actionCategory: 'complaint',
    entityType: 'complaint',
    entityId: complaint._id,
    entityName: complaint.complaintId,
    description: `Added message to complaint ${complaint.complaintId}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Message added successfully',
    data: { complaint },
  });
};

/**
 * Submit satisfaction rating
 */
const submitSatisfaction = async (req, res) => {
  const { id } = req.params;
  const { rating, feedback } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    throw new BadRequestError('Rating must be between 1 and 5');
  }

  const complaint = await Complaint.findOne({ _id: id, customer: req.user._id });
  if (!complaint) {
    throw new NotFoundError('Complaint not found');
  }

  if (complaint.status !== 'resolved' && complaint.status !== 'closed') {
    throw new BadRequestError('Can only rate resolved or closed complaints');
  }

  await complaint.addSatisfaction(rating, feedback);

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'complaint_satisfaction',
    actionCategory: 'complaint',
    entityType: 'complaint',
    entityId: complaint._id,
    entityName: complaint.complaintId,
    description: `Submitted satisfaction rating ${rating} for complaint ${complaint.complaintId}`,
    metadata: { rating, feedback },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Thank you for your feedback',
    data: { complaint },
  });
};

/**
 * Get all complaints (admin)
 */
const getAllComplaints = async (req, res) => {
  const { status, category, priority, page = 1, limit = 50 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (priority) query.priority = priority;

  const complaints = await Complaint.find(query)
    .populate('customer', 'fullName phone email')
    .populate('lodge', 'name')
    .populate('booking', 'bookingId')
    .populate('assignedTo', 'fullName')
    .sort({ priority: -1, createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Complaint.countDocuments(query);

  res.json({
    success: true,
    data: {
      complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
};

/**
 * Get open complaints (admin)
 */
const getOpenComplaints = async (req, res) => {
  const complaints = await Complaint.getOpen();

  res.json({
    success: true,
    data: { complaints },
  });
};

/**
 * Get complaint by ID (admin)
 */
const getComplaintByIdAdmin = async (req, res) => {
  const { id } = req.params;

  const complaint = await Complaint.findById(id)
    .populate('customer', 'fullName phone email')
    .populate('lodge', 'name owner')
    .populate('booking', 'bookingId')
    .populate('assignedTo', 'fullName')
    .populate('messages.sender', 'fullName role');

  if (!complaint) {
    throw new NotFoundError('Complaint not found');
  }

  res.json({
    success: true,
    data: { complaint },
  });
};

/**
 * Assign complaint (admin)
 */
const assignComplaint = async (req, res) => {
  const { id } = req.params;
  const { assignedTo } = req.body;

  if (!assignedTo) {
    throw new BadRequestError('Assigned admin ID is required');
  }

  const complaint = await Complaint.findById(id);
  if (!complaint) {
    throw new NotFoundError('Complaint not found');
  }

  const admin = await require('../models/User').findById(assignedTo);
  if (!admin || admin.role !== 'super_admin') {
    throw new BadRequestError('Invalid admin user');
  }

  await complaint.assign(assignedTo);

  // Notify assigned admin
  await Notification.createNotification({
    user: assignedTo,
    type: 'complaint_update',
    title: 'Complaint Assigned',
    message: `Complaint ${complaint.complaintId} has been assigned to you.`,
    relatedEntity: { entityType: 'complaint', entityId: complaint._id },
    priority: 'high',
  });

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'assign_complaint',
    actionCategory: 'complaint',
    entityType: 'complaint',
    entityId: complaint._id,
    entityName: complaint.complaintId,
    description: `Assigned complaint ${complaint.complaintId} to ${admin.fullName}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Complaint assigned successfully',
    data: { complaint },
  });
};

/**
 * Resolve complaint (admin)
 */
const resolveComplaint = async (req, res) => {
  const { id } = req.params;
  const { summary, details, actionTaken } = req.body;

  if (!summary) {
    throw new BadRequestError('Resolution summary is required');
  }

  const complaint = await Complaint.findById(id);
  if (!complaint) {
    throw new NotFoundError('Complaint not found');
  }

  await complaint.resolve(req.user._id, summary, details || '', actionTaken || '');

  // Notify customer
  await Notification.createNotification({
    user: complaint.customer,
    type: 'complaint_resolved',
    title: 'Complaint Resolved',
    message: `Your complaint ${complaint.complaintId} has been resolved. ${summary}`,
    relatedEntity: { entityType: 'complaint', entityId: complaint._id },
    priority: 'high',
  });

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'resolve_complaint',
    actionCategory: 'complaint',
    entityType: 'complaint',
    entityId: complaint._id,
    entityName: complaint.complaintId,
    description: `Resolved complaint ${complaint.complaintId}: ${summary}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Complaint resolved successfully',
    data: { complaint },
  });
};

/**
 * Close complaint (admin)
 */
const closeComplaint = async (req, res) => {
  const { id } = req.params;

  const complaint = await Complaint.findById(id);
  if (!complaint) {
    throw new NotFoundError('Complaint not found');
  }

  await complaint.close();

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'close_complaint',
    actionCategory: 'complaint',
    entityType: 'complaint',
    entityId: complaint._id,
    entityName: complaint.complaintId,
    description: `Closed complaint ${complaint.complaintId}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Complaint closed',
    data: { complaint },
  });
};

/**
 * Reopen complaint (admin)
 */
const reopenComplaint = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    throw new BadRequestError('Reason for reopening is required');
  }

  const complaint = await Complaint.findById(id);
  if (!complaint) {
    throw new NotFoundError('Complaint not found');
  }

  await complaint.reopen(reason);

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'reopen_complaint',
    actionCategory: 'complaint',
    entityType: 'complaint',
    entityId: complaint._id,
    entityName: complaint.complaintId,
    description: `Reopened complaint ${complaint.complaintId}: ${reason}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Complaint reopened',
    data: { complaint },
  });
};

/**
 * Get complaint statistics (admin)
 */
const getComplaintStats = async (req, res) => {
  const { startDate, endDate } = req.query;

  const filters = {};
  if (startDate || endDate) {
    filters.createdAt = {};
    if (startDate) filters.createdAt.$gte = new Date(startDate);
    if (endDate) filters.createdAt.$lte = new Date(endDate);
  }

  const stats = await Complaint.getStatistics(filters);

  res.json({
    success: true,
    data: { stats },
  });
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  addMessage,
  submitSatisfaction,
  getAllComplaints,
  getOpenComplaints,
  getComplaintByIdAdmin,
  assignComplaint,
  resolveComplaint,
  closeComplaint,
  reopenComplaint,
  getComplaintStats,
};