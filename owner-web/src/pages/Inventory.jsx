import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Filter,
  CalendarDays,
  DoorOpen,
} from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, isAfter, parseISO } from 'date-fns';
import React from 'react';

const ROOM_TYPE_COLORS = {
  single: 'bg-blue-100 text-blue-800',
  double: 'bg-green-100 text-green-800',
  triple: 'bg-yellow-100 text-yellow-800',
  quad: 'bg-orange-100 text-orange-800',
  family: 'bg-purple-100 text-purple-800',
  dormitory: 'bg-pink-100 text-pink-800',
  suite: 'bg-indigo-100 text-indigo-800',
  deluxe: 'bg-teal-100 text-teal-800',
  standard: 'bg-gray-100 text-gray-800',
};

export default function Inventory() {
  const { user } = useAuth();
  const [lodges, setLodges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedLodgeId, setSelectedLodgeId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [inventory, setInventory] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  useEffect(() => {
    fetchLodges();
  }, []);

  useEffect(() => {
    if (selectedLodgeId) {
      fetchCategories();
    } else {
      setCategories([]);
    }
  }, [selectedLodgeId]);

  useEffect(() => {
    if (selectedLodgeId && selectedCategoryId) {
      fetchInventory();
    } else {
      setInventory({});
    }
  }, [selectedLodgeId, selectedCategoryId, currentMonth, viewMode, dateRange]);

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
      const categoriesData = response.data.data?.categories || [];
      setCategories(categoriesData);
      if (categoriesData.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(categoriesData[0]._id);
      } else {
        setSelectedCategoryId('');
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load room categories');
    }
  };

  const fetchInventory = async () => {
    if (!selectedLodgeId || !selectedCategoryId) return;

    setLoading(true);
    try {
      let startDate, endDate;
      if (viewMode === 'month') {
        startDate = startOfMonth(currentMonth);
        endDate = endOfMonth(currentMonth);
      } else if (dateRange.start && dateRange.end) {
        startDate = dateRange.start;
        endDate = dateRange.end;
      } else {
        startDate = startOfMonth(currentMonth);
        endDate = endOfMonth(currentMonth);
      }

      const response = await api.get(`/inventory`, {
        params: {
          lodge: selectedLodgeId,
          roomCategory: selectedCategoryId,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
        },
      });

      const inventoryData = response.data.data?.inventory || [];
      const inventoryMap = {};
      inventoryData.forEach(item => {
        inventoryMap[item.date.split('T')[0]] = item;
      });
      setInventory(inventoryMap);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = (dateStr, field, value) => {
    const current = inventory[dateStr] || { date: dateStr, availableRooms: 0, blockedRooms: 0, isClosed: false };
    const updated = { ...current, [field]: value };
    setInventory(prev => ({ ...prev, [dateStr]: updated }));
  };

  const handleSave = async () => {
    if (!selectedLodgeId || !selectedCategoryId) return;

    const category = categories.find(c => c._id === selectedCategoryId);
    const totalRooms = category?.totalRooms || 0;

    const updates = Object.entries(inventory).map(([dateStr, data]) => ({
      roomCategoryId: selectedCategoryId,
      date: dateStr,
      availableRooms: Math.min(data.availableRooms || 0, totalRooms),
      blockedRooms: data.blockedRooms || 0,
      isClosed: data.isClosed || false,
      closureReason: data.closureReason || '',
    }));

    setSaving(true);
    try {
      await api.post('/inventory/bulk-update', { updates, userId: user._id });
      toast.success('Inventory updated successfully!');
      fetchInventory();
    } catch (error) {
      console.error('Failed to save inventory:', error);
      toast.error('Failed to save inventory');
    } finally {
      setSaving(false);
    }
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + direction);
      return newMonth;
    });
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getDaysInRange = () => {
    if (!dateRange.start || !dateRange.end) return [];
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  };

  const days = viewMode === 'month' ? getDaysInMonth() : getDaysInRange();
  const weeks = useMemo(() => {
    const result = [];
    let week = [];
    days.forEach(day => {
      if (week.length === 0 && day.getDay() !== 0) {
        // Fill empty days at start
        for (let i = 0; i < day.getDay(); i++) {
          week.push(null);
        }
      }
      week.push(day);
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
    });
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      result.push(week);
    }
    return result;
  }, [days]);

  const selectedCategory = categories.find(c => c._id === selectedCategoryId);
  const totalRooms = selectedCategory?.totalRooms || 0;

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
          <h1 className="text-2xl font-bold text-gray-900">Room Inventory</h1>
          <p className="text-gray-600 mt-1">Manage date-wise room availability and pricing</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedLodgeId}
            onChange={(e) => {
              setSelectedLodgeId(e.target.value);
              setSelectedCategoryId('');
            }}
            className="input-field w-auto"
          >
            {lodges.map(lodge => (
              <option key={lodge._id} value={lodge._id}>{lodge.name}</option>
            ))}
          </select>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="input-field w-auto"
            disabled={categories.length === 0}
          >
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>
                {cat.name} ({cat.totalRooms} rooms)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 border-l border-gray-200 pl-4 ml-4">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    viewMode === 'month'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <CalendarDays className="w-4 h-4 inline mr-1" /> Month
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    viewMode === 'week'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Calendar className="w-4 h-4 inline mr-1" /> Custom Range
                </button>
              </div>

              {viewMode === 'week' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value ? parseISO(e.target.value) : null }))}
                    className="input-field w-auto"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="date"
                    value={dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value ? parseISO(e.target.value) : null }))}
                    className="input-field w-auto"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleSave} className="btn-primary" disabled={saving || Object.keys(inventory).length === 0}>
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-5 h-5" />
                    Save Changes
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Grid */}
      {selectedCategory && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Date
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Total
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Available
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Blocked
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Closed
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Price (₹)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {weeks.map((week, weekIndex) => (
                  <React.Fragment key={weekIndex}>
                    <tr className={weekIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      {week.map((day, dayIndex) => {
                      if (!day) {
                        return <td key={dayIndex} className="px-3 py-2 bg-gray-50" />;
                      }

                      const dateStr = format(day, 'yyyy-MM-dd');
                      const dayData = inventory[dateStr] || {};
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      const isPast = isBefore(day, new Date());
                      const available = dayData.availableRooms ?? totalRooms;
                      const blocked = dayData.blockedRooms || 0;
                      const closed = dayData.isClosed || false;
                      const price = dayData.priceSnapshot?.basePrice || selectedCategory?.pricing?.basePrice || 0;

                      return (
                        <td key={dayIndex} className="px-3 py-2 align-top">
                          <div className={`flex flex-col items-center gap-1 ${isPast ? 'opacity-50' : ''} ${isWeekend ? 'bg-amber-50' : ''}`}>
                            <span className={`text-sm font-medium ${isWeekend ? 'text-amber-700' : 'text-gray-900'} ${isPast ? 'text-gray-400' : ''}`}>
                              {format(day, 'd')}
                            </span>
                            <span className="text-xs text-gray-400 capitalize">{format(day, 'EEE')}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  <tr key={`edit-${weekIndex}`} className={weekIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    {week.map((day, dayIndex) => {
                    if (!day) {
                      return <td key={`edit-${dayIndex}`} className="px-3 py-1 bg-gray-50" />;
                    }

                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayData = inventory[dateStr] || {};
                    const isPast = isBefore(day, new Date());
                    const available = dayData.availableRooms ?? totalRooms;
                    const blocked = dayData.blockedRooms || 0;
                    const closed = dayData.isClosed || false;
                    const price = dayData.priceSnapshot?.basePrice || selectedCategory?.pricing?.basePrice || 0;

                    return (
                      <React.Fragment key={`cells-${dayIndex}`}>
                        <td key={`total-${dayIndex}`} className="px-3 py-1 text-center text-sm text-gray-600">
                          {totalRooms}
                        </td>
                        <td key={`avail-${dayIndex}`} className="px-3 py-1 text-center">
                          {!isPast && !closed ? (
                            <input
                              type="number"
                              value={available}
                              onChange={(e) => handleCellChange(dateStr, 'availableRooms', Math.max(0, Math.min(totalRooms, parseInt(e.target.value) || 0)))}
                              className="w-20 px-2 py-1 text-center text-sm border border-gray-200 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                              min="0"
                              max={totalRooms}
                              disabled={closed}
                            />
                          ) : (
                            <span className="text-sm text-gray-500">{available}</span>
                          )}
                        </td>
                        <td key={`block-${dayIndex}`} className="px-3 py-1 text-center">
                          {!isPast && !closed ? (
                            <input
                              type="number"
                              value={blocked}
                              onChange={(e) => handleCellChange(dateStr, 'blockedRooms', Math.max(0, Math.min(totalRooms - available, parseInt(e.target.value) || 0)))}
                              className="w-20 px-2 py-1 text-center text-sm border border-gray-200 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                              min="0"
                              max={totalRooms - available}
                              disabled={closed}
                            />
                          ) : (
                            <span className="text-sm text-gray-500">{blocked}</span>
                          )}
                        </td>
                        <td key={`closed-${dayIndex}`} className="px-3 py-1 text-center">
                          {!isPast ? (
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={closed}
                                onChange={(e) => handleCellChange(dateStr, 'isClosed', e.target.checked)}
                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              />
                              <span className="text-sm text-gray-700">Closed</span>
                            </label>
                          ) : (
                            <span className="text-sm text-gray-500">{closed ? 'Yes' : 'No'}</span>
                          )}
                        </td>
                        <td key={`price-${dayIndex}`} className="px-3 py-1 text-center">
                          {!isPast ? (
                            <input
                              type="number"
                              value={price}
                              onChange={(e) => handleCellChange(dateStr, 'priceSnapshot', { ...dayData.priceSnapshot, basePrice: parseInt(e.target.value) || 0 })}
                              className="w-24 px-2 py-1 text-center text-sm border border-gray-200 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                              min="0"
                              step="100"
                            />
                          ) : (
                            <span className="text-sm text-gray-500">₹{price.toLocaleString('en-IN')}</span>
                          )}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-100 rounded" />
              <span>Weekend</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded" />
              <span>Past dates (read-only)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-600 font-medium">Editable</span>
              <span>cells can be modified</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}