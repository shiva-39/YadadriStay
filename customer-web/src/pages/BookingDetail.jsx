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

export default function BookingDetail() {
  const { isAuthenticated } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      loadBooking()
    }
  }, [isAuthenticated])

  const loadBooking = async () => {
    setLoading(true)
    try {
      const response = await bookingsAPI.getById('demo')
      setBooking(response.data.data)
    } catch (error) {
      console.error('Failed to load booking:', error)
      toast.error('Failed to load booking details')
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
          <p className="text-gray-600 mb-6">You need to be logged in to view booking details</p>
          <Link to="/login" className="btn-primary inline-block">Login / Sign Up</Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        <div className="max-w-3xl mx-auto">
          <Link to="/bookings" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
            ← Back to Bookings
          </Link>

          <div className="card overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                  Demo Booking
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="border-b border-gray-100 pb-6">
                <h3 className="section-title mb-4">Booking Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Booking ID</p>
                    <p className="font-semibold">BK-DEMO-12345</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      Confirmed
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Check-in</p>
                    <p className="font-semibold">Nov 20, 2026</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Check-out</p>
                    <p className="font-semibold">Nov 22, 2026</p>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-100 pb-6">
                <h3 className="section-title mb-4">Lodge & Room</h3>
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                    🏨
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Sri Lakshmi Narasimha Nilayam</h4>
                    <p className="text-gray-500 text-sm">AC Deluxe Double Room</p>
                    <p className="text-gray-500 text-sm mt-1">Yadadri, Telangana</p>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-100 pb-6">
                <h3 className="section-title mb-4">Guest Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Guest Name</p>
                    <p className="font-semibold">Priya Sharma</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-semibold">9876543211</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold">priya@example.com</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Guests</p>
                    <p className="font-semibold">2 Adults</p>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-100 pb-6">
                <h3 className="section-title mb-4">Payment Summary</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Room Charges (2 nights)</span>
                    <span>₹5,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (18%)</span>
                    <span>₹990</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Advance Paid (20%)</span>
                    <span>₹1,298</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Balance Due</span>
                    <span>₹5,192</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹6,490</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Link to="/payment/demo" className="btn-primary flex-1 text-center">
                  Pay Balance
                </Link>
                <Link to="/bookings" className="btn-outline flex-1 text-center">
                  Back to Bookings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

