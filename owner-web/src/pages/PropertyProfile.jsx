import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Wifi,
  Car,
  Utensils,
  Waves,
  Wind,
  Shield,
  Camera,
  Video,
  Loader2,
  Save,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const FACILITIES = [
  { key: 'parking', label: 'Parking', icon: Car },
  { key: 'wifi', label: 'WiFi', icon: Wifi },
  { key: 'ac', label: 'Air Conditioning', icon: Wind },
  { key: 'nonAc', label: 'Non-AC Rooms', icon: Waves },
  { key: 'restaurant', label: 'Restaurant', icon: Utensils },
  { key: 'roomService', label: 'Room Service', icon: Utensils },
  { key: 'laundry', label: 'Laundry', icon: Waves },
  { key: 'pickupDrop', label: 'Pickup & Drop', icon: Car },
  { key: 'hotWater', label: 'Hot Water', icon: Waves },
  { key: 'powerBackup', label: 'Power Backup', icon: Shield },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'cctv', label: 'CCTV', icon: Shield },
  { key: 'lift', label: 'Lift/Elevator', icon: Building2 },
];

const initialFormData = {
  name: '',
  description: '',
  shortDescription: '',
  address: {
    street: '',
    city: '',
    state: 'Telangana',
    pincode: '',
    coordinates: [0, 0],
    landmark: '',
    distanceFromTemple: 0,
  },
  contact: {
    phone: '',
    alternatePhone: '',
    email: '',
    whatsappNumber: '',
  },
  facilities: {},
  policies: {
    checkInTime: '12:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'moderate',
    advancePaymentPercentage: 20,
    allowPets: false,
    allowSmoking: false,
    allowUnmarriedCouples: true,
    minAge: 18,
  },
  pricing: {
    basePrice: 0,
    currency: 'INR',
    taxPercentage: 18,
    serviceChargePercentage: 0,
  },
};

export default function PropertyProfile() {
  const { user } = useAuth();
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [lodges, setLodges] = useState([]);
  const [selectedLodgeId, setSelectedLodgeId] = useState('');

  useEffect(() => {
    fetchLodges();
  }, []);

  const fetchLodges = async () => {
    try {
      const response = await api.get('/lodges?isActive=true');
      const lodgesData = response.data.data?.lodges || [];
      setLodges(lodgesData);
      if (lodgesData.length > 0 && !selectedLodgeId) {
        setSelectedLodgeId(lodgesData[0]._id);
        await fetchLodgeDetails(lodgesData[0]._id);
      } else if (lodgesData.length === 0) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch lodges:', error);
      toast.error('Failed to load properties');
      setLoading(false);
    }
  };

  const fetchLodgeDetails = async (lodgeId) => {
    try {
      const response = await api.get(`/lodges/${lodgeId}`);
      const lodge = response.data.data?.lodge;
      if (lodge) {
        setFormData({
          ...initialFormData,
          ...lodge,
          address: { ...initialFormData.address, ...lodge.address },
          contact: { ...initialFormData.contact, ...lodge.contact },
          facilities: { ...initialFormData.facilities, ...lodge.facilities },
          policies: { ...initialFormData.policies, ...lodge.policies },
          pricing: { ...initialFormData.pricing, ...lodge.pricing },
        });
        setErrors({});
      }
    } catch (error) {
      console.error('Failed to fetch lodge details:', error);
      toast.error('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = { ...prev };
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        newData[parent] = { ...prev[parent], [child]: type === 'checkbox' ? checked : value };
      } else {
        newData[name] = type === 'checkbox' ? checked : value;
      }
      return newData;
    });
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFacilityChange = (key, checked) => {
    setFormData(prev => ({
      ...prev,
      facilities: { ...prev.facilities, [key]: checked },
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Property name is required';
    if (!formData.address.street.trim()) newErrors['address.street'] = 'Street address is required';
    if (!formData.address.city.trim()) newErrors['address.city'] = 'City is required';
    if (!formData.address.pincode.trim()) newErrors['address.pincode'] = 'Pincode is required';
    else if (!/^\d{6}$/.test(formData.address.pincode)) newErrors['address.pincode'] = 'Invalid pincode format';
    if (!formData.contact.phone.trim()) newErrors['contact.phone'] = 'Contact phone is required';
    else if (!/^[6-9]\d{9}$/.test(formData.contact.phone)) newErrors['contact.phone'] = 'Invalid phone number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      let response;
      if (selectedLodgeId) {
        response = await api.put(`/lodges/${selectedLodgeId}`, formData);
        toast.success('Property updated successfully!');
      } else {
        response = await api.post('/lodges', formData);
        toast.success('Property created successfully!');
        setSelectedLodgeId(response.data.data.lodge._id);
      }
      await fetchLodges();
    } catch (error) {
      console.error('Failed to save property:', error);
      const message = error.response?.data?.message || 'Failed to save property';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Profile</h1>
          <p className="text-gray-600 mt-1">Manage your lodge information and settings</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedLodgeId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedLodgeId(id);
              if (id) fetchLodgeDetails(id);
              else setFormData(initialFormData);
            }}
            className="input-field w-auto"
          >
            <option value="">Select a property...</option>
            {lodges.map((lodge) => (
              <option key={lodge._id} value={lodge._id}>
                {lodge.name}
              </option>
            ))}
            <option value="new">+ Add New Property</option>
          </select>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Basic Info */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-600" />
              Basic Information
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label htmlFor="name" className="label">Property Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-field ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="e.g., Sri Lakshmi Narasimha Nilayam"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="shortDescription" className="label">Short Description</label>
                <textarea
                  id="shortDescription"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  className="input-field"
                  rows={2}
                  placeholder="Brief description for listings (max 500 chars)"
                  maxLength={500}
                />
              </div>
              <div>
                <label htmlFor="description" className="label">Full Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                  placeholder="Detailed description of your property (max 5000 chars)"
                  maxLength={5000}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" />
              Address & Location
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label htmlFor="street" className="label">Street Address *</label>
              <input
                type="text"
                id="street"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                className={`input-field ${errors['address.street'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Temple Road, Near Yadadri Bus Stand"
              />
              {errors['address.street'] && <p className="mt-1 text-sm text-red-600">{errors['address.street']}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="label">City *</label>
                <input
                  type="text"
                  id="city"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  className={`input-field ${errors['address.city'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Yadagirigutta"
                />
                {errors['address.city'] && <p className="mt-1 text-sm text-red-600">{errors['address.city']}</p>}
              </div>
              <div>
                <label htmlFor="state" className="label">State</label>
                <input
                  type="text"
                  id="state"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Telangana"
                />
              </div>
              <div>
                <label htmlFor="pincode" className="label">Pincode *</label>
                <input
                  type="text"
                  id="pincode"
                  name="address.pincode"
                  value={formData.address.pincode}
                  onChange={handleChange}
                  className={`input-field ${errors['address.pincode'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="508115"
                  maxLength={6}
                />
                {errors['address.pincode'] && <p className="mt-1 text-sm text-red-600">{errors['address.pincode']}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="landmark" className="label">Landmark</label>
                <input
                  type="text"
                  id="landmark"
                  name="address.landmark"
                  value={formData.address.landmark}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Opposite Yadadri Temple Main Gate"
                />
              </div>
              <div>
                <label htmlFor="distanceFromTemple" className="label">Distance from Temple (km)</label>
                <input
                  type="number"
                  id="distanceFromTemple"
                  name="address.distanceFromTemple"
                  value={formData.address.distanceFromTemple}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="0.5"
                  step="0.1"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary-600" />
              Contact Information
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="label">Primary Phone *</label>
                <input
                  type="tel"
                  id="phone"
                  name="contact.phone"
                  value={formData.contact.phone}
                  onChange={handleChange}
                  className={`input-field ${errors['contact.phone'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="9876543210"
                />
                {errors['contact.phone'] && <p className="mt-1 text-sm text-red-600">{errors['contact.phone']}</p>}
              </div>
              <div>
                <label htmlFor="alternatePhone" className="label">Alternate Phone</label>
                <input
                  type="tel"
                  id="alternatePhone"
                  name="contact.alternatePhone"
                  value={formData.contact.alternatePhone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="8899776655"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="contact.email"
                  value={formData.contact.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="property@example.com"
                />
              </div>
              <div>
                <label htmlFor="whatsappNumber" className="label">WhatsApp Number</label>
                <input
                  type="tel"
                  id="whatsappNumber"
                  name="contact.whatsappNumber"
                  value={formData.contact.whatsappNumber}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="9876543210"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Facilities */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-primary-600" />
              Facilities & Amenities
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {FACILITIES.map(({ key, label, icon: Icon }) => (
                <label key={key} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.facilities[key] || false}
                    onChange={(e) => handleFacilityChange(key, e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <Icon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Policies */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />
              Policies
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkInTime" className="label">Check-in Time</label>
                <input
                  type="time"
                  id="checkInTime"
                  name="policies.checkInTime"
                  value={formData.policies.checkInTime}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="checkOutTime" className="label">Check-out Time</label>
                <input
                  type="time"
                  id="checkOutTime"
                  name="policies.checkOutTime"
                  value={formData.policies.checkOutTime}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="label">Cancellation Policy</label>
              <select
                name="policies.cancellationPolicy"
                value={formData.policies.cancellationPolicy}
                onChange={handleChange}
                className="input-field"
              >
                <option value="flexible">Flexible (Full refund 1 day before)</option>
                <option value="moderate">Moderate (Full refund 5 days before)</option>
                <option value="strict">Strict (50% refund up to 1 week before)</option>
                <option value="custom">Custom Policy</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="advancePaymentPercentage" className="label">Advance Payment (%)</label>
                <input
                  type="number"
                  id="advancePaymentPercentage"
                  name="policies.advancePaymentPercentage"
                  value={formData.policies.advancePaymentPercentage}
                  onChange={handleChange}
                  className="input-field"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label htmlFor="minAge" className="label">Minimum Age</label>
                <input
                  type="number"
                  id="minAge"
                  name="policies.minAge"
                  value={formData.policies.minAge}
                  onChange={handleChange}
                  className="input-field"
                  min="18"
                  max="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="policies.allowPets"
                  checked={formData.policies.allowPets}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Allow Pets</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="policies.allowSmoking"
                  checked={formData.policies.allowSmoking}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Allow Smoking</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="policies.allowUnmarriedCouples"
                  checked={formData.policies.allowUnmarriedCouples}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Allow Unmarried Couples</span>
              </label>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary-600" />
              Pricing Configuration
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="basePrice" className="label">Base Price (₹)</label>
                <input
                  type="number"
                  id="basePrice"
                  name="pricing.basePrice"
                  value={formData.pricing.basePrice}
                  onChange={handleChange}
                  className="input-field"
                  min="0"
                  step="100"
                />
              </div>
              <div>
                <label htmlFor="taxPercentage" className="label">Tax Percentage (%)</label>
                <input
                  type="number"
                  id="taxPercentage"
                  name="pricing.taxPercentage"
                  value={formData.pricing.taxPercentage}
                  onChange={handleChange}
                  className="input-field"
                  min="0"
                  max="100"
                  step="0.5"
                />
              </div>
              <div>
                <label htmlFor="serviceChargePercentage" className="label">Service Charge (%)</label>
                <input
                  type="number"
                  id="serviceChargePercentage"
                  name="pricing.serviceChargePercentage"
                  value={formData.pricing.serviceChargePercentage}
                  onChange={handleChange}
                  className="input-field"
                  min="0"
                  max="100"
                  step="0.5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button type="button" className="btn-secondary">
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
                Save Property
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}