import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  Calendar,
  User,
  Phone,
  CreditCard,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  MoreHorizontal,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'pending_verification', label: 'Pending Verification' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'checked_out', label: 'Checked Out' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'no_show', label: 'No Show' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All Payment Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'partial', label: 'Partial' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'failed', label: 'Failed' },
];

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [lodges, setLodges] = useState([]);
  const [selectedLodgeId, setSelectedLodgeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [viewingBooking, setViewingBooking] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});

  useEffect(() => {
    fetchLodges();
  }, []);

  useEffect(() => {
    if (selectedLodgeId) {
      fetchBookings();
    } else {
      setBookings([]);
      setLoading(false);
    }
  }, [selectedLodgeId, searchQuery, statusFilter, paymentStatusFilter, dateFilter, page]);

  const fetchLodges = async () => {
    try {
      const response = await api.get('/lodges?isActive=true');
      const lodgesData = response.data.data?.lodges || [];
      setLodges(lodgesData);
      if (lodgesData.length > 0 && !selectedLodgeId) {
        setSelectedLodgeId(lodgesData[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch lodges:', error);
      toast.error('Failed to load properties');
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {
        lodge: selectedLodgeId,
        limit: 20,
        page,
        sort: '-createdAt',
      };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      if (paymentStatusFilter) params.paymentStatus = paymentStatusFilter;
      if (dateFilter) params.checkInDate = dateFilter;

      const response = await api.get('/bookings', { params });
      setBookings(response.data.data?.bookings || []);
      setTotalPages(response.data.data?.totalPages || 1);
      setTotalBookings(response.data.data?.total || 0);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleLodgeChange = (e) => {
    const id = e.target.value;
    setSelectedLodgeId(id);
    setPage(1);
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [bookingId]: true }));
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      toast.success(`Booking status updated to ${newStatus.replace('_', ' ')}`);
      fetchBookings();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handlePaymentVerification = async (bookingId, action) => {
    setUpdatingStatus(prev => ({ ...prev, [bookingId]: true }));
    try {
      await api.post(`/payments/verify/${bookingId}`, { action, verifiedBy: user._id });
      toast.success(action === 'approve' ? 'Payment verified successfully!' : 'Payment rejected');
      fetchBookings();
    } catch (error) {
      console.error('Failed to verify payment:', error);
      toast.error('Failed to verify payment');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending_payment: { label: 'Pending Payment', color: 'badge-warning', actions: ['confirm', 'cancel'] },
      pending_verification: { label: 'Pending Verification', color: 'badge-info', actions: ['verify', 'cancel'] },
      confirmed: { label: 'Confirmed', color: 'badge-success', actions: ['check_in', 'cancel'] },
      checked_in: { label: 'Checked In', color: 'badge-info', actions: ['check_out'] },
      checked_out: { label: 'Checked Out', color: 'badge-gray', actions: ['complete'] },
      completed: { label: 'Completed', color: 'badge-gray', actions: [] },
      cancelled: { label: 'Cancelled', color: 'badge-danger', actions: [] },
      refunded: { label: 'Refunded', color: 'badge-gray', actions: [] },
      no_show: { label: 'No Show', color: 'badge-danger', actions: [] },
    };
    return configs[status] || { label: status, color: 'badge-gray', actions: [] };
  };

  const getPaymentStatusBadge = (status) => {
    const styles = {
      pending: 'badge-warning',
      paid: 'badge-success',
      partial: 'badge-info',
      refunded: 'badge-gray',
      failed: 'badge-danger',
    };
    return styles[status] || 'badge-gray';
  };

  const filteredBookings = bookings;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Online Bookings</h1>
          <p className="text-gray-600 mt-1">View and manage all online bookings for your properties</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedLodgeId}
            onChange={handleLodgeChange}
            className="input-field w-auto"
          >
            {lodges.map(lodge => (
              <option key={lodge._id} value={lodge._id}>{lodge.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by booking #, guest name, phone..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="input-field pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input-field w-auto"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={paymentStatusFilter}
              onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
              className="input-field w-auto"
            >
              {PAYMENT_STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
              className="input-field w-auto"
              placeholder="Filter by check-in date"
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card">
        <div className="card-body p-0">
          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500">No online bookings match your current filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rooms</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBookings.map((booking) => {
                      const statusConfig = getStatusConfig(booking.status);
                      const isUpdating = updatingStatus[booking._id];

                      return (
                        <tr key={booking._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">
                              {booking.bookingNumber || booking._id.toString().slice(-8).toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(parseISO(booking.createdAt), 'dd MMM, hh:mm a')}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{booking.customerName || booking.customer?.fullName || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{booking.customerPhone || booking.customer?.phone || 'N/A'}</p>
                            {booking.customerEmail && <p className="text-xs text-gray-400">{booking.customerEmail}</p>}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-700">{booking.roomCategoryName || booking.roomCategory?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{booking.lodgeName || booking.lodge?.name || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {format(parseISO(booking.checkInDate), 'dd MMM yyyy')} - {format(parseISO(booking.checkOutDate), 'dd MMM yyyy')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{booking.numberOfRooms}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{booking.totalAmount.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={getPaymentStatusBadge(booking.paymentStatus)}>
                                {booking.paymentStatus}
                              </span>
                              {booking.advancePaid > 0 && (
                                <span className="text-xs text-gray-500">Advance: ₹{booking.advancePaid.toLocaleString('en-IN')}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={statusConfig.color}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setViewingBooking(booking)}
                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                aria-label="View booking details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <div className="relative">
                                <button
                                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                  aria-label="More actions"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>

                                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                  {statusConfig.actions.includes('confirm') && (
                                    <button
                                      onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                                      disabled={isUpdating}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                    >
                                      <Check className="w-4 h-4" />
                                      Confirm Booking
                                    </button>
                                  )}
                                  {statusConfig.actions.includes('verify') && (
                                    <>
                                      <button
                                        onClick={() => handlePaymentVerification(booking._id, 'approve')}
                                        disabled={isUpdating}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                      >
                                        <Check className="w-4 h-4" />
                                        Verify Payment
                                      </button>
                                      <button
                                        onClick={() => handlePaymentVerification(booking._id, 'reject')}
                                        disabled={isUpdating}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                      >
                                        <X className="w-4 h-4" />
                                        Reject Payment
                                      </button>
                                    </>
                                  )}
                                  {statusConfig.actions.includes('check_in') && (
                                    <button
                                      onClick={() => handleStatusUpdate(booking._id, 'checked_in')}
                                      disabled={isUpdating}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                                    >
                                      <AlertTriangle className="w-4 h-4" />
                                      Check In
                                    </button>
                                  )}
                                  {statusConfig.actions.includes('check_out') && (
                                    <button
                                      onClick={() => handleStatusUpdate(booking._id, 'checked_out')}
                                      disabled={isUpdating}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
                                    >
                                      <Check className="w-4 h-4" />
                                      Check Out
                                    </button>
                                  )}
                                  {statusConfig.actions.includes('complete') && (
                                    <button
                                      onClick={() => handleStatusUpdate(booking._id, 'completed')}
                                      disabled={isUpdating}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <Check className="w-4 h-4" />
                                      Mark Complete
                                    </button>
                                  )}
                                  {statusConfig.actions.includes('cancel') && (
                                    <button
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to cancel this booking?')) {
                                          handleStatusUpdate(booking._id, 'cancelled');
                                        }
                                      }}
                                      disabled={isUpdating}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                    >
                                      <X className="w-4 h-4" />
                                      Cancel Booking
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalBookings)} of {totalBookings} bookings
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-3 text-sm text-gray-700">Page {page} of {totalPages}</span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Booking Modal */}
      {viewingBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="view-modal-title">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setViewingBooking(null)} aria-hidden="true" />
            <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 id="view-modal-title" className="text-xl font-semibold text-gray-900">
                  Booking Details: {viewingBooking.bookingNumber || viewingBooking._id.toString().slice(-8).toUpperCase()}
                </h2>
                <button onClick={() => setViewingBooking(null)} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <span className={`${getStatusConfig(viewingBooking.status).color} text-lg`}>
                    {getStatusConfig(viewingBooking.status).label}
                  </span>
                  <span className={getPaymentStatusBadge(viewingBooking.paymentStatus)}>
                    Payment: {viewingBooking.paymentStatus}
                  </span>
                </div>

                {/* Guest Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Guest Information</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Name</dt>
                        <dd className="font-medium">{viewingBooking.customerName || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Phone</dt>
                        <dd>{viewingBooking.customerPhone || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Email</dt>
                        <dd>{viewingBooking.customerEmail || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Stay Details</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Check-in</dt>
                        <dd className="font-medium">{format(parseISO(viewingBooking.checkInDate), 'dd MMM yyyy')}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Check-out</dt>
                        <dd>{format(parseISO(viewingBooking.checkOutDate), 'dd MMM yyyy')}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Nights</dt>
                        <dd>{Math.ceil((parseISO(viewingBooking.checkOutDate) - parseISO(viewingBooking.checkInDate)) / (1000 * 60 * 60 * 24))}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Rooms</dt>
                        <dd>{viewingBooking.numberOfRooms}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Guests</dt>
                        <dd>{viewingBooking.numberOfGuests}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Room & Property */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Room & Property</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Room Category</dt>
                      <dd className="font-medium">{viewingBooking.roomCategoryName || viewingBooking.roomCategory?.name || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Property</dt>
                      <dd>{viewingBooking.lodgeName || viewingBooking.lodge?.name || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Room Type</dt>
                      <dd>{viewingBooking.roomCategoryType || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Payment */}
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Total Amount</dt>
                      <dd className="font-medium text-lg">₹{viewingBooking.totalAmount.toLocaleString('en-IN')}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Advance Paid</dt>
                      <dd>₹{viewingBooking.advancePaid.toLocaleString('en-IN')}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Balance Due</dt>
                      <dd className="font-medium text-red-600">₹{(viewingBooking.totalAmount - viewingBooking.advancePaid).toLocaleString('en-IN')}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Payment Method</dt>
                      <dd className="capitalize">{viewingBooking.paymentMethod || 'N/A'}</dd>
                    </div>
                    {viewingBooking.paymentReference && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Reference</dt>
                        <dd className="font-mono">{viewingBooking.paymentReference}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Special Requests */}
                {viewingBooking.specialRequests && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Special Requests</h4>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{viewingBooking.specialRequests}</p>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex justify-end">
                <button onClick={() => setViewingBooking(null)} className="btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}