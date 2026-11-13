import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Heart, AlertCircle, Loader2 } from 'lucide-react'
import { bookingsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  pending_verification: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  checked_in: 'bg-purple-100 text-purple-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-orange-100 text-orange-800',
}

const STATUS_LABELS = {
  pending_payment: 'Pending Payment',
  pending_verification: 'Pending Verification',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

export default function MyBookings() {
  const { isAuthenticated } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    if (isAuthenticated) {
      loadBookings()
    }
  }, [isAuthenticated])

  const loadBookings = async () => {
    setLoading(true)
    try {
      const response = await bookingsAPI.getMyBookings({ status: activeTab === 'upcoming' ? 'upcoming' : 'past' })
      setBookings(response.data.data.items || response.data.data.bookings || response.data.data || [])
    } catch (error) {
      console.error('Failed to load bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your bookings</p>
          <Link to="/login" className="btn-primary inline-block">Login / Sign Up</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="page-title">My Bookings</h1>
          <Link to="/search" className="btn-outline">Book Another Stay</Link>
        </div>

        <div className="flex gap-2 mb-6" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'upcoming'}
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'upcoming' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Upcoming
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'past'}
            onClick={() => setActiveTab('past')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'past' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Past Bookings
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="bg-gray-200 h-32 w-32 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <div className="bg-gray-200 h-6 w-3/4 rounded" />
                    <div className="bg-gray-200 h-4 w-1/2" />
                    <div className="bg-gray-200 h-4 w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {bookings.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl">📅</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {activeTab === 'upcoming' ? 'No Upcoming Bookings' : 'No Past Bookings'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {activeTab === 'upcoming' 
                    ? 'Start planning your next pilgrimage stay!' 
                    : 'Your completed stays will appear here'}
                </p>
                <Link to="/search" className="btn-primary inline-flex items-center gap-2">
                  <span>Search Lodges</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map(booking => (
                  <Link key={booking._id || booking.id} to={`/booking/${booking._id || booking.id}`} className="card p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="relative w-full md:w-32 h-32 md:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {booking.lodge?.images?.[0]?.url || booking.lodge?.images?.[0] ? (
                          <img src={booking.lodge?.images?.[0]?.url || booking.lodge?.images?.[0]} alt={booking.lodge?.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-4xl">🏨</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{booking.lodge?.name || 'Lodge'}</h3>
                            <p className="text-sm text-gray-500">{booking.roomCategory?.name || booking.roomCategoryName || 'Room'}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                            {STATUS_LABELS[booking.status] || booking.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {booking.checkInDate ? formatDate(booking.checkInDate) : '—'} – {booking.checkOutDate ? formatDate(booking.checkOutDate) : '—'}</span>
                          <span className="flex items-center gap-1">🛏️ {booking.rooms || 1} Room{booking.rooms > 1 ? 's' : ''}</span>
                          <span className="flex items-center gap-1">👥 {booking.guests || 1} Guest{booking.guests > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">₹{booking.pricing?.totalAmount || booking.totalAmount || 0}</p>
                            <p className="text-sm text-gray-500">Total</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

