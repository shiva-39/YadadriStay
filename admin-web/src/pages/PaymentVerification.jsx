import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  CreditCard,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Image,
  FileText,
  Clock,
  Shield,
  Download,
  MoreHorizontal,
  Check,
  X,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending_verification', label: 'Pending Verification' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'failed', label: 'Failed' },
];

export default function PaymentVerification() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [viewingPayment, setViewingPayment] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});

  useEffect(() => {
    fetchPayments();
  }, [searchQuery, statusFilter, dateFilter, page]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 20,
        page,
        sort: '-createdAt',
      };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;

      const response = await api.get('/admin/payments', { params });
      setPayments(response.data.data?.payments || []);
      setTotalPages(response.data.data?.totalPages || 1);
      setTotalPayments(response.data.data?.total || 0);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (paymentId, newStatus, notes = '') => {
    setUpdatingStatus(prev => ({ ...prev, [paymentId]: true }));
    try {
      await api.patch(`/admin/payments/${paymentId}/verify`, {
        status: newStatus,
        notes,
        verifiedBy: user._id,
      });
      toast.success(`Payment ${newStatus.replace('_', ' ')} successfully!`);
      fetchPayments();
    } catch (error) {
      console.error('Failed to update payment status:', error);
      toast.error('Failed to update payment status');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [paymentId]: false }));
    }
  };

  const handleVerify = (payment) => {
    const notes = window.prompt('Verification notes (optional):') || '';
    handleStatusUpdate(payment._id, 'verified', notes);
  };

  const handleReject = (payment) => {
    const reason = window.prompt('Rejection reason (required):');
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    handleStatusUpdate(payment._id, 'rejected', reason);
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending_verification: { label: 'Pending Verification', color: 'badge-warning', actions: ['verify', 'reject'] },
      verified: { label: 'Verified', color: 'badge-success', actions: ['reject'] },
      rejected: { label: 'Rejected', color: 'badge-danger', actions: [] },
      refunded: { label: 'Refunded', color: 'badge-gray', actions: [] },
      failed: { label: 'Failed', color: 'badge-danger', actions: [] },
    };
    return configs[status] || { label: status, color: 'badge-gray', actions: [] };
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Payment Verification</h1>
          <p className="text-gray-600 mt-1">Verify UPI payment screenshots submitted by customers</p>
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
                placeholder="Search by customer, booking ID, lodge..."
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
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
              className="input-field w-auto"
              placeholder="Filter by date"
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card">
        <div className="card-body p-0">
          {payments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-500">No payments match your current filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lodge</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((payment) => {
                      const statusConfig = getStatusConfig(payment.status);
                      const isUpdating = updatingStatus[payment._id];

                      return (
                        <tr key={payment._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">#{payment.bookingId?.bookingNumber || payment.bookingId?._id?.slice(-8).toUpperCase() || 'N/A'}</p>
                              <p className="text-xs text-gray-500">{payment.bookingId?._id || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-primary-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{payment.bookingId?.customerName || payment.customerName || 'Unknown'}</p>
                                <p className="text-xs text-gray-500">{payment.bookingId?.customerPhone || payment.customerPhone || 'N/A'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <p className="font-medium">{payment.bookingId?.lodgeName || payment.lodgeName || 'Unknown Lodge'}</p>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900">
                            {formatAmount(payment.amount)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                            {payment.paymentMethod || 'upi'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {format(new Date(payment.createdAt), 'dd MMM yyyy, hh:mm a')}
                          </td>
                          <td className="px-6 py-4">
                            <span className={statusConfig.color}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setViewingPayment(payment)}
                                disabled={isUpdating}
                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                                aria-label="View payment details"
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

                                <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                  {statusConfig.actions.includes('verify') && (
                                    <button
                                      onClick={() => handleVerify(payment)}
                                      disabled={isUpdating}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Verify
                                    </button>
                                  )}
                                  {statusConfig.actions.includes('reject') && (
                                    <button
                                      onClick={() => handleReject(payment)}
                                      disabled={isUpdating}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Reject
                                    </button>
                                  )}
                                  <hr className="my-1 border-gray-100" />
                                  <button
                                    onClick={() => setViewingPayment(payment)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View Details
                                  </button>
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
                    Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalPayments)} of {totalPayments} payments
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

      {/* View Payment Modal */}
      {viewingPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setViewingPayment(null)} aria-hidden="true" />
            <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 id="payment-modal-title" className="text-xl font-semibold text-gray-900">
                  Payment Details
                </h2>
                <button onClick={() => setViewingPayment(null)} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status & Basic Info */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className={getStatusConfig(viewingPayment.status).color + ' text-lg'}>
                      {getStatusConfig(viewingPayment.status).label}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">Submitted: {format(new Date(viewingPayment.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusConfig(viewingPayment.status).actions.includes('verify') && (
                      <button
                        onClick={() => handleVerify(viewingPayment)}
                        className="btn-success text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Verify
                      </button>
                    )}
                    {getStatusConfig(viewingPayment.status).actions.includes('reject') && (
                      <button
                        onClick={() => handleReject(viewingPayment)}
                        className="btn-danger text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    )}
                  </div>
                </div>

                {/* Payment Screenshot */}
                {viewingPayment.screenshot && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Image className="w-5 h-5 text-primary-600" />
                      Payment Screenshot
                    </h4>
                    <div className="bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={viewingPayment.screenshot}
                        alt="UPI Payment Screenshot"
                        className="w-full max-h-96 object-contain"
                      />
                    </div>
                    <div className="flex gap-3 mt-3">
                      <a
                        href={viewingPayment.screenshot}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                      <a
                        href={viewingPayment.screenshot}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Open Full Size
                      </a>
                    </div>
                  </div>
                )}

                {/* Payment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary-600" />
                      Payment Information
                    </h4>
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Amount</dt>
                        <dd className="font-bold text-lg text-gray-900">{formatAmount(viewingPayment.amount)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Payment Method</dt>
                        <dd className="capitalize">{viewingPayment.paymentMethod || 'UPI'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Transaction ID</dt>
                        <dd className="font-mono text-xs">{viewingPayment.transactionId || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">UPI ID</dt>
                        <dd className="truncate max-w-xs">{viewingPayment.upiId || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Status</dt>
                        <dd><span className={getStatusConfig(viewingPayment.status).color}>{getStatusConfig(viewingPayment.status).label}</span></dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Submitted At</dt>
                        <dd>{format(new Date(viewingPayment.createdAt), 'dd MMM yyyy, hh:mm a')}</dd>
                      </div>
                      {viewingPayment.verifiedAt && (
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Verified At</dt>
                          <dd>{format(new Date(viewingPayment.verifiedAt), 'dd MMM yyyy, hh:mm a')}</dd>
                        </div>
                      )}
                      {viewingPayment.verifiedBy && (
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Verified By</dt>
                          <dd>{viewingPayment.verifiedBy}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary-600" />
                      Booking Details
                    </h4>
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Booking ID</dt>
                        <dd className="font-mono text-xs">{viewingPayment.bookingId?._id || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Booking Number</dt>
                        <dd className="font-medium">#{viewingPayment.bookingId?.bookingNumber || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Lodge</dt>
                        <dd>{viewingPayment.bookingId?.lodgeName || viewingPayment.lodgeName || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Check-in</dt>
                        <dd>{viewingPayment.bookingId?.checkIn ? format(new Date(viewingPayment.bookingId.checkIn), 'dd MMM yyyy') : 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Check-out</dt>
                        <dd>{viewingPayment.bookingId?.checkOut ? format(new Date(viewingPayment.bookingId.checkOut), 'dd MMM yyyy') : 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Total Nights</dt>
                        <dd>{viewingPayment.bookingId?.nights || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Guests</dt>
                        <dd>{viewingPayment.bookingId?.guests || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Booking Status</dt>
                        <dd><span className="badge badge-info capitalize">{viewingPayment.bookingId?.status || 'N/A'}</span></dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary-600" />
                    Customer Information
                  </h4>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Name</dt>
                      <dd className="font-medium">{viewingPayment.bookingId?.customerName || viewingPayment.customerName || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Phone</dt>
                      <dd>{viewingPayment.bookingId?.customerPhone || viewingPayment.customerPhone || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Email</dt>
                      <dd>{viewingPayment.bookingId?.customerEmail || viewingPayment.customerEmail || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Admin Notes */}
                {(viewingPayment.verificationNotes || viewingPayment.rejectionReason) && (
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Admin Notes</h4>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      {viewingPayment.verificationNotes && (
                        <div className="mb-3">
                          <p className="text-xs text-green-700 font-medium mb-1">Verification Notes</p>
                          <p className="text-gray-700">{viewingPayment.verificationNotes}</p>
                        </div>
                      )}
                      {viewingPayment.rejectionReason && (
                        <div>
                          <p className="text-xs text-red-700 font-medium mb-1">Rejection Reason</p>
                          <p className="text-gray-700">{viewingPayment.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex justify-end">
                <button onClick={() => setViewingPayment(null)} className="btn-secondary">
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