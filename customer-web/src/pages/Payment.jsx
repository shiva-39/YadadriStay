import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { CreditCard, Loader2, CheckCircle, AlertCircle, Shield, Mail } from 'lucide-react'
import { bookingsAPI, paymentsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Payment() {
  const { bookingId } = useParams()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [payment, setPayment] = useState(null)
  const [booking, setBooking] = useState(null)
  const [formData, setFormData] = useState({
    upiId: '',
    transactionId: '',
    screenshot: null,
  })
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (isAuthenticated && bookingId) {
      loadPaymentData()
    }
  }, [isAuthenticated, bookingId])

  const loadPaymentData = async () => {
    try {
      const [bookingRes, paymentRes] = await Promise.all([
        bookingsAPI.getById(bookingId),
        paymentsAPI.getMyPayments(),
      ])
      setBooking(bookingRes.data.data)
      const userPayments = paymentRes.data.data.items || paymentRes.data.data || []
      const userPayment = userPayments.find(p => p.booking === bookingId)
      if (userPayment) {
        setPayment(userPayment)
      }
    } catch (error) {
      console.error('Failed to load payment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      setFormData(prev => ({ ...prev, screenshot: file }))
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.screenshot) {
      toast.error('Please upload payment screenshot')
      return
    }
    if (!formData.transactionId.trim()) {
      toast.error('Please enter transaction ID')
      return
    }

    setProcessing(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('bookingId', bookingId)
      formDataToSend.append('amount', booking?.pricing?.advanceAmount || 0)
      formDataToSend.append('paymentMethod', 'upi')
      formDataToSend.append('upiId', formData.upiId)
      formDataToSend.append('transactionId', formData.transactionId)
      formDataToSend.append('screenshot', formData.screenshot)

      await paymentsAPI.create(formDataToSend)
      toast.success('Payment submitted successfully! Awaiting verification.')
      navigate(`/booking-confirmation/${bookingId}`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment submission failed')
    } finally {
      setProcessing(false)
    }
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

  const advanceAmount = booking?.pricing?.advanceAmount || 0
  const totalAmount = booking?.pricing?.totalAmount || 0
  const balanceAmount = totalAmount - advanceAmount

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        <div className="max-w-2xl mx-auto">
          <Link to={`/booking/${bookingId}`} className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
            ← Back to Booking
          </Link>

          <div className="card overflow-hidden">
            <div className="bg-primary text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Payment</h1>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  Awaiting Verification
                </span>
              </div>
              <p className="text-primary/80">Complete your payment to confirm the booking</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="section-title mb-4">Payment Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Advance Paid</span>
                    <span className="font-semibold text-green-600">{advanceAmount > 0 ? `₹${advanceAmount.toLocaleString('en-IN')}` : 'Not Paid'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balance Due</span>
                    <span className="font-semibold text-primary">{formatCurrency(balanceAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total</span>
                    <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                  </div>
                  <div>
                    <p className="font-semibold text-yellow-800">Pay Balance Before Check-in</p>
                    <p className="text-sm text-yellow-700">Your booking will be confirmed once payment is verified by admin</p>
                  </div>
                </div>
              </div>

              {payment && payment.status === 'pending_verification' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-800">Payment Under Verification</p>
                      <p className="text-sm text-blue-700">Admin will verify your payment within 24 hours</p>
                    </div>
                  </div>
                </div>
              )}

              {!payment || payment.status === 'awaiting_payment' ? (
                <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
                  <div>
                    <label className="block text-sm font-medium mb-2">UPI ID (Optional)</label>
                    <input
                      type="text"
                      value={formData.upiId}
                      onChange={(e) => setFormData(prev => ({ ...prev, upiId: e.target.value }))}
                      placeholder="yourname@upi"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Transaction ID *</label>
                    <input
                      type="text"
                      value={formData.transactionId}
                      onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                      placeholder="Enter UPI transaction reference"
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Payment Screenshot *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="screenshot-upload"
                      />
                      <label htmlFor="screenshot-upload" className="cursor-pointer">
                        {preview ? (
                          <div className="relative w-32 h-32 mx-auto mb-2">
                            <img src={preview} alt="Preview" className="w-full h-full object-cover rounded" />
                            <button type="button" onClick={() => { setFormData(prev => ({ ...prev, screenshot: null })); setPreview(null); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                          </div>
                        ) : (
                          <div>
                            <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z"/></svg>
                            <p className="text-gray-600">Click to upload payment screenshot</p>
                            <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <button type="submit" disabled={processing || !formData.screenshot} className="btn-primary w-full py-3">
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Payment'
                    )}
                  </button>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-semibold text-sm">Secure Payment</p>
                      <p className="text-xs text-gray-500">Your payment details are encrypted and secure</p>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-700 mb-2">Payment Submitted!</h3>
                  <p className="text-gray-600 mb-6">Your payment is under admin verification. You'll be notified once verified.</p>
                  <Link to={`/booking/${bookingId}`} className="btn-primary inline-flex items-center gap-2">
                    View Booking
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
)
}