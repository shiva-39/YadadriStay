import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Calendar, MapPin, Heart, Loader2, CreditCard, Shield, Truck, Mail, Users } from 'lucide-react'
import { bookingsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function BookingConfirmation() {
  const { bookingId } = useParams()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated && bookingId) {
      loadBooking()
    }
  }, [isAuthenticated, bookingId])

  const loadBooking = async () => {
    setLoading(true)
    try {
      const response = await bookingsAPI.getById(bookingId)
      setBooking(response.data.data)
    } catch (error) {
      console.error('Failed to load booking:', error)
      toast.error('Failed to load booking')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Login</h2>
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

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <Link to="/bookings" className="btn-primary inline-block">My Bookings</Link>
        </div>
      </div>
    )
  }

  const formatDateShort = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const statusColors = {
    pending_payment: 'bg-yellow-100 text-yellow-800',
    pending_verification: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    checked_in: 'bg-purple-100 text-purple-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-orange-100 text-orange-800',
  }

  const statusLabels = {
    pending_payment: 'Pending Payment',
    pending_verification: 'Pending Verification',
    confirmed: 'Confirmed',
    checked_in: 'Checked In',
    completed: 'Completed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-8 mb-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-green-100 text-lg">Your stay at {booking.lodge?.name || 'the lodge'} is booked</p>
            <div className="mt-6 inline-flex items-center gap-4 bg-white/20 rounded-xl px-6 py-3">
              <span className="font-bold text-lg">{booking.bookingId || booking.bookingId || 'BK-' + bookingId}</span>
            </div>
          </div>

          {/* Booking Summary Card */}
          <div className="card overflow-hidden mb-6">
            <div className="relative h-48">
              {booking.lodge?.images?.[0]?.url ? (
                <img src={booking.lodge?.images[0].url} alt={booking.lodge?.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-6xl" role="img" aria-label="Lodge">🏨</span>
                </div>
              )}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 max-w-md mx-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Check-in</p>
                      <p className="font-semibold text-lg">{formatDate(booking.checkInDate)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Nights</p>
                      <p className="font-semibold text-lg">{booking.nights || 1} Night{booking.nights > 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Check-out</p>
                      <p className="font-semibold text-lg">{formatDate(booking.checkOutDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{booking.lodge?.name || 'Lodge'}</h3>
                <p className="text-gray-500 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {booking.lodge?.address?.city}, {booking.lodge?.address?.state}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                    {statusLabels[booking.status] || booking.status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {booking.guests} Guest{booking.guests > 1 ? 's' : ''} • {booking.rooms} Room{booking.rooms > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Room Details */}
            <div className="card p-6 mb-6">
              <h3 className="section-title mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Room Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🛏️</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Room Type</p>
                    <p className="font-semibold">{booking.roomCategory?.name || booking.roomCategoryName || 'Standard Room'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Guests</p>
                    <p className="font-semibold">{booking.guests} Guest{booking.guests > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Stay Duration</p>
                    <p className="font-semibold">{booking.nights || 1} Night{booking.nights > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Status</p>
                    <p className="font-semibold capitalize">{booking.payment?.status || 'Pending'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="card p-6 mb-6">
              <h3 className="section-title mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Price Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room Charges ({booking.nights || 1} night{booking.nights > 1 ? 's' : ''})</span>
                  <span className="font-semibold">{formatCurrency(booking.pricing?.totalRoomCharges || booking.pricing?.totalAmount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({booking.pricing?.taxPercentage || 18}%)</span>
                  <span className="font-semibold">{formatCurrency(booking.pricing?.taxAmount || 0)}</span>
                </div>
                {booking.pricing?.serviceChargeAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Charge</span>
                    <span className="font-semibold">{formatCurrency(booking.pricing.serviceChargeAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Advance Paid ({booking.pricing?.advancePercentage || 20}%)</span>
                  <span className="font-semibold text-green-600">{formatCurrency(booking.pricing?.advanceAmount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Balance Due</span>
                  <span className="font-semibold text-primary">{formatCurrency(booking.pricing?.balanceAmount || 0)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(booking.pricing?.totalAmount || 0)}</span>
                </div>
              </div>
            </div>

            {/* Important Info */}
            <div className="card p-6 mb-6 bg-blue-50 border-blue-100">
              <h3 className="section-title mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Important Information
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Carry a valid government ID proof (Aadhaar/PAN/Driving License) at check-in</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Balance payment to be made at the lodge during check-in/check-out</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Cancellation policy: {booking.lodge?.policies?.cancellationPolicy || 'Moderate'} - check lodge policies for details</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Check-in: {booking.lodge?.policies?.checkInTime || '12:00 PM'} | Check-out: {booking.lodge?.policies?.checkOutTime || '11:00 AM'}</span>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="card p-6 mb-6">
              <h3 className="section-title mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                Need Help?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <Link href="tel:+919876543210" className="p-4 bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors">
                  <Truck className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="font-semibold">Call Support</p>
                  <p className="text-sm text-gray-600">+91 98765 43210</p>
                </Link>
                <Link href="mailto:support@yadadristay.com" className="p-4 bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors">
                  <Mail className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="font-semibold">Email Support</p>
                  <p className="text-sm text-gray-600">support@yadadristay.com</p>
                </Link>
                <Link to="/bookings" className="p-4 bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors">
                  <Heart className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="font-semibold">My Bookings</p>
                  <p className="text-sm text-gray-600">View all bookings</p>
                </Link>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Link to="/bookings" className="btn-outline flex-1 text-center">
                View All Bookings
              </Link>
              <Link to="/search" className="btn-primary flex-1 text-center">
                Book Another Stay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

