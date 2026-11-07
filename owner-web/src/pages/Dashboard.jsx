import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Building2,
  DoorOpen,
  Users,
  CalendarDays,
  TrendingUp,
  Clock,
  CreditCard,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const statCards = [
  {
    name: 'Total Room Categories',
    key: 'totalRoomCategories',
    icon: DoorOpen,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    name: 'Total Rooms',
    key: 'totalRooms',
    icon: Building2,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
  },
  {
    name: "Today's Arrivals",
    key: 'todaysArrivals',
    icon: CalendarDays,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
  },
  {
    name: 'Upcoming (7 days)',
    key: 'upcomingReservations',
    icon: Clock,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    name: 'Available Rooms',
    key: 'availableRooms',
    icon: DoorOpen,
    color: 'bg-teal-500',
    bgColor: 'bg-teal-50',
  },
  {
    name: 'Occupied Rooms',
    key: 'occupiedRooms',
    icon: Users,
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
  },
  {
    name: 'Pending Verification',
    key: 'pendingPaymentVerification',
    icon: AlertCircle,
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
  },
  {
    name: 'Online Bookings',
    key: 'onlineBookingCount',
    icon: CreditCard,
    color: 'bg-indigo-500',
    bgColor: 'bg-indigo-50',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState([]);
  const [lodges, setLodges] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, bookingsRes, lodgesRes] = await Promise.all([
        api.get('/lodge-owner/dashboard-stats'),
        api.get('/bookings?limit=5&sort=-createdAt'),
        api.get('/lodges?isActive=true'),
      ]);

      setStats(statsRes.data.data || {});
      setRecentBookings(bookingsRes.data.data?.bookings || []);
      setLodges(lodgesRes.data.data?.lodges || []);
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

  const totalRevenue = stats.totalRevenue || 0;
  const pendingSettlement = stats.pendingSettlementAmount || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.fullName?.split(' ')[0] || 'Owner'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your properties today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input-field w-auto"
            defaultValue={lodges[0]?._id || ''}
          >
            {lodges.map((lodge) => (
              <option key={lodge._id} value={lodge._id}>
                {lodge.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-primary-600" />
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Settlement</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ₹{pendingSettlement.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="w-16 h-16 bg-yellow-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>
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
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats[stat.key] ?? 0}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="space-y-2">
            <a
              href="/room-categories"
              className="btn-outline w-full justify-start gap-3"
            >
              <DoorOpen className="w-5 h-5" />
              Manage Room Categories
            </a>
            <a
              href="/inventory"
              className="btn-outline w-full justify-start gap-3"
            >
              <CalendarDays className="w-5 h-5" />
              Update Inventory
            </a>
            <a
              href="/offline-bookings"
              className="btn-outline w-full justify-start gap-3"
            >
              <Users className="w-5 h-5" />
              Add Offline Booking
            </a>
            <a
              href="/bookings"
              className="btn-outline w-full justify-start gap-3"
            >
              <CreditCard className="w-5 h-5" />
              View All Bookings
            </a>
          </div>

          {/* Property Summary */}
          <div className="card mt-4">
            <div className="card-header">
              <h3 className="font-semibold text-gray-900">Your Properties</h3>
            </div>
            <div className="card-body p-0">
              {lodges.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>No properties added yet</p>
                  <a href="/property-profile" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
                    Add your first property
                  </a>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {lodges.map((lodge) => (
                    <li key={lodge._id} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{lodge.name}</p>
                            <p className="text-xs text-gray-500">
                              {lodge.address?.city}, {lodge.address?.state}
                            </p>
                          </div>
                        </div>
                        <span className={`badge ${lodge.status === 'approved' ? 'badge-success' : 'badge-gray'}`}>
                          {lodge.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
              <a href="/bookings" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            <div className="card-body p-0">
              {recentBookings.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>No recent bookings</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recentBookings.map((booking) => (
                        <tr key={booking._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {booking.bookingNumber || booking._id.toString().slice(-8).toUpperCase()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {booking.customerName || booking.customer?.fullName || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {booking.roomCategoryName || booking.roomCategory?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString('en-IN') : 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${
                              booking.status === 'confirmed' ? 'badge-success' :
                              booking.status === 'pending_payment' ? 'badge-warning' :
                              booking.status === 'pending_verification' ? 'badge-info' :
                              booking.status === 'completed' ? 'badge-gray' :
                              'badge-danger'
                            }`}>
                              {booking.status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            ₹{booking.totalAmount?.toLocaleString('en-IN') || '0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}