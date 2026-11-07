import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  Users as UsersIcon,
  User,
  Shield,
  Building2,
  Mail,
  Phone,
  MapPin,
  MoreHorizontal,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  XCircle,
  Lock,
  Unlock,
  Trash2,
  Edit,
  Eye,
  Plus,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'lodge_owner', label: 'Lodge Owner' },
  { value: 'customer', label: 'Customer' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending_verification', label: 'Pending Verification' },
];

export default function Users() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [viewingUser, setViewingUser] = useState(null);
  const [updatingUser, setUpdatingUser] = useState({});

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter, statusFilter, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 20,
        page,
        sort: '-createdAt',
      };
      if (searchQuery) params.search = searchQuery;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await api.get('/admin/users', { params });
      setUsersList(response.data.data?.users || []);
      setTotalPages(response.data.data?.totalPages || 1);
      setTotalUsers(response.data.data?.total || 0);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (userId, newStatus) => {
    setUpdatingUser(prev => ({ ...prev, [userId]: true }));
    try {
      await api.patch(`/admin/users/${userId}/status`, {
        status: newStatus,
        updatedBy: user._id,
      });
      toast.success(`User status updated to ${newStatus}!`);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error('Failed to update user status');
    } finally {
      setUpdatingUser(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleRoleUpdate = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    setUpdatingUser(prev => ({ ...prev, [userId]: true }));
    try {
      await api.patch(`/admin/users/${userId}/role`, {
        role: newRole,
        updatedBy: user._id,
      });
      toast.success(`User role updated to ${newRole}!`);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast.error('Failed to update user role');
    } finally {
      setUpdatingUser(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDelete = async (targetUser) => {
    if (!window.confirm(`Are you sure you want to delete ${targetUser.fullName}? This action cannot be undone.`)) return;
    setUpdatingUser(prev => ({ ...prev, [targetUser._id]: true }));
    try {
      await api.delete(`/admin/users/${targetUser._id}`);
      toast.success('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user');
    } finally {
      setUpdatingUser(prev => ({ ...prev, [targetUser._id]: false }));
    }
  };

  const handleSuspend = (targetUser) => {
    const reason = window.prompt('Suspension reason (required):');
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('Suspension reason is required');
      return;
    }
    handleStatusUpdate(targetUser._id, 'suspended');
  };

  const handleActivate = (targetUser) => {
    if (!window.confirm('Are you sure you want to activate this user?')) return;
    handleStatusUpdate(targetUser._id, 'active');
  };

  const getRoleConfig = (role) => {
    const configs = {
      super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700', icon: Shield },
      lodge_owner: { label: 'Lodge Owner', color: 'bg-blue-100 text-blue-700', icon: Building2 },
      customer: { label: 'Customer', color: 'bg-green-100 text-green-700', icon: User },
    };
    const config = configs[role] || { label: role, color: 'bg-gray-100 text-gray-700', icon: User };
    return { ...config, Icon: config.icon };
  };

  const getStatusConfig = (status) => {
    const configs = {
      active: { label: 'Active', color: 'badge-success', actions: ['suspend', 'deactivate'] },
      inactive: { label: 'Inactive', color: 'badge-gray', actions: ['activate'] },
      suspended: { label: 'Suspended', color: 'badge-danger', actions: ['activate'] },
      pending_verification: { label: 'Pending Verification', color: 'badge-warning', actions: ['activate', 'suspend'] },
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
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage platform users and their roles</p>
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
                placeholder="Search by name, phone, email..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="input-field pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="input-field w-auto"
            >
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
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

      {/* Users Table */}
      <div className="card">
        <div className="card-body p-0">
          {usersList.length === 0 ? (
            <div className="p-12 text-center">
              <UsersIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">No users match your current filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {usersList.map((targetUser) => {
                      const roleConfig = getRoleConfig(targetUser.role);
                      const statusConfig = getStatusConfig(targetUser.status);
                      const isUpdating = updatingUser[targetUser._id];
                      const RoleIcon = roleConfig.Icon;

                      return (
                        <tr key={targetUser._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                {targetUser.avatar ? (
                                  <img src={targetUser.avatar} alt={targetUser.fullName} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <RoleIcon className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{targetUser.fullName}</p>
                                <p className="text-xs text-gray-500 font-mono">{targetUser._id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`badge ${roleConfig.color} flex items-center gap-1`}>
                              <RoleIcon className="w-3.5 h-3.5" />
                              {roleConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <p>{targetUser.phone}</p>
                            {targetUser.email && <p className="text-xs text-gray-500">{targetUser.email}</p>}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {format(new Date(targetUser.createdAt), 'dd MMM yyyy')}
                          </td>
                          <td className="px-6 py-4">
                            <span className={statusConfig.color}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {targetUser.role === 'lodge_owner' ? (
                              <>
                                <p>{targetUser.lodgeCount || 0} lodges</p>
                                <p className="text-xs text-gray-500">{targetUser.totalBookings || 0} total bookings</p>
                              </>
                            ) : targetUser.role === 'customer' ? (
                              <>
                                <p>{targetUser.totalBookings || 0} bookings</p>
                                <p className="text-xs text-gray-500">₹{targetUser.totalSpent || 0} spent</p>
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setViewingUser(targetUser)}
                                disabled={isUpdating}
                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                                aria-label="View user details"
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

                                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                  <button
                                    onClick={() => setViewingUser(targetUser)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View Details
                                  </button>
                                  <hr className="my-1 border-gray-100" />
                                  {targetUser.role !== 'super_admin' && (
                                    <>
                                      <div className="px-4 py-1">
                                        <p className="text-xs text-gray-500">Change Role</p>
                                      </div>
                                      {targetUser.role !== 'super_admin' && (
                                        <button
                                          onClick={() => handleRoleUpdate(targetUser._id, 'super_admin')}
                                          disabled={isUpdating || targetUser.role === 'super_admin'}
                                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
                                        >
                                          <Shield className="w-4 h-4" />
                                          Make Super Admin
                                        </button>
                                      )}
                                      {targetUser.role !== 'lodge_owner' && (
                                        <button
                                          onClick={() => handleRoleUpdate(targetUser._id, 'lodge_owner')}
                                          disabled={isUpdating || targetUser.role === 'lodge_owner'}
                                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                                        >
                                          <Building2 className="w-4 h-4" />
                                          Make Lodge Owner
                                        </button>
                                      )}
                                      {targetUser.role !== 'customer' && (
                                        <button
                                          onClick={() => handleRoleUpdate(targetUser._id, 'customer')}
                                          disabled={isUpdating || targetUser.role === 'customer'}
                                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                        >
                                          <User className="w-4 h-4" />
                                          Make Customer
                                        </button>
                                      )}
                                      <hr className="my-1 border-gray-100" />
                                    </>
                                  )}
                                  {statusConfig.actions.includes('activate') && (
                                    <button
                                      onClick={() => handleActivate(targetUser)}
                                      disabled={isUpdating}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                    >
                                      <Unlock className="w-4 h-4" />
                                      Activate
                                    </button>
                                  )}
                                  {statusConfig.actions.includes('suspend') && (
                                    <button
                                      onClick={() => handleSuspend(targetUser)}
                                      disabled={isUpdating}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-orange-700 hover:bg-orange-50"
                                    >
                                      <Lock className="w-4 h-4" />
                                      Suspend
                                    </button>
                                  )}
                                  {statusConfig.actions.includes('deactivate') && (
                                    <button
                                      onClick={() => handleStatusUpdate(targetUser._id, 'inactive')}
                                      disabled={isUpdating}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Deactivate
                                    </button>
                                  )}
                                  {targetUser._id !== user._id && (
                                    <>
                                      <hr className="my-1 border-gray-100" />
                                      <button
                                        onClick={() => handleDelete(targetUser)}
                                        disabled={isUpdating}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Delete User
                                      </button>
                                    </>
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
                    Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalUsers)} of {totalUsers} users
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

      {/* View User Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setViewingUser(null)} aria-hidden="true" />
            <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 id="user-modal-title" className="text-xl font-semibold text-gray-900">
                  User Details: {viewingUser.fullName}
                </h2>
                <button onClick={() => setViewingUser(null)} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      {viewingUser.avatar ? (
                        <img src={viewingUser.avatar} alt={viewingUser.fullName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <RoleIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{viewingUser.fullName}</h3>
                      <p className="text-gray-500">{viewingUser.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${roleConfig.color} text-base`}>
                      <RoleIcon className="w-4 h-4" />
                      {roleConfig.label}
                    </span>
                    <span className={statusConfig.color + ' text-base'}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary-600" />
                      Personal Information
                    </h4>
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Full Name</dt>
                        <dd className="font-medium">{viewingUser.fullName}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Phone</dt>
                        <dd>{viewingUser.phone}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Email</dt>
                        <dd>{viewingUser.email || 'Not provided'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">User ID</dt>
                        <dd className="font-mono text-xs">{viewingUser._id}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Role</dt>
                        <dd><span className={`badge ${roleConfig.color}`}>{roleConfig.label}</span></dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Status</dt>
                        <dd><span className={statusConfig.color}>{statusConfig.label}</span></dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Email Verified</dt>
                        <dd>{viewingUser.isEmailVerified ? 'Yes' : 'No'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Phone Verified</dt>
                        <dd>{viewingUser.isPhoneVerified ? 'Yes' : 'No'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Registered</dt>
                        <dd>{format(new Date(viewingUser.createdAt), 'dd MMM yyyy, hh:mm a')}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Last Login</dt>
                        <dd>{viewingUser.lastLogin ? format(new Date(viewingUser.lastLogin), 'dd MMM yyyy, hh:mm a') : 'Never'}</dd>
                      </div>
                    </dl>
                  </div>

                  {viewingUser.role === 'lodge_owner' && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary-600" />
                        Lodge Owner Details
                      </h4>
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Business Name</dt>
                          <dd className="font-medium">{viewingUser.businessName || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">GST Number</dt>
                          <dd className="font-mono">{viewingUser.gstNumber || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">PAN Number</dt>
                          <dd className="font-mono">{viewingUser.panNumber || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">UPI ID</dt>
                          <dd>{viewingUser.upiId || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Bank Name</dt>
                          <dd>{viewingUser.bankName || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Account Number</dt>
                          <dd className="font-mono">{viewingUser.accountNumber || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">IFSC Code</dt>
                          <dd className="font-mono">{viewingUser.ifscCode || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Commission Rate</dt>
                          <dd>{viewingUser.commissionRate || 10}%</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Total Lodges</dt>
                          <dd>{viewingUser.lodgeCount || 0}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Approved Lodges</dt>
                          <dd>{viewingUser.approvedLodgeCount || 0}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Pending Lodges</dt>
                          <dd>{viewingUser.pendingLodgeCount || 0}</dd>
                        </div>
                      </dl>
                    </div>
                  )}

                  {viewingUser.role === 'customer' && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <User className="w-5 h-5 text-primary-600" />
                        Customer Activity
                      </h4>
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Total Bookings</dt>
                          <dd className="font-medium">{viewingUser.totalBookings || 0}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Completed Stays</dt>
                          <dd>{viewingUser.completedBookings || 0}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Cancelled Bookings</dt>
                          <dd>{viewingUser.cancelledBookings || 0}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Total Spent</dt>
                          <dd className="font-medium">₹{new Intl.NumberFormat('en-IN').format(viewingUser.totalSpent || 0)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Favorite Lodges</dt>
                          <dd>{viewingUser.favoriteLodges?.length || 0}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Reviews Written</dt>
                          <dd>{viewingUser.reviewsCount || 0}</dd>
                        </div>
                      </dl>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary-600" />
                      Security & Preferences
                    </h4>
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">2FA Enabled</dt>
                        <dd>{viewingUser.twoFactorEnabled ? 'Yes' : 'No'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Preferred Language</dt>
                        <dd>{viewingUser.preferredLanguage || 'en'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Currency</dt>
                        <dd>{viewingUser.currency || 'INR'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Notifications</dt>
                        <dd>{viewingUser.notificationsEnabled ? 'Enabled' : 'Disabled'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-100 pt-4 flex flex-wrap gap-3">
                  {viewingUser._id !== user._id && (
                    <>
                      <button
                        onClick={() => handleActivate(viewingUser)}
                        disabled={updatingUser[viewingUser._id] || viewingUser.status === 'active'}
                        className="btn-success"
                      >
                        <Unlock className="w-4 h-4" />
                        Activate
                      </button>
                      <button
                        onClick={() => handleSuspend(viewingUser)}
                        disabled={updatingUser[viewingUser._id] || viewingUser.status === 'suspended'}
                        className="btn-warning"
                      >
                        <Lock className="w-4 h-4" />
                        Suspend
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(viewingUser._id, 'inactive')}
                        disabled={updatingUser[viewingUser._id] || viewingUser.status === 'inactive'}
                        className="btn-secondary"
                      >
                        <XCircle className="w-4 h-4" />
                        Deactivate
                      </button>
                      <button
                        onClick={() => handleDelete(viewingUser)}
                        disabled={updatingUser[viewingUser._id]}
                        className="btn-danger"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete User
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex justify-end">
                <button onClick={() => setViewingUser(null)} className="btn-secondary">
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