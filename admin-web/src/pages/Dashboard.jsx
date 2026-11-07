import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Building2,
  Users,
  CreditCard,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  XCircle,
  Building,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';

const statCards = [
  {
    name: 'Total Lodges',
    key: 'totalLodges',
    icon: Building2,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    name: 'Pending Approval',
    key: 'pendingLodges',
    icon: AlertCircle,
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
  },
  {
    name: 'Total Owners',
    key: 'totalOwners',
    icon: Users,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
  },
  {
    name: 'Total Customers',
    key: 'totalCustomers',
    icon: Users,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    name: 'Total Bookings',
    key: 'totalBookings',
    icon: Clock,
    color: 'bg-indigo-500',
    bgColor: 'bg-indigo-50',
  },
  {
    name: 'Pending Payments',
    key: 'pendingPayments',
    icon: CreditCard,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
  },
  {
    name: 'Total Revenue',
    key: 'totalRevenue',
    icon: TrendingUp,
    color: 'bg-teal-500',
    bgColor: 'bg-teal-50',
  },
  {
    name: 'Platform Commission',
    key: 'totalCommission',
    icon: CreditCard,
    color: 'bg-pink-500',
    bgColor: 'bg-pink-50',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [recentLodges, setRecentLodges] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, lodgesRes, paymentsRes] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/admin/lodges?status=pending_approval&limit=5'),
        api.get('/admin/payments?status=pending_verification&limit=5'),
      ]);

      setStats(statsRes.data.data || {});
      setRecentLodges(lodgesRes.data.data?.lodges || []);
      setRecentPayments(paymentsRes.data.data?.payments || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.fullName?.split(' ')[0] || 'Admin'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's an overview of the platform.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {statCards.map((stat) => (
          <div key={stat.key} className="card">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{stat.name}</p>
                  {stat.key === 'totalRevenue' || stat.key === 'totalCommission' ? (
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ₹{(stats[stat.key] || 0).toLocaleString('en-IN')}
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {(stats[stat.key] || 0).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lodges Pending Approval */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Lodges Pending Approval
            </h3>
            <a href="/lodge-approvals" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="card-body p-0">
            {recentLodges.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-2" />
                <p>No lodges pending approval</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentLodges.map((lodge) => (
                  <li key={lodge._id} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{lodge.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {lodge.address?.city}, {lodge.address?.state} • Owner: {lodge.ownerName || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-400">
                            Submitted: {format(new Date(lodge.createdAt), 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={`/lodge-approvals?id=${lodge._id}`}
                          className="btn-primary text-sm px-3 py-1.5"
                        >
                          Review
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Payments Pending Verification */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-600" />
              Payments Pending Verification
            </h3>
            <a href="/payment-verification" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="card-body p-0">
            {recentPayments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-2" />
                <p>No payments pending verification</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentPayments.map((payment) => (
                  <li key={payment._id} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {payment.bookingId?.customerName || payment.customerName || 'Unknown Guest'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {payment.lodgeName || payment.lodgeId?.name || 'Unknown Lodge'} • ₹{payment.amount?.toLocaleString('en-IN') || '0'}
                          </p>
                          <p className="text-xs text-gray-400">
                            Submitted: {format(new Date(payment.createdAt), 'dd MMM yyyy, hh:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={`/payment-verification?id=${payment._id}`}
                          className="btn-primary text-sm px-3 py-1.5"
                        >
                          Verify
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Platform Health</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-500">Active Lodges</p>
                <p className="text-2xl font-bold text-green-700 mt-1">{stats.approvedLodges || 0}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.pendingLodges || 0}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-700 mt-1">{stats.rejectedLodges || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Suspended</p>
                <p className="text-2xl font-bold text-gray-700 mt-1">{stats.suspendedLodges || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="card-body space-y-2">
            <a href="/lodge-approvals" className="btn-outline w-full justify-start gap-3">
              <Building2 className="w-5 h-5" />
              Review Lodges
            </a>
            <a href="/payment-verification" className="btn-outline w-full justify-start gap-3">
              <CreditCard className="w-5 h-5" />
              Verify Payments
            </a>
            <a href="/users" className="btn-outline w-full justify-start gap-3">
              <Users className="w-5 h-5" />
              Manage Users
            </a>
            <a href="/settings" className="btn-outline w-full justify-start gap-3">
              <Settings className="w-5 h-5" />
              Platform Settings
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}