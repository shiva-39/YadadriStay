import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  Building2,
  MapPin,
  Phone,
  Mail,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Image,
  FileText,
  Shield,
  Clock,
  MapPin as MapPinIcon,
  Star,
  MoreHorizontal,
  Check,
  X,
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'deactivated', label: 'Deactivated' },
  { value: 'draft', label: 'Draft' },
];

export default function LodgeApprovals() {
  const { user } = useAuth();
  const [lodges, setLodges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLodges, setTotalLodges] = useState(0);
  const [viewingLodge, setViewingLodge] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});

  useEffect(() => {
    fetchLodges();
  }, [searchQuery, statusFilter, page]);

  const fetchLodges = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 20,
        page,
        sort: '-createdAt',
      };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;

      const response = await api.get('/admin/lodges', { params });
      setLodges(response.data.data?.lodges || []);
      setTotalPages(response.data.data?.totalPages || 1);
      setTotalLodges(response.data.data?.total || 0);
    } catch (error) {
      console.error('Failed to fetch lodges:', error);
      toast.error('Failed to load lodges');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (lodgeId, newStatus, notes = '') => {
    setUpdatingStatus(prev => ({ ...prev, [lodgeId]: true }));
    try {
      await api.patch(`/admin/lodges/${lodgeId}/status`, {
        status: newStatus,
        notes,
        reviewedBy: user._id,
      });
      toast.success(`Lodge ${newStatus.replace('_', ' ')} successfully!`);
      fetchLodges();
    } catch (error) {
      console.error('Failed to update lodge status:', error);
      toast.error('Failed to update lodge status');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [lodgeId]: false }));
    }
  };

  const handleApprove = (lodge) => {
    const notes = window.prompt('Approval notes (optional):') || '';
    handleStatusUpdate(lodge._id, 'approved', notes);
  };

  const handleReject = (lodge) => {
    const reason = window.prompt('Rejection reason (required):');
    if (reason === null) return; // User cancelled
    if (!reason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    handleStatusUpdate(lodge._id, 'rejected', reason);
  };

  const handleSuspend = (lodge) => {
    const reason = window.prompt('Suspension reason (required):');
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('Suspension reason is required');
      return;
    }
    handleStatusUpdate(lodge._id, 'suspended', reason);
  };

  const handleActivate = (lodge) => {
    if (!window.confirm('Are you sure you want to activate this lodge?')) return;
    handleStatusUpdate(lodge._id, 'approved');
  };

  const getStatusConfig = (status) => {
    const configs = {
      draft: { label: 'Draft', color: 'badge-gray', actions: [] },
      pending_approval: { label: 'Pending Approval', color: 'badge-warning', actions: ['approve', 'reject'] },
      approved: { label: 'Approved', color: 'badge-success', actions: ['suspend'] },
      rejected: { label: 'Rejected', color: 'badge-danger', actions: ['approve'] },
      suspended: { label: 'Suspended', color: 'badge-danger', actions: ['activate'] },
      deactivated: { label: 'Deactivated', color: 'badge-gray', actions: ['activate'] },
    };
    return configs[status] || { label: status, color: 'badge-gray', actions: [] };
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
          <h1 className="text-2xl font-bold text-gray-900">Lodge Approvals</h1>
          <p className="text-gray-600 mt-1">Review and approve lodge registrations</p>
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
                placeholder="Search by name, owner, city..."
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
          </div>
        </div>
      </div>

      {/* Lodges Table */}
      <div className="card">
        <div className="card-body p-0">
          {lodges.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No lodges found</h3>
              <p className="text-gray-500">No lodges match your current filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lodge</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rooms</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lodges.map((lodge) => {
                      const statusConfig = getStatusConfig(lodge.status);
                      const isUpdating = updatingStatus[lodge._id];

                      return (
                        <tr key={lodge._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                {lodge.images?.[0]?.url ? (
                                  <img
                                    src={lodge.images[0].url}
                                    alt={lodge.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Building2 className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{lodge.name}</p>
                                <p className="text-xs text-gray-500">{lodge.bookingCount || 0} bookings • {lodge.roomCount || 0} rooms</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{lodge.ownerName || 'Unknown'}</p>
                              <p className="text-sm text-gray-500">{lodge.ownerPhone || 'N/A'}</p>
                              {lodge.ownerEmail && <p className="text-xs text-gray-400">{lodge.ownerEmail}</p>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <div className="flex items-center gap-1">
                              <MapPinIcon className="w-3.5 h-3.5 text-gray-400" />
                              <span>{lodge.address?.city}, {lodge.address?.state}</span>
                            </div>
                            {lodge.address?.distanceFromTemple && (
                              <p className="text-xs text-gray-500 mt-1">
                                {lodge.address.distanceFromTemple}km from temple
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {lodge.totalRooms || 0} rooms ({lodge.roomCategories?.length || 0} categories)
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {format(new Date(lodge.createdAt), 'dd MMM yyyy')}
                          </td>
                          <td className="px-6 py-4">
                            <span className={statusConfig.color}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setViewingLodge(lodge)}
                                disabled={isUpdating}
                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                                aria-label="View lodge details"
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
                                  {statusConfig.actions.includes('approve') && (
                                    <button
                                      onClick={() => handleApprove(lodge)}
                                      disabled={isUpdating}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                    >
                                      <Check className="w-4 h-4" />
                                      Approve
                                    </button>
                                  )}
                                  {statusConfig.actions.includes('reject') && (
                                    <button
                                      onClick={() => handleReject(lodge)}
                                      disabled={isUpdating}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                    >
                                      <X className="w-4 h-4" />
                                      Reject
                                    </button>
                                  )}
                                  {statusConfig.actions.includes('suspend') && (
                                    <button
                                      onClick={() => handleSuspend(lodge)}
                                      disabled={isUpdating}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-orange-700 hover:bg-orange-50"
                                    >
                                      <AlertCircle className="w-4 h-4" />
                                      Suspend
                                    </button>
                                  )}
                                  {statusConfig.actions.includes('activate') && (
                                    <button
                                      onClick={() => handleActivate(lodge)}
                                      disabled={isUpdating}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                    >
                                      <Check className="w-4 h-4" />
                                      Activate
                                    </button>
                                  )}
                                  <hr className="my-1 border-gray-100" />
                                  <button
                                    onClick={() => setViewingLodge(lodge)}
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
                    Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalLodges)} of {totalLodges} lodges
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

      {/* View Lodge Modal */}
      {viewingLodge && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="view-modal-title">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setViewingLodge(null)} aria-hidden="true" />
            <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 id="view-modal-title" className="text-xl font-semibold text-gray-900">
                  Lodge Details: {viewingLodge.name}
                </h2>
                <button onClick={() => setViewingLodge(null)} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status & Basic Info */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className={getStatusConfig(viewingLodge.status).color + ' text-lg'}>
                      {getStatusConfig(viewingLodge.status).label}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">Submitted: {format(new Date(viewingLodge.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusConfig(viewingLodge.status).actions.includes('approve') && (
                      <button
                        onClick={() => handleApprove(viewingLodge)}
                        className="btn-success text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                    )}
                    {getStatusConfig(viewingLodge.status).actions.includes('reject') && (
                      <button
                        onClick={() => handleReject(viewingLodge)}
                        className="btn-danger text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    )}
                  </div>
                </div>

                {/* Images */}
                {viewingLodge.images?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Property Images</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {viewingLodge.images.slice(0, 8).map((img, index) => (
                        <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={img.url}
                            alt={img.caption || `Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary-600" />
                      Basic Information
                    </h4>
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Name</dt>
                        <dd className="font-medium">{viewingLodge.name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Short Description</dt>
                        <dd>{viewingLodge.shortDescription || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Description</dt>
                        <dd className="max-w-xs truncate">{viewingLodge.description || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Status</dt>
                        <dd><span className={getStatusConfig(viewingLodge.status).color}>{getStatusConfig(viewingLodge.status).label}</span></dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary-600" />
                      Address & Location
                    </h4>
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Street</dt>
                        <dd className="text-right max-w-xs truncate">{viewingLodge.address?.street || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">City</dt>
                        <dd>{viewingLodge.address?.city || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">State</dt>
                        <dd>{viewingLodge.address?.state || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Pincode</dt>
                        <dd>{viewingLodge.address?.pincode || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Landmark</dt>
                        <dd>{viewingLodge.address?.landmark || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Distance from Temple</dt>
                        <dd>{viewingLodge.address?.distanceFromTemple ? `${viewingLodge.address.distanceFromTemple} km` : 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Coordinates</dt>
                        <dd className="font-mono text-xs">{viewingLodge.address?.coordinates ? `${viewingLodge.address.coordinates[1]}, ${viewingLodge.address.coordinates[0]}` : 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Phone className="w-5 h-5 text-primary-600" />
                      Contact Information
                    </h4>
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Phone</dt>
                        <dd>{viewingLodge.contact?.phone || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Alternate Phone</dt>
                        <dd>{viewingLodge.contact?.alternatePhone || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Email</dt>
                        <dd>{viewingLodge.contact?.email || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">WhatsApp</dt>
                        <dd>{viewingLodge.contact?.whatsappNumber || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary-600" />
                      Policies & Pricing
                    </h4>
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Check-in Time</dt>
                        <dd>{viewingLodge.policies?.checkInTime || '12:00'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Check-out Time</dt>
                        <dd>{viewingLodge.policies?.checkOutTime || '11:00'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Cancellation Policy</dt>
                        <dd className="capitalize">{viewingLodge.policies?.cancellationPolicy || 'moderate'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Advance Payment</dt>
                        <dd>{viewingLodge.policies?.advancePaymentPercentage || 20}%</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Base Price</dt>
                        <dd>₹{viewingLodge.pricing?.basePrice?.toLocaleString('en-IN') || 0}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Tax</dt>
                        <dd>{viewingLodge.pricing?.taxPercentage || 18}%</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Service Charge</dt>
                        <dd>{viewingLodge.pricing?.serviceChargePercentage || 0}%</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Facilities */}
                {viewingLodge.facilities && Object.keys(viewingLodge.facilities).some(k => viewingLodge.facilities[k]) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Facilities</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(viewingLodge.facilities)
                        .filter(([_, v]) => v)
                        .map(([key]) => (
                          <span key={key} className="badge badge-info capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace('cctv', 'CCTV').replace('ac', 'AC')}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Owner Info */}
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary-600" />
                    Owner Information
                  </h4>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Business Name</dt>
                      <dd className="font-medium">{viewingLodge.ownerBusinessName || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">GST Number</dt>
                      <dd className="font-mono">{viewingLodge.ownerGST || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">PAN Number</dt>
                      <dd className="font-mono">{viewingLodge.ownerPAN || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">UPI ID</dt>
                      <dd>{viewingLodge.ownerUPI || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Bank</dt>
                      <dd>{viewingLodge.ownerBankName || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Account</dt>
                      <dd className="font-mono">{viewingLodge.ownerAccountNumber || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">IFSC</dt>
                      <dd className="font-mono">{viewingLodge.ownerIFSC || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Commission Rate</dt>
                      <dd>{viewingLodge.commissionRate || 10}%</dd>
                    </div>
                  </dl>
                </div>

                {/* Documents */}
                {viewingLodge.documents && Object.keys(viewingLodge.documents).some(k => viewingLodge.documents[k]) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Submitted Documents</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(viewingLodge.documents)
                        .filter(([_, v]) => v)
                        .map(([key, url]) => (
                          <a
                            key={key}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <FileText className="w-5 h-5 text-primary-600" />
                            <span className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          </a>
                        ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {(viewingLodge.approvalNotes || viewingLodge.rejectionReason) && (
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Admin Notes</h4>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      {viewingLodge.approvalNotes && (
                        <div className="mb-3">
                          <p className="text-xs text-green-700 font-medium mb-1">Approval Notes</p>
                          <p className="text-gray-700">{viewingLodge.approvalNotes}</p>
                        </div>
                      )}
                      {viewingLodge.rejectionReason && (
                        <div>
                          <p className="text-xs text-red-700 font-medium mb-1">Rejection Reason</p>
                          <p className="text-gray-700">{viewingLodge.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex justify-end">
                <button onClick={() => setViewingLodge(null)} className="btn-secondary">
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