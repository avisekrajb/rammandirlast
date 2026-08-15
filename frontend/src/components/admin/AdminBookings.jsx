import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, X, Clock, Calendar, User, Phone, Tag, FileText, 
  ChevronDown, ChevronUp, Plus, Trash2, Edit2, 
  Eye, EyeOff, Settings, CalendarDays, AlertCircle,
  Search, Filter, Grid, List, Sparkles, Shield, Save,
  Image, Upload, Trash
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const AdminBookings = ({ bookings, setBookings, t }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [pujaTypes, setPujaTypes] = useState([]);
  const [newPujaType, setNewPujaType] = useState('');
  const [editingPujaType, setEditingPujaType] = useState(null);
  const [showPujaModal, setShowPujaModal] = useState(false);
  
  const [dateLimits, setDateLimits] = useState({});
  const [newDateLimit, setNewDateLimit] = useState({ date: '', limit: 10 });
  
  const [bookingAvailable, setBookingAvailable] = useState(true);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [savingMessage, setSavingMessage] = useState(false);
  
  // Background Photo State
  const [bookingBgPhoto, setBookingBgPhoto] = useState('/4.jpg');
  const [uploadingBg, setUploadingBg] = useState(false);
  const fileInputRef = useRef(null);
  const [previewImages, setPreviewImages] = useState([]);

  const statusColors = {
    pending: '#F59E0B',
    confirmed: '#10B981',
    completed: '#3B82F6',
    cancelled: '#EF4444',
  };

  const statusBadgeClasses = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-blue-50 text-blue-700 border-blue-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/admin/settings');
        const settings = response.data;
        if (settings?.pujaTypes) {
          setPujaTypes(settings.pujaTypes);
        } else {
          setPujaTypes(['Ram Puja', 'Satyanarayan Puja', 'Griha Pravesh Puja', 'Birthday Puja', 'General Darshan Booking']);
        }
        if (settings?.dateLimits) {
          setDateLimits(settings.dateLimits);
        }
        if (settings?.bookingAvailable !== undefined) {
          setBookingAvailable(settings.bookingAvailable);
        }
        if (settings?.availabilityMessage) {
          setAvailabilityMessage(settings.availabilityMessage);
        } else {
          setAvailabilityMessage('Bookings are currently unavailable. Please check back later.');
        }
        if (settings?.bookingBgPhoto) {
          setBookingBgPhoto(settings.bookingBgPhoto);
        }
        // Initialize preview images with the current photo
        if (settings?.bookingBgPhoto && settings.bookingBgPhoto !== '/4.jpg') {
          setPreviewImages([settings.bookingBgPhoto]);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        setPujaTypes(['Ram Puja', 'Satyanarayan Puja', 'Griha Pravesh Puja', 'Birthday Puja', 'General Darshan Booking']);
        setAvailabilityMessage('Bookings are currently unavailable. Please check back later.');
      }
    };
    fetchSettings();
  }, []);

  // Handle Background Photo Upload
  const handleBgPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be less than 5MB', 'error');
      return;
    }

    setUploadingBg(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/admin/upload/booking-bg', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBookingBgPhoto(response.data.url);
      await api.put('/admin/settings', { bookingBgPhoto: response.data.url });
      // Add to preview images
      setPreviewImages(prev => [...prev, response.data.url]);
      showToast('Background photo uploaded successfully', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      showToast(error.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploadingBg(false);
    }
    e.target.value = '';
  };

  // Remove Background Photo
  const handleRemoveBgPhoto = async (imageToRemove) => {
    if (!window.confirm('Remove this background photo?')) return;
    setUploadingBg(true);
    try {
      // If removing the current active photo
      if (imageToRemove === bookingBgPhoto) {
        setBookingBgPhoto('/4.jpg');
        await api.put('/admin/settings', { bookingBgPhoto: '/4.jpg' });
      }
      // Remove from preview list
      setPreviewImages(prev => prev.filter(img => img !== imageToRemove));
      showToast('Photo removed', 'success');
    } catch (error) {
      console.error('Error removing photo:', error);
      showToast('Failed to remove photo', 'error');
    } finally {
      setUploadingBg(false);
    }
  };

  // Set as active background
  const handleSetAsActive = async (imageUrl) => {
    setUploadingBg(true);
    try {
      setBookingBgPhoto(imageUrl);
      await api.put('/admin/settings', { bookingBgPhoto: imageUrl });
      showToast('Background photo updated', 'success');
    } catch (error) {
      console.error('Error setting active photo:', error);
      showToast('Failed to update background', 'error');
    } finally {
      setUploadingBg(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    setLoading(true);
    try {
      await api.put(`/admin/bookings/${id}/status`, { status });
      setBookings(bookings.map(b => b._id === id ? { ...b, status } : b));
      showToast('Booking status updated', 'success');
    } catch (error) {
      console.error('Update status error:', error);
      showToast('Failed to update status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    return statusBadgeClasses[status] || statusBadgeClasses.pending;
  };

  // Puja Type Functions
  const handleAddPujaType = async () => {
    if (!newPujaType.trim()) {
      showToast('Please enter a puja type name', 'error');
      return;
    }
    if (pujaTypes.includes(newPujaType.trim())) {
      showToast('Puja type already exists', 'error');
      return;
    }
    setLoading(true);
    try {
      const updatedTypes = [...pujaTypes, newPujaType.trim()];
      await api.put('/admin/settings', { pujaTypes: updatedTypes });
      setPujaTypes(updatedTypes);
      setNewPujaType('');
      showToast('Puja type added successfully', 'success');
    } catch (error) {
      showToast('Failed to add puja type', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePujaType = async (typeToDelete) => {
    if (!window.confirm(`Delete "${typeToDelete}"?`)) return;
    setLoading(true);
    try {
      const updatedTypes = pujaTypes.filter(t => t !== typeToDelete);
      await api.put('/admin/settings', { pujaTypes: updatedTypes });
      setPujaTypes(updatedTypes);
      showToast('Puja type deleted', 'success');
    } catch (error) {
      showToast('Failed to delete', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPujaType = async (oldType, newType) => {
    if (!newType.trim() || oldType === newType.trim()) {
      setEditingPujaType(null);
      return;
    }
    if (pujaTypes.includes(newType.trim())) {
      showToast('Puja type already exists', 'error');
      return;
    }
    setLoading(true);
    try {
      const updatedTypes = pujaTypes.map(t => t === oldType ? newType.trim() : t);
      await api.put('/admin/settings', { pujaTypes: updatedTypes });
      setPujaTypes(updatedTypes);
      setEditingPujaType(null);
      showToast('Puja type updated', 'success');
    } catch (error) {
      showToast('Failed to update', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Date Limit Functions
  const handleAddDateLimit = async () => {
    if (!newDateLimit.date) {
      showToast('Please select a date', 'error');
      return;
    }
    setLoading(true);
    try {
      const updatedLimits = { ...dateLimits, [newDateLimit.date]: newDateLimit.limit };
      await api.put('/admin/settings', { dateLimits: updatedLimits });
      setDateLimits(updatedLimits);
      setNewDateLimit({ date: '', limit: 10 });
      showToast('Date limit added', 'success');
    } catch (error) {
      showToast('Failed to add date limit', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDateLimit = async (date) => {
    if (!window.confirm(`Delete limit for ${date}?`)) return;
    setLoading(true);
    try {
      const updatedLimits = { ...dateLimits };
      delete updatedLimits[date];
      await api.put('/admin/settings', { dateLimits: updatedLimits });
      setDateLimits(updatedLimits);
      showToast('Date limit deleted', 'success');
    } catch (error) {
      showToast('Failed to delete', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Booking Availability
  const toggleBookingAvailability = async () => {
    setLoading(true);
    try {
      const newStatus = !bookingAvailable;
      await api.put('/admin/settings', { 
        bookingAvailable: newStatus,
        availabilityMessage: availabilityMessage || 'Bookings are currently unavailable. Please check back later.'
      });
      setBookingAvailable(newStatus);
      showToast(newStatus ? 'Bookings enabled' : 'Bookings disabled', 'success');
    } catch (error) {
      console.error('Error toggling booking availability:', error);
      showToast('Failed to update', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save Availability Message
  const saveAvailabilityMessage = async () => {
    setSavingMessage(true);
    try {
      await api.put('/admin/settings', { 
        availabilityMessage: availabilityMessage || 'Bookings are currently unavailable. Please check back later.'
      });
      showToast('Availability message saved successfully', 'success');
    } catch (error) {
      console.error('Error saving message:', error);
      showToast('Failed to save message', 'error');
    } finally {
      setSavingMessage(false);
    }
  };

  const getDateLimit = (date) => dateLimits[date] || null;
  const getBookingsForDate = (date) => bookings.filter(b => b.date === date).length;
  const isDateFull = (date) => {
    const limit = getDateLimit(date);
    if (!limit) return false;
    return getBookingsForDate(date) >= limit;
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          booking.phone?.includes(searchTerm) ||
                          booking.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          booking.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="space-y-6">
      {/* Background Photo Management - Mini Square Grid */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 bg-gradient-to-r from-[#7A0000]/10 to-[#A00000]/5 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-gray-700 font-semibold flex items-center gap-2">
            <Image size={18} className="text-[#7A0000]" />
            Booking Page Background Photos
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingBg}
              className="px-3 py-1.5 bg-[#7A0000] text-white rounded-lg text-xs font-semibold hover:bg-[#5A0000] transition-all disabled:opacity-50 flex items-center gap-1"
            >
              <Upload size={14} />
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleBgPhotoUpload}
              className="hidden"
            />
          </div>
        </div>
        
        {/* Mini Square Grid */}
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Default Image */}
            <div className="relative group">
              <div className={`aspect-square rounded-xl overflow-hidden border-2 ${bookingBgPhoto === '/4.jpg' ? 'border-[#7A0000] ring-2 ring-[#7A0000]/20' : 'border-gray-200'}`}>
                <img
                  src="/4.jpg"
                  alt="Default Background"
                  className="w-full h-full object-cover"
                />
                {bookingBgPhoto === '/4.jpg' && (
                  <div className="absolute top-1 right-1 bg-[#7A0000] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                    Active
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {bookingBgPhoto !== '/4.jpg' && (
                  <button
                    onClick={() => handleSetAsActive('/4.jpg')}
                    className="p-1 bg-white/90 rounded text-[#7A0000] hover:bg-white transition-all text-[10px] font-semibold"
                  >
                    Set
                  </button>
                )}
              </div>
              <p className="text-[9px] text-gray-400 text-center mt-0.5 truncate">Default</p>
            </div>

            {/* Uploaded Images */}
            {previewImages.map((img, index) => (
              <div key={index} className="relative group">
                <div className={`aspect-square rounded-xl overflow-hidden border-2 ${bookingBgPhoto === img ? 'border-[#7A0000] ring-2 ring-[#7A0000]/20' : 'border-gray-200'}`}>
                  <img
                    src={img}
                    alt={`Background ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/4.jpg';
                    }}
                  />
                  {bookingBgPhoto === img && (
                    <div className="absolute top-1 right-1 bg-[#7A0000] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                      Active
                    </div>
                  )}
                  {uploadingBg && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  {bookingBgPhoto !== img && (
                    <button
                      onClick={() => handleSetAsActive(img)}
                      className="p-1 bg-white/90 rounded text-[#7A0000] hover:bg-white transition-all text-[10px] font-semibold"
                    >
                      Set
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveBgPhoto(img)}
                    className="p-1 bg-red-500/90 rounded text-white hover:bg-red-600 transition-all"
                  >
                    <Trash size={12} />
                  </button>
                </div>
                <p className="text-[9px] text-gray-400 text-center mt-0.5 truncate">
                  Photo {index + 1}
                </p>
              </div>
            ))}
          </div>
          
          {previewImages.length === 0 && (
            <div className="text-center py-4 text-gray-400 text-sm">
              No custom photos uploaded. Upload images to use as booking page background.
            </div>
          )}
          
          <p className="text-xs text-gray-400 mt-3">
            <span className="font-medium">Active:</span> {bookingBgPhoto === '/4.jpg' ? 'Default background' : 'Custom photo'} • 
            <span className="ml-1">Uploaded: {previewImages.length} photos</span>
          </p>
        </div>
      </div>

      {/* Booking Availability Toggle */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 bg-gradient-to-r from-[#7A0000]/10 to-[#A00000]/5 border-b border-gray-100">
          <h4 className="text-gray-700 font-semibold flex items-center gap-2">
            <Settings size={18} className="text-[#7A0000]" />
            Booking Settings
          </h4>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Booking Available:</span>
              <button
                onClick={toggleBookingAvailability}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  bookingAvailable ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  bookingAvailable ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
              <span className={`text-sm font-semibold ${bookingAvailable ? 'text-emerald-600' : 'text-red-500'}`}>
                {bookingAvailable ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          
          {/* Availability Message Input with Save Button */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Availability Message <span className="text-gray-400">(shown to users when booking is disabled)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={availabilityMessage}
                  onChange={(e) => setAvailabilityMessage(e.target.value)}
                  placeholder="Enter availability message..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:border-[#7A0000] focus:outline-none text-sm"
                  disabled={bookingAvailable}
                />
                <button
                  onClick={saveAvailabilityMessage}
                  disabled={savingMessage || bookingAvailable}
                  className="px-4 py-2 bg-[#7A0000] text-white rounded-xl text-sm font-semibold hover:bg-[#5A0000] transition-all disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                >
                  {savingMessage ? (
                    <span className="flex items-center gap-1">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    <>
                      <Save size={14} />
                      Save
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {bookingAvailable 
                  ? 'Message will be shown when booking is disabled' 
                  : `Current message: "${availabilityMessage || 'No message set'}"`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Puja Type Management */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 bg-gradient-to-r from-[#7A0000]/10 to-[#A00000]/5 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-gray-700 font-semibold flex items-center gap-2">
            <Tag size={18} className="text-[#7A0000]" />
            Manage Puja Types
          </h4>
          <button
            onClick={() => setShowPujaModal(!showPujaModal)}
            className="text-gray-500 hover:text-[#7A0000] text-sm flex items-center gap-1 transition-colors"
          >
            {showPujaModal ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPujaModal ? 'Hide' : 'Manage'}
          </button>
        </div>
        
        {showPujaModal && (
          <div className="p-6">
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={newPujaType}
                onChange={(e) => setNewPujaType(e.target.value)}
                placeholder="Enter new puja type..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:border-[#7A0000] focus:outline-none text-sm"
              />
              <button
                onClick={handleAddPujaType}
                disabled={loading || !newPujaType.trim()}
                className="px-4 py-2 bg-[#7A0000] text-white rounded-xl text-sm font-semibold hover:bg-[#5A0000] transition-all disabled:opacity-50 flex items-center gap-1"
              >
                <Plus size={16} /> Add
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {pujaTypes.map((type) => (
                <div key={type} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5">
                  {editingPujaType === type ? (
                    <input
                      type="text"
                      defaultValue={type}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditPujaType(type, e.target.value);
                        if (e.key === 'Escape') setEditingPujaType(null);
                      }}
                      onBlur={(e) => handleEditPujaType(type, e.target.value)}
                      className="w-32 px-2 py-0.5 border border-[#7A0000] rounded focus:outline-none text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm text-gray-700">{type}</span>
                  )}
                  <button onClick={() => setEditingPujaType(type)} className="text-gray-400 hover:text-[#7A0000] transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDeletePujaType(type)} className="text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Manage puja types that appear in the booking form</p>
          </div>
        )}
      </div>

      {/* Date Limits */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 bg-gradient-to-r from-[#7A0000]/10 to-[#A00000]/5 border-b border-gray-100">
          <h4 className="text-gray-700 font-semibold flex items-center gap-2">
            <CalendarDays size={18} className="text-[#7A0000]" />
            Date Booking Limits
          </h4>
        </div>
        <div className="p-6">
          <div className="flex gap-3 mb-4">
            <input
              type="date"
              value={newDateLimit.date}
              onChange={(e) => setNewDateLimit({ ...newDateLimit, date: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:border-[#7A0000] focus:outline-none text-sm"
            />
            <input
              type="number"
              value={newDateLimit.limit}
              onChange={(e) => setNewDateLimit({ ...newDateLimit, limit: parseInt(e.target.value) || 0 })}
              min="0"
              className="w-24 px-4 py-2 border border-gray-200 rounded-xl focus:border-[#7A0000] focus:outline-none text-sm"
              placeholder="Limit"
            />
            <button
              onClick={handleAddDateLimit}
              disabled={loading || !newDateLimit.date}
              className="px-4 py-2 bg-[#7A0000] text-white rounded-xl text-sm font-semibold hover:bg-[#5A0000] transition-all disabled:opacity-50 flex items-center gap-1"
            >
              <Plus size={16} /> Set Limit
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {Object.entries(dateLimits).map(([date, limit]) => {
              const booked = getBookingsForDate(date);
              const isFull = booked >= limit;
              const isZero = limit <= 0;
              return (
                <div key={date} className={`flex items-center gap-2 border rounded-full px-3 py-1.5 ${
                  isZero ? 'bg-red-50 border-red-300' :
                  isFull ? 'bg-orange-50 border-orange-300' : 'bg-emerald-50 border-emerald-300'
                }`}>
                  <span className="text-sm font-medium">{date}</span>
                  <span className="text-xs text-gray-500">{booked}/{limit}</span>
                  {isZero && <AlertCircle size={14} className="text-red-500" />}
                  {isFull && !isZero && <AlertCircle size={14} className="text-orange-500" />}
                  <button onClick={() => handleDeleteDateLimit(date)} className="text-gray-400 hover:text-red-600 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
          {Object.keys(dateLimits).length === 0 && (
            <p className="text-sm text-gray-400">No date limits set. All dates are unlimited.</p>
          )}
        </div>
      </div>

      {/* Bookings List - Same as before */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#7A0000]/10 to-[#A00000]/5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-[#7A0000]" />
            <h4 className="text-gray-700 font-semibold">All Bookings</h4>
            <span className="text-xs text-gray-400 bg-white px-2.5 py-0.5 rounded-full border border-gray-200">
              {bookings?.length || 0}
            </span>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search bookings..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:border-[#7A0000] focus:outline-none text-sm w-40 sm:w-56 bg-white"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:border-[#7A0000] focus:outline-none text-sm bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="flex bg-white rounded-xl border border-gray-200 p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'table' ? 'bg-[#7A0000] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Grid size={14} /> Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'cards' ? 'bg-[#7A0000] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List size={14} /> Cards
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {sortedBookings.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No bookings found</p>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Devotee</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Phone</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Email</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Puja</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBookings.map((booking) => (
                    <tr key={booking._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-semibold text-gray-800">{booking.name}</p>
                          {booking.description && (
                            <p className="text-xs text-gray-400 truncate max-w-[150px]">{booking.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-600 hidden md:table-cell">{booking.phone}</td>
                      <td className="py-3 px-3 text-gray-600 hidden lg:table-cell">{booking.email}</td>
                      <td className="py-3 px-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#7A0000]/10 text-[#7A0000] border border-[#7A0000]/20">
                          {booking.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-600 hidden sm:table-cell">{booking.date}</td>
                      <td className="py-3 px-3">
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                          disabled={loading}
                          className={`text-xs font-semibold px-3 py-1 rounded-full border-2 focus:outline-none disabled:opacity-50 cursor-pointer ${getStatusBadge(booking.status)}`}
                          style={{ borderColor: statusColors[booking.status] }}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setExpandedId(expandedId === booking._id ? null : booking._id)}
                          className="text-gray-400 hover:text-[#7A0000] transition-colors"
                        >
                          {expandedId === booking._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedBookings.map((booking) => (
                <div key={booking._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#7A0000] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {booking.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{booking.name}</p>
                        <p className="text-xs text-gray-500">{booking.phone}</p>
                      </div>
                    </div>
                    <select
                      value={booking.status}
                      onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                      disabled={loading}
                      className={`text-xs font-semibold px-3 py-1 rounded-full border-2 focus:outline-none disabled:opacity-50 cursor-pointer ${getStatusBadge(booking.status)}`}
                      style={{ borderColor: statusColors[booking.status] }}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Puja Type</p>
                      <p className="font-medium text-gray-700">{booking.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Date</p>
                      <p className="font-medium text-gray-700">{booking.date}</p>
                    </div>
                    {booking.description && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-400">Description</p>
                        <p className="text-gray-600 text-sm">{booking.description}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                    <span>Booked: {new Date(booking.createdAt).toLocaleDateString()}</span>
                    <span>#{booking._id.slice(-6)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBookings;