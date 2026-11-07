/**
 * Transport Controller
 * Handles customer transport assistance requests and admin management
 */

const TransportRequest = require('../models/TransportRequest');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');

/**
 * Create transport request
 */
const createTransportRequest = async (req, res) => {
  const customer = req.user;
  const {
    vehicleType,
    passengers,
    pickupLocation,
    pickupCoordinates,
    destination,
    destinationCoordinates,
    preferredDateTime,
    contactPhone,
    alternatePhone,
    bookingId,
    customerNotes,
  } = req.body;

  // Verify booking if provided
  if (bookingId) {
    const booking = await Booking.findOne({ _id: bookingId, customer: customer._id });
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
  }

  const request = await TransportRequest.create({
    customer: customer._id,
    booking: bookingId,
    vehicleType,
    passengers,
    pickupLocation,
    pickupCoordinates,
    destination,
    destinationCoordinates,
    preferredDateTime: new Date(preferredDateTime),
    contactPhone,
    alternatePhone,
    customerNotes,
  });

  // Notify admins
  const admins = await require('../models/User').find({ role: 'super_admin', isActive: true });
  for (const admin of admins) {
    await Notification.createNotification({
      user: admin._id,
      type: 'transport_arranged',
      title: 'New Transport Request',
      message: `New transport request ${request.requestId} from ${customer.fullName}.`,
      relatedEntity: { entityType: 'transport', entityId: request._id },
      actionUrl: `/admin/transport/${request._id}`,
      actionText: 'Manage',
      priority: 'high',
    });
  }

  await ActivityLog.log({
    user: customer._id,
    userRole: customer.role,
    userName: customer.fullName,
    action: 'create_transport_request',
    actionCategory: 'transport',
    entityType: 'transport_request',
    entityId: request._id,
    entityName: request.requestId,
    description: `Created transport request ${request.requestId}`,
    metadata: { vehicleType, passengers, preferredDateTime },
    ip: req.ip,
  });

  res.status(201).json({
    success: true,
    message: 'Transport request submitted successfully. Our team will contact you shortly.',
    data: { request },
  });
};

/**
 * Get user's transport requests
 */
const getMyRequests = async (req, res) => {
  const requests = await TransportRequest.find({ customer: req.user._id })
    .populate('booking', 'bookingId lodge')
    .populate('assignedTo', 'fullName')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { requests },
  });
};

/**
 * Get transport request by ID
 */
const getRequestById = async (req, res) => {
  const { id } = req.params;

  const request = await TransportRequest.findOne({
    _id: id,
    $or: [{ customer: req.user._id }, { assignedTo: req.user._id }],
  })
    .populate('customer', 'fullName phone')
    .populate('booking', 'bookingId lodge')
    .populate('assignedTo', 'fullName');

  if (!request) {
    throw new NotFoundError('Transport request not found');
  }

  res.json({
    success: true,
    data: { request },
  });
};

/**
 * Cancel transport request
 */
const cancelRequest = async (req, res) => {
  const { id } = req.params;

  const request = await TransportRequest.findOne({ _id: id, customer: req.user._id });
  if (!request) {
    throw new NotFoundError('Transport request not found');
  }

  if (!['pending', 'contacted'].includes(request.status)) {
    throw new BadRequestError('Cannot cancel request in current status');
  }

  request.status = 'cancelled';
  await request.save();

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'cancel_transport_request',
    actionCategory: 'transport',
    entityType: 'transport_request',
    entityId: request._id,
    entityName: request.requestId,
    description: `Cancelled transport request ${request.requestId}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Transport request cancelled',
    data: { request },
  });
};

/**
 * Get all transport requests (admin)
 */
const getAllRequests = async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;

  const query = {};
  if (status) query.status = status;

  const requests = await TransportRequest.find(query)
    .populate('customer', 'fullName phone')
    .populate('booking', 'bookingId lodge')
    .populate('assignedTo', 'fullName')
    .sort({ preferredDateTime: 1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await TransportRequest.countDocuments(query);

  res.json({
    success: true,
    data: {
      requests,
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
 * Get pending transport requests (admin)
 */
const getPendingRequests = async (req, res) => {
  const requests = await TransportRequest.getPending();

  res.json({
    success: true,
    data: { requests },
  });
};

/**
 * Get transport request by ID (admin)
 */
const getRequestByIdAdmin = async (req, res) => {
  const { id } = req.params;

  const request = await TransportRequest.findById(id)
    .populate('customer', 'fullName phone email')
    .populate('booking', 'bookingId lodge')
    .populate('assignedTo', 'fullName');

  if (!request) {
    throw new NotFoundError('Transport request not found');
  }

  res.json({
    success: true,
    data: { request },
  });
};

/**
 * Assign transport request
 */
const assignRequest = async (req, res) => {
  const { id } = req.params;

  const request = await TransportRequest.findById(id);
  if (!request) {
    throw new NotFoundError('Transport request not found');
  }

  await request.assign(req.user._id);

  // Notify customer
  await Notification.createNotification({
    user: request.customer,
    type: 'transport_arranged',
    title: 'Transport Request Assigned',
    message: `Your transport request ${request.requestId} has been assigned to our team. They will contact you shortly.`,
    relatedEntity: { entityType: 'transport', entityId: request._id },
    priority: 'normal',
  });

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'assign_transport_request',
    actionCategory: 'transport',
    entityType: 'transport_request',
    entityId: request._id,
    entityName: request.requestId,
    description: `Assigned transport request ${request.requestId} to ${req.user.fullName}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Transport request assigned',
    data: { request },
  });
};

/**
 * Arrange transport
 */
const arrangeTransport = async (req, res) => {
  const { id } = req.params;
  const { vehicle, provider, providerContact, estimatedCost } = req.body;

  if (!vehicle || !provider || !providerContact) {
    throw new BadRequestError('Vehicle, provider, and provider contact are required');
  }

  const request = await TransportRequest.findById(id);
  if (!request) {
    throw new NotFoundError('Transport request not found');
  }

  await request.arrange(req.user._id, vehicle, provider, providerContact);

  if (estimatedCost) request.estimatedCost = estimatedCost;
  await request.save();

  // Notify customer
  await Notification.createNotification({
    user: request.customer,
    type: 'transport_arranged',
    title: 'Transport Arranged',
    message: `Your transport has been arranged: ${vehicle} from ${provider}. Contact: ${providerContact}`,
    relatedEntity: { entityType: 'transport', entityId: request._id },
    priority: 'high',
  });

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'arrange_transport',
    actionCategory: 'transport',
    entityType: 'transport_request',
    entityId: request._id,
    entityName: request.requestId,
    description: `Arranged transport for ${request.requestId}: ${vehicle} from ${provider}`,
    metadata: { vehicle, provider, providerContact, estimatedCost },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Transport arranged successfully',
    data: { request },
  });
};

/**
 * Complete transport request
 */
const completeRequest = async (req, res) => {
  const { id } = req.params;
  const { actualCost } = req.body;

  const request = await TransportRequest.findById(id);
  if (!request) {
    throw new NotFoundError('Transport request not found');
  }

  if (request.status !== 'arranged') {
    throw new BadRequestError('Can only complete arranged requests');
  }

  await request.complete(req.user._id, actualCost);

  // Notify customer
  await Notification.createNotification({
    user: request.customer,
    type: 'transport_completed',
    title: 'Transport Completed',
    message: `Your transport request ${request.requestId} has been completed.`,
    relatedEntity: { entityType: 'transport', entityId: request._id },
    priority: 'normal',
  });

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'complete_transport',
    actionCategory: 'transport',
    entityType: 'transport_request',
    entityId: request._id,
    entityName: request.requestId,
    description: `Completed transport request ${request.requestId}`,
    metadata: { actualCost },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Transport request completed',
    data: { request },
  });
};

/**
 * Add communication log
 */
const addCommunication = async (req, res) => {
  const { id } = req.params;
  const { type, direction, content } = req.body;

  if (!type || !direction || !content) {
    throw new BadRequestError('Type, direction, and content are required');
  }

  const request = await TransportRequest.findById(id);
  if (!request) {
    throw new NotFoundError('Transport request not found');
  }

  await request.addCommunication(type, direction, content, req.user._id);

  await ActivityLog.log({
    user: req.user._id,
    userRole: req.user.role,
    userName: req.user.fullName,
    action: 'transport_communication',
    actionCategory: 'transport',
    entityType: 'transport_request',
    entityId: request._id,
    entityName: request.requestId,
    description: `Added communication log for ${request.requestId}`,
    metadata: { type, direction },
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Communication logged',
    data: { request },
  });
};

module.exports = {
  createTransportRequest,
  getMyRequests,
  getRequestById,
  cancelRequest,
  getAllRequests,
  getPendingRequests,
  getRequestByIdAdmin,
  assignRequest,
  arrangeTransport,
  completeRequest,
  addCommunication,
};