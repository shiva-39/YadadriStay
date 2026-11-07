import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Calendar,
  User,
  Phone,
  CreditCard,
  Clock,
  Loader2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  Building2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const initialBookingForm = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerIdProof: '',
  customerIdType: 'aadhaar',
  lodgeId: '',
  roomCategoryId: '',
  checkInDate: '',
  checkOutDate: '',
  numberOfRooms: 1,
  numberOfGuests: 1,
  totalAmount: 0,
  advancePaid: 0,
  paymentMethod: 'cash',
  paymentReference: '',
  source: 'walkin',
  specialRequests: '',
  status: 'confirmed',
};

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
];

const ID_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'passport', label: 'Passport' },
  { value: 'voter_id', label: 'Voter ID' },
];

export default function OfflineBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [lodges, setLodges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedLodgeId, setSelectedLodgeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [formData, setFormData] = useState(initialBookingForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchLodges();
  }, []);

  useEffect(() => {
    if (selectedLodgeId) {
      fetchCategories();
      fetchBookings();
    } else {
      setCategories([]);
      setBookings([]);
      setLoading(false);
    }
  }, [selectedLodgeId, searchQuery, statusFilter, dateFilter]);

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

  const fetchCategories = async () => {
    try {
      const response = await api.get(`/room-categories?lodge=${selectedLodgeId}&isActive=true`);
      setCategories(response.data.data?.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = { lodge: selectedLodgeId, limit: 50, sort: '-createdAt' };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.checkInDate = dateFilter;

      const response = await api.get('/offline-bookings', { params });
      setBookings(response.data.data?.bookings || []);
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
    setSelectedLodgeId(id);
    setCategories([]);
    setBookings([]);
  };

  const openModal = (booking = null) => {
    if (booking) {
      setEditingBooking(booking);
      setFormData({
        ...initialBookingForm,
        ...booking,
        lodgeId: booking.lodge?._id || booking.lodge || selectedLodgeId,
        roomCategoryId: booking.roomCategory?._id || booking.roomCategory || '',
        checkInDate: booking.checkInDate ? format(parseISO(booking.checkInDate), 'yyyy-MM-dd') : '',
        checkOutDate: booking.checkOutDate ? format(parseISO(booking.checkOutDate), 'yyyy-MM-dd') : '',
      });
    } else {
      setEditingBooking(null);
      const today = format(new Date(), 'yyyy-MM-dd');
      const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
      setFormData({
        ...initialBookingForm,
        lodgeId: selectedLodgeId,
        checkInDate: today,
        checkOutDate: tomorrow,
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBooking(null);
    setFormData(initialBookingForm);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (!formData.customerPhone.trim()) newErrors.customerPhone = 'Customer phone is required';
    else if (!/^[6-9]\d{9}$/.test(formData.customerPhone)) newErrors.customerPhone = 'Invalid phone number';
    if (!formData.lodgeId) newErrors.lodgeId = 'Please select a property';
    if (!formData.roomCategoryId) newErrors.roomCategoryId = 'Please select a room category';
    if (!formData.checkInDate) newErrors.checkInDate = 'Check-in date is required';
    if (!formData.checkOutDate) newErrors.checkOutDate = 'Check-out date is required';
    if (formData.checkInDate && formData.checkOutDate && formData.checkInDate >= formData.checkOutDate) {
      newErrors.checkOutDate = 'Check-out must be after check-in';
    }
    if (!formData.numberOfRooms || formData.numberOfRooms < 1) newErrors.numberOfRooms = 'At least 1 room required';
    if (!formData.numberOfGuests || formData.numberOfGuests < 1) newErrors.numberOfGuests = 'At least 1 guest required';
    if (!formData.totalAmount || formData.totalAmount <= 0) newErrors.totalAmount = 'Total amount must be greater than 0';
    if (formData.advancePaid > formData.totalAmount) newErrors.advancePaid = 'Advance cannot exceed total amount';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = { ...formData };
      let response;
      if (editingBooking) {
        response = await api.put(`/offline-bookings/${editingBooking._id}`, payload);
        toast.success('Booking updated successfully!');
      } else {
        response = await api.post('/offline-bookings', payload);
        toast.success('Offline booking created successfully!');
      }
      closeModal();
      fetchBookings();
    } catch (error) {
      console.error('Failed to save booking:', error);
      const message = error.response?.data?.message || 'Failed to save booking';
      toast.error(message);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors.reduce((acc, err) => {
          acc[err.field] = err.message;
          return acc;
        }, {}));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;

    try {
      await api.delete(`/offline-bookings/${bookingId}`);
      toast.success('Booking deleted successfully!');
      fetchBookings();
    } catch (error) {
      console.error('Failed to delete booking:', error);
      toast.error('Failed to delete booking');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: 'badge-success',
      pending_payment: 'badge-warning',
      pending_verification: 'badge-info',
      cancelled: 'badge-danger',
      completed: 'badge-gray',
      checked_in: 'badge-info',
      checked_out: 'badge-gray',
      no_show: 'badge-danger',
    };
    return styles[status] || 'badge-gray';
  };

  const getStatusLabel = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredBookings = bookings.filter(booking => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches =
        booking.bookingNumber?.toLowerCase().includes(query) ||
        booking.customerName?.toLowerCase().includes(query) ||
        booking.customerPhone?.includes(query) ||
        booking.roomCategoryName?.toLowerCase().includes(query);
      if (!matches) return false;
    }
    if (statusFilter && booking.status !== statusFilter) return false;
    if (dateFilter && booking.checkInDate?.split('T')[0] !== dateFilter) return false;
    return true;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Offline Bookings</h1>
          <p className="text-gray-600 mt-1">Manage walk-in and offline bookings</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedLodgeId}
            onChange={handleLodgeChange}
            className="input-field w-auto"
          >
            {lodges.map(lodge => (
              <option key={lodge._id} value={lodge._id}>{lodge.name}</option>
            ))}
          </select>
          <button onClick={() => openModal()} className="btn-primary">
            <Plus className="w-5 h-5" />
            New Booking
          </button>
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
                placeholder="Search by name, phone, booking #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="no_show">No Show</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
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
              <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No offline bookings found</h3>
              <p className="text-gray-500 mb-4">Create your first offline booking for walk-in guests</p>
              <button onClick={() => openModal()} className="btn-primary">
                <Plus className="w-5 h-5" />
                Add Booking
              </button>
            </div>
          ) : (
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
                  {filteredBookings.map((booking) => (
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
                        <p className="font-medium text-gray-900">{booking.customerName}</p>
                        <p className="text-sm text-gray-500">{booking.customerPhone}</p>
                        {booking.customerEmail && (
                          <p className="text-xs text-gray-400">{booking.customerEmail}</p>
                        )}
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
                          <span className={`badge ${booking.advancePaid > 0 ? 'badge-success' : 'badge-gray'}`}>
                            ₹{booking.advancePaid.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">{booking.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={getStatusBadge(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(booking)}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            aria-label="Edit booking"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(booking._id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Delete booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={closeModal} aria-hidden="true" />
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                  {editingBooking ? 'Edit Offline Booking' : 'New Offline Booking'}
                </h2>
                <button onClick={closeModal} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
                {/* Property & Room */}
                <div className="border-b border-gray-100 pb-6">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary-600" />
                    Property & Room Selection
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="lodgeId" className="label">Property *</label>
                      <select
                        id="lodgeId"
                        name="lodgeId"
                        value={formData.lodgeId}
                        onChange={handleChange}
                        className={`input-field ${errors.lodgeId ? 'border-red-500 focus:ring-red-500' : ''}`}
                        disabled={editingBooking}
                      >
                        <option value="">Select property</option>
                        {lodges.map(lodge => (
                          <option key={lodge._id} value={lodge._id}>{lodge.name}</option>
                        ))}
                      </select>
                      {errors.lodgeId && <p className="mt-1 text-sm text-red-600">{errors.lodgeId}</p>}
                    </div>
                    <div>
                      <label htmlFor="roomCategoryId" className="label">Room Category *</label>
                      <select
                        id="roomCategoryId"
                        name="roomCategoryId"
                        value={formData.roomCategoryId}
                        onChange={handleChange}
                        className={`input-field ${errors.roomCategoryId ? 'border-red-500 focus:ring-red-500' : ''}`}
                        disabled={categories.length === 0}
                      >
                        <option value="">Select room category</option>
                        {categories.map(cat => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name} (₹{cat.pricing.basePrice.toLocaleString('en-IN')}, {cat.totalRooms} rooms)
                          </option>
                        ))}
                      </select>
                      {errors.roomCategoryId && <p className="mt-1 text-sm text-red-600">{errors.roomCategoryId}</p>}
                    </div>
                  </div>
                </div>

                {/* Guest Details */}
                <div className="border-b border-gray-100 pb-6">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary-600" />
                    Guest Details
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="customerName" className="label">Full Name *</label>
                        <input
                          type="text"
                          id="customerName"
                          name="customerName"
                          value={formData.customerName}
                          onChange={handleChange}
                          className={`input-field ${errors.customerName ? 'border-red-500 focus:ring-red-500' : ''}`}
                          placeholder="Guest full name"
                        />
                        {errors.customerName && <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>}
                      </div>
                      <div>
                        <label htmlFor="customerPhone" className="label">Phone Number *</label>
                        <input
                          type="tel"
                          id="customerPhone"
                          name="customerPhone"
                          value={formData.customerPhone}
                          onChange={handleChange}
                          className={`input-field ${errors.customerPhone ? 'border-red-500 focus:ring-red-500' : ''}`}
                          placeholder="9876543210"
                        />
                        {errors.customerPhone && <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="customerEmail" className="label">Email</label>
                        <input
                          type="email"
                          id="customerEmail"
                          name="customerEmail"
                          value={formData.customerEmail}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="guest@example.com"
                        />
                      </div>
                      <div>
                        <label htmlFor="customerIdType" className="label">ID Proof Type</label>
                        <select
                          id="customerIdType"
                          name="customerIdType"
                          value={formData.customerIdType}
                          onChange={handleChange}
                          className="input-field"
                        >
                          {ID_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="customerIdProof" className="label">ID Proof Number</label>
                      <input
                        type="text"
                        id="customerIdProof"
                        name="customerIdProof"
                        value={formData.customerIdProof}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Enter ID proof number"
                      />
                    </div>
                  </div>
                </div>

                {/* Stay Details */}
                <div className="border-b border-gray-100 pb-6">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-600" />
                    Stay Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="checkInDate" className="label">Check-in Date *</label>
                      <input
                        type="date"
                        id="checkInDate"
                        name="checkInDate"
                        value={formData.checkInDate}
                        onChange={handleChange}
                        className={`input-field ${errors.checkInDate ? 'border-red-500 focus:ring-red-500' : ''}`}
                        min={format(new Date(), 'yyyy-MM-dd')}
                      />
                      {errors.checkInDate && <p className="mt-1 text-sm text-red-600">{errors.checkInDate}</p>}
                    </div>
                    <div>
                      <label htmlFor="checkOutDate" className="label">Check-out Date *</label>
                      <input
                        type="date"
                        id="checkOutDate"
                        name="checkOutDate"
                        value={formData.checkOutDate}
                        onChange={handleChange}
                        className={`input-field ${errors.checkOutDate ? 'border-red-500 focus:ring-red-500' : ''}`}
                        min={formData.checkInDate || format(new Date(), 'yyyy-MM-dd')}
                      />
                      {errors.checkOutDate && <p className="mt-1 text-sm text-red-600">{errors.checkOutDate}</p>}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="numberOfRooms" className="label">Number of Rooms *</label>
                      <input
                        type="number"
                        id="numberOfRooms"
                        name="numberOfRooms"
                        value={formData.numberOfRooms}
                        onChange={handleChange}
                        className={`input-field ${errors.numberOfRooms ? 'border-red-500 focus:ring-red-500' : ''}`}
                        min="1"
                        max="10"
                      />
                      {errors.numberOfRooms && <p className="mt-1 text-sm text-red-600">{errors.numberOfRooms}</p>}
                    </div>
                    <div>
                      <label htmlFor="numberOfGuests" className="label">Number of Guests *</label>
                      <input
                        type="number"
                        id="numberOfGuests"
                        name="numberOfGuests"
                        value={formData.numberOfGuests}
                        onChange={handleChange}
                        className={`input-field ${errors.numberOfGuests ? 'border-red-500 focus:ring-red-500' : ''}`}
                        min="1"
                        max="20"
                      />
                      {errors.numberOfGuests && <p className="mt-1 text-sm text-red-600">{errors.numberOfGuests}</p>}
                    </div>
                    <div>
                      <label htmlFor="source" className="label">Booking Source</label>
                      <select
                        id="source"
                        name="source"
                        value={formData.source}
                        onChange={handleChange}
                        className="input-field"
                      >
                        <option value="walkin">Walk-in</option>
                        <option value="phone">Phone</option>
                        <option value="email">Email</option>
                        <option value="reference">Reference</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="border-b border-gray-100 pb-6">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary-600" />
                    Payment Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="totalAmount" className="label">Total Amount (₹) *</label>
                      <input
                        type="number"
                        id="totalAmount"
                        name="totalAmount"
                        value={formData.totalAmount}
                        onChange={handleChange}
                        className={`input-field ${errors.totalAmount ? 'border-red-500 focus:ring-red-500' : ''}`}
                        min="0"
                        step="100"
                      />
                      {errors.totalAmount && <p className="mt-1 text-sm text-red-600">{errors.totalAmount}</p>}
                    </div>
                    <div>
                      <label htmlFor="advancePaid" className="label">Advance Paid (₹)</label>
                      <input
                        type="number"
                        id="advancePaid"
                        name="advancePaid"
                        value={formData.advancePaid}
                        onChange={handleChange}
                        className={`input-field ${errors.advancePaid ? 'border-red-500 focus:ring-red-500' : ''}`}
                        min="0"
                        step="100"
                      />
                      {errors.advancePaid && <p className="mt-1 text-sm text-red-600">{errors.advancePaid}</p>}
                    </div>
                    <div>
                      <label htmlFor="paymentMethod" className="label">Payment Method</label>
                      <select
                        id="paymentMethod"
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleChange}
                        className="input-field"
                      >
                        {PAYMENT_METHODS.map(method => (
                          <option key={method.value} value={method.value}>{method.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label htmlFor="paymentReference" className="label">Payment Reference / UPI Transaction ID</label>
                    <input
                      type="text"
                      id="paymentReference"
                      name="paymentReference"
                      value={formData.paymentReference}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="e.g., UPI ref: 1234567890"
                    />
                  </div>
                </div>

                {/* Special Requests */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Special Requests</h3>
                  <textarea
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleChange}
                    className="input-field"
                    rows={3}
                    placeholder="Any special requests or notes..."
                  />
                </div>

                {/* Actions */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="w-5 h-5" />
                        {editingBooking ? 'Update' : 'Create'} Booking
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}