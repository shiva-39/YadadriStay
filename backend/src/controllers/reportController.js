/**
 * Report Controller
 * Handles booking, revenue, and analytics reports
 */

const Booking = require('../models/Booking');
const OfflineBooking = require('../models/OfflineBooking');
const Payment = require('../models/Payment');
const Settlement = require('../models/Settlement');
const Lodge = require('../models/Lodge');
const RoomInventory = require('../models/RoomInventory');
const Review = require('../models/Review');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * Get owner booking report
 */
const getOwnerBookingReport = async (req, res) => {
  const { startDate, endDate, lodgeId, type = 'daily' } = req.query;

  const lodges = await Lodge.find({ owner: req.user._id }).distinct('_id');
  const query = { lodge: { $in: lodges } };

  if (lodgeId) query.lodge = lodgeId;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const onlineBookings = await Booking.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          $dateToString: { format: type === 'monthly' ? '%Y-%m' : '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$pricing.totalAmount' },
        advanceAmount: { $sum: '$pricing.advanceAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const offlineBookings = await OfflineBooking.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          $dateToString: { format: type === 'monthly' ? '%Y-%m' : '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$pricing.totalAmount' },
        paidAmount: { $sum: '$payment.paidAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: {
      onlineBookings,
      offlineBookings,
      type,
      dateRange: { startDate, endDate },
    },
  });
};

/**
 * Get owner revenue report
 */
const getOwnerRevenueReport = async (req, res) => {
  const { startDate, endDate, lodgeId } = req.query;

  const lodges = await Lodge.find({ owner: req.user._id }).distinct('_id');
  const query = { lodge: { $in: lodges } };

  if (lodgeId) query.lodge = lodgeId;

  // Online revenue (verified payments)
  const onlinePayments = await Payment.aggregate([
    { $match: { ...query, status: 'verified' } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$verification.verifiedAt' },
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Offline revenue
  const offlinePayments = await OfflineBooking.aggregate([
    { $match: { ...query, 'payment.status': 'paid' } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$payment.paymentDate' },
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$payment.paidAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Settlements
  const settlements = await Settlement.aggregate([
    { $match: { lodgeOwner: req.user._id, status: 'completed' } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$settlementDate' },
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$settlementAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: {
      onlinePayments,
      offlinePayments,
      settlements,
      dateRange: { startDate, endDate },
    },
  });
};

/**
 * Get owner occupancy report
 */
const getOwnerOccupancyReport = async (req, res) => {
  const { startDate, endDate, lodgeId } = req.query;

  const lodges = await Lodge.find({ owner: req.user._id }).distinct('_id');
  const query = { lodge: { $in: lodges } };

  if (lodgeId) query.lodge = lodgeId;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const inventory = await RoomInventory.find(query)
    .populate('roomCategory', 'name totalRooms');

  // Calculate occupancy by date
  const occupancyByDate = {};
  inventory.forEach(item => {
    const dateStr = item.date.toISOString().split('T')[0];
    if (!occupancyByDate[dateStr]) {
      occupancyByDate[dateStr] = { totalRooms: 0, occupiedRooms: 0, availableRooms: 0 };
    }
    occupancyByDate[dateStr].totalRooms += item.totalRooms;
    occupancyByDate[dateStr].occupiedRooms += item.totalRooms - item.availableRooms - item.blockedRooms;
    occupancyByDate[dateStr].availableRooms += item.availableRooms;
  });

  // Calculate occupancy by room category
  const occupancyByCategory = {};
  inventory.forEach(item => {
    const catId = item.roomCategory._id.toString();
    const catName = item.roomCategory.name;
    if (!occupancyByCategory[catId]) {
      occupancyByCategory[catId] = { name: catName, totalRooms: 0, occupiedRooms: 0, availableRooms: 0, days: 0 };
    }
    occupancyByCategory[catId].totalRooms += item.totalRooms;
    occupancyByCategory[catId].occupiedRooms += item.totalRooms - item.availableRooms - item.blockedRooms;
    occupancyByCategory[catId].availableRooms += item.availableRooms;
    occupancyByCategory[catId].days += 1;
  });

  // Average occupancy percentage per category
  Object.keys(occupancyByCategory).forEach(catId => {
    const cat = occupancyByCategory[catId];
    const avgTotal = cat.totalRooms / cat.days;
    const avgOccupied = cat.occupiedRooms / cat.days;
    cat.averageOccupancyRate = avgTotal > 0 ? ((avgOccupied / avgTotal) * 100).toFixed(2) : 0;
  });

  res.json({
    success: true,
    data: {
      occupancyByDate: Object.entries(occupancyByDate).map(([date, data]) => ({
        date,
        ...data,
        occupancyRate: data.totalRooms > 0 ? ((data.occupiedRooms / data.totalRooms) * 100).toFixed(2) : 0,
      })),
      occupancyByCategory: Object.values(occupancyByCategory),
      dateRange: { startDate, endDate },
    },
  });
};

/**
 * Get platform booking report (admin)
 */
const getPlatformBookingReport = async (req, res) => {
  const { startDate, endDate, type = 'daily' } = req.query;

  const query = {};
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const bookings = await Booking.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          $dateToString: { format: type === 'monthly' ? '%Y-%m' : '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$pricing.totalAmount' },
        advanceAmount: { $sum: '$pricing.advanceAmount' },
        byStatus: {
          $push: { status: '$status', amount: '$pricing.totalAmount' },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const offlineBookings = await OfflineBooking.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          $dateToString: { format: type === 'monthly' ? '%Y-%m' : '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$pricing.totalAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: {
      onlineBookings: bookings,
      offlineBookings,
      type,
      dateRange: { startDate, endDate },
    },
  });
};

/**
 * Get platform revenue report (admin)
 */
const getPlatformRevenueReport = async (req, res) => {
  const { startDate, endDate } = req.query;

  const query = { status: 'verified' };
  if (startDate || endDate) {
    query['verification.verifiedAt'] = {};
    if (startDate) query['verification.verifiedAt'].$gte = new Date(startDate);
    if (endDate) query['verification.verifiedAt'].$lte = new Date(endDate);
  }

  const payments = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$verification.verifiedAt' },
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalAdvance: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const settlements = await Settlement.aggregate([
    { $match: { status: 'completed', settlementDate: { $exists: true } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$settlementDate' },
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$settlementAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: {
      payments,
      settlements,
      dateRange: { startDate, endDate },
    },
  });
};

/**
 * Get lodge-wise report (admin)
 */
const getLodgeWiseReport = async (req, res) => {
  const { startDate, endDate } = req.query;

  const lodges = await Lodge.find({ status: 'approved' });

  const lodgeReports = await Promise.all(
    lodges.map(async (lodge) => {
      const bookings = await Booking.countDocuments({
        lodge: lodge._id,
        ...(startDate || endDate ? {
          createdAt: {
            ...(startDate && { $gte: new Date(startDate) }),
            ...(endDate && { $lte: new Date(endDate) }),
          },
        } : {}),
      });

      const revenue = await Payment.aggregate([
        {
          $match: {
            lodge: lodge._id,
            status: 'verified',
            ...(startDate || endDate ? {
              'verification.verifiedAt': {
                ...(startDate && { $gte: new Date(startDate) }),
                ...(endDate && { $lte: new Date(endDate) }),
              },
            } : {}),
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const reviews = await Review.getStatisticsForLodge(lodge._id);

      return {
        lodge: {
          id: lodge._id,
          name: lodge.name,
          city: lodge.address.city,
        },
        bookings,
        revenue: revenue[0]?.total || 0,
        reviews: reviews,
      };
    })
  );

  // Sort by revenue
  lodgeReports.sort((a, b) => b.revenue - a.revenue);

  res.json({
    success: true,
    data: {
      lodges: lodgeReports,
      dateRange: { startDate, endDate },
    },
  });
};

/**
 * Get payment verification report (admin)
 */
const getPaymentReport = async (req, res) => {
  const { startDate, endDate, status } = req.query;

  const query = {};
  if (status) query.status = status;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const payments = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  const pendingDetails = await Payment.find({ status: 'pending_verification' })
    .populate('customer', 'fullName phone')
    .populate('lodge', 'name')
    .populate('booking', 'bookingId checkInDate checkOutDate')
    .sort({ submittedAt: 1 })
    .limit(100);

  res.json({
    success: true,
    data: {
      summary: payments,
      pendingDetails,
      dateRange: { startDate, endDate },
    },
  });
};

/**
 * Get advance collection report (admin)
 */
const getAdvanceCollectionReport = async (req, res) => {
  const { startDate, endDate } = req.query;

  const query = { status: 'verified' };
  if (startDate || endDate) {
    query['verification.verifiedAt'] = {};
    if (startDate) query['verification.verifiedAt'].$gte = new Date(startDate);
    if (endDate) query['verification.verifiedAt'].$lte = new Date(endDate);
  }

  const advances = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$verification.verifiedAt' },
        },
        count: { $sum: 1 },
        totalAdvance: { $sum: '$amount' },
        byLodge: {
          $push: { lodge: '$lodge', amount: '$amount' },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Lodge-wise advance collection
  const lodgeAdvances = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$lodge',
        count: { $sum: 1 },
        totalAdvance: { $sum: '$amount' },
      },
    },
    { $sort: { totalAdvance: -1 } },
  ]);

  // Populate lodge names
  const Lodge = require('../models/Lodge');
  const lodgeIds = lodgeAdvances.map(l => l._id);
  const lodges = await Lodge.find({ _id: { $in: lodgeIds } }).select('name');

  const lodgeAdvanceMap = {};
  lodges.forEach(l => { lodgeAdvanceMap[l._id.toString()] = l.name; });

  const lodgeAdvancesWithNames = lodgeAdvances.map(l => ({
    lodgeId: l._id,
    lodgeName: lodgeAdvanceMap[l._id.toString()] || 'Unknown',
    count: l.count,
    totalAdvance: l.totalAdvance,
  }));

  res.json({
    success: true,
    data: {
      dailyAdvances: advances,
      lodgeAdvances: lodgeAdvancesWithNames,
      dateRange: { startDate, endDate },
    },
  });
};

/**
 * Get refund report (admin)
 */
const getRefundReport = async (req, res) => {
  const { startDate, endDate } = req.query;

  const query = { 'refund.status': { $in: ['pending', 'processed'] } };
  if (startDate || endDate) {
    query['refund.requestedAt'] = {};
    if (startDate) query['refund.requestedAt'].$gte = new Date(startDate);
    if (endDate) query['refund.requestedAt'].$lte = new Date(endDate);
  }

  const refunds = await Payment.find(query)
    .populate('customer', 'fullName phone')
    .populate('lodge', 'name')
    .populate('booking', 'bookingId')
    .populate('refund.requestedBy', 'fullName')
    .populate('refund.processedBy', 'fullName')
    .sort({ 'refund.requestedAt': -1 });

  res.json({
    success: true,
    data: { refunds, dateRange: { startDate, endDate } },
  });
};

/**
 * Export report as CSV
 */
const exportReport = async (req, res) => {
  const { type, startDate, endDate, format = 'csv' } = req.query;

  if (!type) {
    throw new BadRequestError('Report type is required');
  }

  let data = [];
  let headers = [];

  switch (type) {
    case 'bookings':
      const bookings = await Booking.find({
        createdAt: {
          $gte: startDate ? new Date(startDate) : new Date(0),
          $lte: endDate ? new Date(endDate) : new Date(),
        },
      })
        .populate('customer', 'fullName phone')
        .populate('lodge', 'name')
        .populate('roomCategory', 'name')
        .lean();

      headers = ['Booking ID', 'Customer', 'Phone', 'Lodge', 'Room', 'Check-in', 'Check-out', 'Status', 'Total Amount', 'Advance', 'Created At'];
      data = bookings.map(b => [
        b.bookingId,
        b.customer?.fullName,
        b.customer?.phone,
        b.lodge?.name,
        b.roomCategory?.name,
        b.checkInDate?.toISOString().split('T')[0],
        b.checkOutDate?.toISOString().split('T')[0],
        b.status,
        b.pricing?.totalAmount,
        b.pricing?.advanceAmount,
        b.createdAt?.toISOString().split('T')[0],
      ]);
      break;

    case 'payments':
      const payments = await Payment.find({
        createdAt: {
          $gte: startDate ? new Date(startDate) : new Date(0),
          $lte: endDate ? new Date(endDate) : new Date(),
        },
      })
        .populate('customer', 'fullName phone')
        .populate('lodge', 'name')
        .populate('booking', 'bookingId')
        .lean();

      headers = ['Payment ID', 'Booking ID', 'Customer', 'Lodge', 'Amount', 'Status', 'Transaction Ref', 'Verified At'];
      data = payments.map(p => [
        p.paymentId,
        p.booking?.bookingId,
        p.customer?.fullName,
        p.lodge?.name,
        p.amount,
        p.status,
        p.upi?.transactionRef,
        p.verification?.verifiedAt?.toISOString().split('T')[0],
      ]);
      break;

    case 'lodges':
      const lodges = await Lodge.find({ status: 'approved' }).lean();
      headers = ['Lodge ID', 'Name', 'City', 'Owner', 'Status', 'Rooms', 'Rating', 'Total Bookings'];
      data = lodges.map(l => [
        l._id,
        l.name,
        l.address?.city,
        l.owner?.toString(),
        l.status,
        l.roomCategories?.length || 0,
        l.rating?.average || 0,
        l.stats?.totalBookings || 0,
      ]);
      break;

    default:
      throw new BadRequestError('Invalid report type');
  }

  if (format === 'csv') {
    const csv = [headers.join(','), ...data.map(row => row.map(v => `"${v || ''}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.csv"`);
    return res.send(csv);
  }

  res.json({
    success: true,
    data: { headers, data },
  });
};

module.exports = {
  getOwnerBookingReport,
  getOwnerRevenueReport,
  getOwnerOccupancyReport,
  getPlatformBookingReport,
  getPlatformRevenueReport,
  getLodgeWiseReport,
  getPaymentReport,
  getAdvanceCollectionReport,
  getRefundReport,
  exportReport,
};