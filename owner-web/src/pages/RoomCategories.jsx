import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  DoorOpen,
  Users,
  Snowflake,
  Sun,
  Bed,
  Wifi,
  Tv,
  Wind,
  Waves,
  Bath,
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const ROOM_TYPES = [
  'single', 'double', 'triple', 'quad', 'family', 'dormitory', 'suite', 'deluxe', 'standard'
];

const AC_TYPES = ['ac', 'non_ac', 'both'];

const BED_TYPES = ['single', 'double', 'queen', 'king', 'bunk', 'sofa_bed', 'floor_mattress'];

const initialCategoryForm = {
  name: '',
  description: '',
  capacity: { adults: 2, children: 1, maxOccupancy: 3 },
  type: 'double',
  acType: 'ac',
  pricing: {
    basePrice: 0,
    weekendPrice: 0,
    holidayPrice: 0,
    currency: 'INR',
    taxInclusive: true,
  },
  totalRooms: 1,
  amenities: {
    bedType: 'double',
    bedCount: 1,
    attachedBathroom: true,
    hotWater: true,
    tv: false,
    wifi: false,
    ac: false,
    fan: true,
    wardrobe: true,
    dressingTable: false,
    balcony: false,
    window: true,
    intercom: false,
    safe: false,
    miniFridge: false,
    teaCoffeeMaker: false,
    other: [],
  },
  pricingRules: {
    advancePercentage: 20,
    minimumStay: 1,
    maximumStay: 30,
    earlyBirdDiscount: { enabled: false, daysBefore: 7, discountPercentage: 10 },
    lastMinuteDiscount: { enabled: false, daysBefore: 1, discountPercentage: 10 },
  },
  isActive: true,
  displayOrder: 0,
};

export default function RoomCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [lodges, setLodges] = useState([]);
  const [selectedLodgeId, setSelectedLodgeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState(initialCategoryForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchLodges();
  }, []);

  useEffect(() => {
    if (selectedLodgeId) {
      fetchCategories();
    } else {
      setCategories([]);
      setLoading(false);
    }
  }, [selectedLodgeId]);

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
    setLoading(true);
    try {
      const response = await api.get(`/room-categories?lodge=${selectedLodgeId}`);
      setCategories(response.data.data?.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load room categories');
    } finally {
      setLoading(false);
    }
  };

  const handleLodgeChange = (e) => {
    const id = e.target.value;
    setSelectedLodgeId(id);
    setCategories([]);
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        ...initialCategoryForm,
        ...category,
        capacity: { ...initialCategoryForm.capacity, ...category.capacity },
        pricing: { ...initialCategoryForm.pricing, ...category.pricing },
        amenities: { ...initialCategoryForm.amenities, ...category.amenities },
        pricingRules: { ...initialCategoryForm.pricingRules, ...category.pricingRules },
      });
    } else {
      setEditingCategory(null);
      setFormData({ ...initialCategoryForm, displayOrder: categories.length });
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData(initialCategoryForm);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = { ...prev };
      if (name.includes('.')) {
        const parts = name.split('.');
        if (parts.length === 2) {
          newData[parts[0]] = { ...prev[parts[0]], [parts[1]]: type === 'checkbox' ? checked : value };
        } else if (parts.length === 3) {
          newData[parts[0]] = {
            ...prev[parts[0]],
            [parts[1]]: { ...prev[parts[0]][parts[1]], [parts[2]]: type === 'checkbox' ? checked : value }
          };
        }
      } else {
        newData[name] = type === 'checkbox' ? checked : value;
      }
      return newData;
    });
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Category name is required';
    if (!formData.pricing.basePrice || formData.pricing.basePrice <= 0) newErrors['pricing.basePrice'] = 'Base price must be greater than 0';
    if (!formData.totalRooms || formData.totalRooms < 1) newErrors.totalRooms = 'Total rooms must be at least 1';
    if (formData.capacity.maxOccupancy < formData.capacity.adults + formData.capacity.children) {
      newErrors['capacity.maxOccupancy'] = 'Max occupancy must be >= adults + children';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = { ...formData, lodge: selectedLodgeId };
      let response;
      if (editingCategory) {
        response = await api.put(`/room-categories/${editingCategory._id}`, payload);
        toast.success('Room category updated successfully!');
      } else {
        response = await api.post('/room-categories', payload);
        toast.success('Room category created successfully!');
      }
      closeModal();
      fetchCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      const message = error.response?.data?.message || 'Failed to save category';
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

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this room category?')) return;

    try {
      await api.delete(`/room-categories/${categoryId}`);
      toast.success('Room category deleted successfully!');
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error('Failed to delete category');
    }
  };

  const getAcTypeLabel = (type) => {
    const labels = { ac: 'AC', non_ac: 'Non-AC', both: 'Both' };
    return labels[type] || type;
  };

  const getTypeLabel = (type) => {
    const labels = {
      single: 'Single', double: 'Double', triple: 'Triple', quad: 'Quad',
      family: 'Family', dormitory: 'Dormitory', suite: 'Suite', deluxe: 'Deluxe', standard: 'Standard'
    };
    return labels[type] || type;
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
          <h1 className="text-2xl font-bold text-gray-900">Room Categories</h1>
          <p className="text-gray-600 mt-1">Manage room types and configurations for your property</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedLodgeId}
            onChange={handleLodgeChange}
            className="input-field w-auto"
            disabled={lodges.length <= 1}
          >
            {lodges.map((lodge) => (
              <option key={lodge._id} value={lodge._id}>
                {lodge.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => openModal()}
            className="btn-primary"
            disabled={!selectedLodgeId}
          >
            <Plus className="w-5 h-5" />
            Add Category
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="card">
        <div className="card-body p-0">
          {categories.length === 0 ? (
            <div className="p-12 text-center">
              <DoorOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No room categories yet</h3>
              <p className="text-gray-500 mb-4">Create your first room category to start accepting bookings</p>
              <button onClick={() => openModal()} className="btn-primary" disabled={!selectedLodgeId}>
                <Plus className="w-5 h-5" />
                Add First Category
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AC Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rooms</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((category) => (
                    <tr key={category._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{category.name}</p>
                          {category.description && (
                            <p className="text-sm text-gray-500 line-clamp-1">{category.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge badge-info">{getTypeLabel(category.type)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${category.acType === 'ac' ? 'badge-success' : category.acType === 'non_ac' ? 'badge-warning' : 'badge-info'}`}>
                          {getAcTypeLabel(category.acType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {category.capacity.adults}A + {category.capacity.children}C (Max: {category.capacity.maxOccupancy})
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{category.totalRooms}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{category.pricing.basePrice.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4">
                        <span className={category.isActive ? 'badge badge-success' : 'badge badge-gray'}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(category)}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            aria-label="Edit category"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category._id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Delete category"
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
            <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                  {editingCategory ? 'Edit Room Category' : 'Add Room Category'}
                </h2>
                <button onClick={closeModal} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
                {/* Basic Info */}
                <div className="border-b border-gray-100 pb-6">
                  <h3 className="font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div>
                    <label htmlFor="name" className="label">Category Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`input-field ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="e.g., AC Deluxe Double Room"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div className="mt-4">
                    <label htmlFor="description" className="label">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="input-field"
                      rows={3}
                      placeholder="Describe this room category..."
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="type" className="label">Room Type *</label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="input-field"
                      >
                        {ROOM_TYPES.map(type => (
                          <option key={type} value={type}>{getTypeLabel(type)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="acType" className="label">AC Type *</label>
                      <select
                        id="acType"
                        name="acType"
                        value={formData.acType}
                        onChange={handleChange}
                        className="input-field"
                      >
                        {AC_TYPES.map(type => (
                          <option key={type} value={type}>{getAcTypeLabel(type)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="displayOrder" className="label">Display Order</label>
                      <input
                        type="number"
                        id="displayOrder"
                        name="displayOrder"
                        value={formData.displayOrder}
                        onChange={handleChange}
                        className="input-field"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Capacity */}
                <div className="border-b border-gray-100 pb-6">
                  <h3 className="font-medium text-gray-900 mb-4">Capacity</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="adults" className="label">Adults *</label>
                      <input
                        type="number"
                        id="adults"
                        name="capacity.adults"
                        value={formData.capacity.adults}
                        onChange={handleChange}
                        className="input-field"
                        min="1"
                        max="10"
                      />
                    </div>
                    <div>
                      <label htmlFor="children" className="label">Children</label>
                      <input
                        type="number"
                        id="children"
                        name="capacity.children"
                        value={formData.capacity.children}
                        onChange={handleChange}
                        className="input-field"
                        min="0"
                        max="5"
                      />
                    </div>
                    <div>
                      <label htmlFor="maxOccupancy" className="label">Max Occupancy *</label>
                      <input
                        type="number"
                        id="maxOccupancy"
                        name="capacity.maxOccupancy"
                        value={formData.capacity.maxOccupancy}
                        onChange={handleChange}
                        className={`input-field ${errors['capacity.maxOccupancy'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                        min="1"
                        max="15"
                      />
                      {errors['capacity.maxOccupancy'] && <p className="mt-1 text-sm text-red-600">{errors['capacity.maxOccupancy']}</p>}
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="border-b border-gray-100 pb-6">
                  <h3 className="font-medium text-gray-900 mb-4">Pricing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="basePrice" className="label">Base Price (₹) *</label>
                      <input
                        type="number"
                        id="basePrice"
                        name="pricing.basePrice"
                        value={formData.pricing.basePrice}
                        onChange={handleChange}
                        className={`input-field ${errors['pricing.basePrice'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                        min="0"
                        step="100"
                      />
                      {errors['pricing.basePrice'] && <p className="mt-1 text-sm text-red-600">{errors['pricing.basePrice']}</p>}
                    </div>
                    <div>
                      <label htmlFor="weekendPrice" className="label">Weekend Price (₹)</label>
                      <input
                        type="number"
                        id="weekendPrice"
                        name="pricing.weekendPrice"
                        value={formData.pricing.weekendPrice}
                        onChange={handleChange}
                        className="input-field"
                        min="0"
                        step="100"
                      />
                    </div>
                    <div>
                      <label htmlFor="holidayPrice" className="label">Holiday Price (₹)</label>
                      <input
                        type="number"
                        id="holidayPrice"
                        name="pricing.holidayPrice"
                        value={formData.pricing.holidayPrice}
                        onChange={handleChange}
                        className="input-field"
                        min="0"
                        step="100"
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="totalRooms" className="label">Total Rooms *</label>
                      <input
                        type="number"
                        id="totalRooms"
                        name="totalRooms"
                        value={formData.totalRooms}
                        onChange={handleChange}
                        className={`input-field ${errors.totalRooms ? 'border-red-500 focus:ring-red-500' : ''}`}
                        min="1"
                        max="100"
                      />
                      {errors.totalRooms && <p className="mt-1 text-sm text-red-600">{errors.totalRooms}</p>}
                    </div>
                    <div>
                      <label className="label">Tax Inclusive</label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="pricing.taxInclusive"
                          checked={formData.pricing.taxInclusive}
                          onChange={handleChange}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Price includes tax</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="border-b border-gray-100 pb-6">
                  <h3 className="font-medium text-gray-900 mb-4">Amenities</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { key: 'bedType', label: 'Bed Type', type: 'select', options: BED_TYPES },
                      { key: 'bedCount', label: 'Bed Count', type: 'number', min: 1, max: 5 },
                      { key: 'attachedBathroom', label: 'Attached Bathroom', type: 'checkbox' },
                      { key: 'hotWater', label: 'Hot Water', type: 'checkbox' },
                      { key: 'tv', label: 'TV', type: 'checkbox' },
                      { key: 'wifi', label: 'WiFi', type: 'checkbox' },
                      { key: 'ac', label: 'AC', type: 'checkbox' },
                      { key: 'fan', label: 'Fan', type: 'checkbox' },
                      { key: 'wardrobe', label: 'Wardrobe', type: 'checkbox' },
                      { key: 'dressingTable', label: 'Dressing Table', type: 'checkbox' },
                      { key: 'balcony', label: 'Balcony', type: 'checkbox' },
                      { key: 'window', label: 'Window', type: 'checkbox' },
                      { key: 'intercom', label: 'Intercom', type: 'checkbox' },
                      { key: 'safe', label: 'Safe', type: 'checkbox' },
                      { key: 'miniFridge', label: 'Mini Fridge', type: 'checkbox' },
                      { key: 'teaCoffeeMaker', label: 'Tea/Coffee Maker', type: 'checkbox' },
                    ].map((amenity) => (
                      <label key={amenity.key} className="flex items-center gap-2 cursor-pointer">
                        {amenity.type === 'checkbox' ? (
                          <>
                            <input
                              type="checkbox"
                              name={`amenities.${amenity.key}`}
                              checked={formData.amenities[amenity.key]}
                              onChange={handleChange}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">{amenity.label}</span>
                          </>
                        ) : amenity.type === 'select' ? (
                          <>
                            <span className="text-sm text-gray-700 w-24">{amenity.label}</span>
                            <select
                              name={`amenities.${amenity.key}`}
                              value={formData.amenities[amenity.key]}
                              onChange={handleChange}
                              className="input-field flex-1"
                            >
                              {amenity.options.map(opt => (
                                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1).replace('_', ' ')}</option>
                              ))}
                            </select>
                          </>
                        ) : (
                          <>
                            <span className="text-sm text-gray-700 w-24">{amenity.label}</span>
                            <input
                              type="number"
                              name={`amenities.${amenity.key}`}
                              value={formData.amenities[amenity.key]}
                              onChange={handleChange}
                              className="input-field flex-1"
                              min={amenity.min}
                              max={amenity.max}
                            />
                          </>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Pricing Rules */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Pricing Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="advancePercentage" className="label">Advance Payment (%)</label>
                      <input
                        type="number"
                        id="advancePercentage"
                        name="pricingRules.advancePercentage"
                        value={formData.pricingRules.advancePercentage}
                        onChange={handleChange}
                        className="input-field"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label htmlFor="minimumStay" className="label">Minimum Stay (nights)</label>
                      <input
                        type="number"
                        id="minimumStay"
                        name="pricingRules.minimumStay"
                        value={formData.pricingRules.minimumStay}
                        onChange={handleChange}
                        className="input-field"
                        min="1"
                        max="30"
                      />
                    </div>
                    <div>
                      <label htmlFor="maximumStay" className="label">Maximum Stay (nights)</label>
                      <input
                        type="number"
                        id="maximumStay"
                        name="pricingRules.maximumStay"
                        value={formData.pricingRules.maximumStay}
                        onChange={handleChange}
                        className="input-field"
                        min="1"
                        max="90"
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          name="pricingRules.earlyBirdDiscount.enabled"
                          checked={formData.pricingRules.earlyBirdDiscount.enabled}
                          onChange={handleChange}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="font-medium text-gray-900">Early Bird Discount</span>
                      </label>
                      {formData.pricingRules.earlyBirdDiscount.enabled && (
                        <div className="grid grid-cols-2 gap-4 ml-6">
                          <div>
                            <label htmlFor="earlyBirdDays" className="label">Days Before</label>
                            <input
                              type="number"
                              id="earlyBirdDays"
                              name="pricingRules.earlyBirdDiscount.daysBefore"
                              value={formData.pricingRules.earlyBirdDiscount.daysBefore}
                              onChange={handleChange}
                              className="input-field"
                              min="1"
                              max="60"
                            />
                          </div>
                          <div>
                            <label htmlFor="earlyBirdDiscount" className="label">Discount (%)</label>
                            <input
                              type="number"
                              id="earlyBirdDiscount"
                              name="pricingRules.earlyBirdDiscount.discountPercentage"
                              value={formData.pricingRules.earlyBirdDiscount.discountPercentage}
                              onChange={handleChange}
                              className="input-field"
                              min="0"
                              max="50"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          name="pricingRules.lastMinuteDiscount.enabled"
                          checked={formData.pricingRules.lastMinuteDiscount.enabled}
                          onChange={handleChange}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="font-medium text-gray-900">Last Minute Discount</span>
                      </label>
                      {formData.pricingRules.lastMinuteDiscount.enabled && (
                        <div className="grid grid-cols-2 gap-4 ml-6">
                          <div>
                            <label htmlFor="lastMinuteDays" className="label">Days Before</label>
                            <input
                              type="number"
                              id="lastMinuteDays"
                              name="pricingRules.lastMinuteDiscount.daysBefore"
                              value={formData.pricingRules.lastMinuteDiscount.daysBefore}
                              onChange={handleChange}
                              className="input-field"
                              min="1"
                              max="7"
                            />
                          </div>
                          <div>
                            <label htmlFor="lastMinuteDiscount" className="label">Discount (%)</label>
                            <input
                              type="number"
                              id="lastMinuteDiscount"
                              name="pricingRules.lastMinuteDiscount.discountPercentage"
                              value={formData.pricingRules.lastMinuteDiscount.discountPercentage}
                              onChange={handleChange}
                              className="input-field"
                              min="0"
                              max="50"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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
                        {editingCategory ? 'Update' : 'Create'} Category
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