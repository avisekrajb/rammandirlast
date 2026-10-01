import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Check, X, Clock, Calendar, User, Phone, Tag, FileText, 
  ChevronDown, ChevronUp, Plus, Trash2, Edit2, 
  Eye, EyeOff, Settings, CalendarDays, AlertCircle,
    Search, Filter, Sparkles, Shield, Save,
  Image, Upload, Trash
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { handleImageError } from '../../utils/imageFallback';
import api from '../../services/api';

// Localized text helper: reads a { en, ne, hi, zh, ta } object
const getLocalizedValue = (obj, lang) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || '';
};

const AdminBookings = ({ bookings, setBookings, t }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('newest');

  // Row selection for bulk delete
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  
  const [pujaTypes, setPujaTypes] = useState([]);
  const [newPujaType, setNewPujaType] = useState('');
  const [editingPujaType, setEditingPujaType] = useState(null);
  const [showPujaModal, setShowPujaModal] = useState(false);
  
  const [dateLimits, setDateLimits] = useState({});
  const [newDateLimit, setNewDateLimit] = useState({ date: '', limit: 10 });
  
  const [bookingAvailable, setBookingAvailable] = useState(true);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [savingMessage, setSavingMessage] = useState(false);

  // Booking page content ("पूजा तथा धार्मिक कार्यक्रम बुकिङ")
  const [bookingContent, setBookingContent] = useState([]);
  const [contentLang, setContentLang] = useState('ne');
  const [savingContent, setSavingContent] = useState(false);
  /*
   * Which content section's editor is open.
   *
   * Every section used to render its full editor at once - four paragraph
   * boxes plus a bullet list per section - so the panel became a wall of forms
   * that was slow to scan. Now the table shows one summary line per section and
   * only the expanded row reveals its editor.
   */
  const [expandedSection, setExpandedSection] = useState(null);
  
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
        if (Array.isArray(settings?.bookingContent)) {
          setBookingContent(settings.bookingContent);
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

  // ===== Booking page content =====
  const emptyLocalized = () => ({ en: '', ne: '', hi: '', zh: '', ta: '' });

  const patchContent = (index, fn) =>
    setBookingContent((prev) => prev.map((s, i) => (i === index ? fn(s) : s)));

  const addContentSection = () => {
    const next = {
      key: `booking_${Date.now()}`,
      title: emptyLocalized(),
      paragraphs: {
        p1: emptyLocalized(),
        p2: emptyLocalized(),
        p3: emptyLocalized(),
        p4: emptyLocalized()
      },
      listTitle: emptyLocalized(),
      points: [],
      group: emptyLocalized(),
      showForm: false,
      order: bookingContent.length,
      enabled: true
    };
    setBookingContent([...bookingContent, next]);
  };

  const removeContentSection = (index) => {
    if (!window.confirm('Remove this section?')) return;
    setBookingContent(bookingContent.filter((_, i) => i !== index));
  };

  const moveContentSection = (index, dir) => {
    const next = [...bookingContent];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setBookingContent(next.map((s, i) => ({ ...s, order: i })));
  };

  const toggleContentSection = (index, field) => {
    patchContent(index, (s) => ({ ...s, [field]: field === 'showForm' ? !s.showForm : s[field] === false }));
  };

  const updateContentField = (index, field, value) => {
    patchContent(index, (s) => ({ ...s, [field]: { ...(s[field] || {}), [contentLang]: value } }));
  };

  const updateContentParagraph = (index, pKey, value) => {
    patchContent(index, (s) => ({
      ...s,
      paragraphs: {
        ...(s.paragraphs || {}),
        [pKey]: { ...(s.paragraphs?.[pKey] || {}), [contentLang]: value }
      }
    }));
  };

  const addContentPoint = (index) => {
    patchContent(index, (s) => ({ ...s, points: [...(s.points || []), emptyLocalized()] }));
  };

  const updateContentPoint = (index, pointIndex, value) => {
    patchContent(index, (s) => ({
      ...s,
      points: (s.points || []).map((p, i) =>
        i === pointIndex ? { ...(p || {}), [contentLang]: value } : p
      )
    }));
  };

  const removeContentPoint = (index, pointIndex) => {
    patchContent(index, (s) => ({
      ...s,
      points: (s.points || []).filter((_, i) => i !== pointIndex)
    }));
  };

  const moveContentPoint = (index, pointIndex, dir) => {
    patchContent(index, (s) => {
      const points = [...(s.points || [])];
      const target = pointIndex + dir;
      if (target < 0 || target >= points.length) return s;
      [points[pointIndex], points[target]] = [points[target], points[pointIndex]];
      return { ...s, points };
    });
  };

  const saveContent = async () => {
    setSavingContent(true);
    try {
      await api.put('/admin/settings', {
        bookingContent: bookingContent.map((s, i) => ({ ...s, order: i }))
      });
      showToast('Booking page content saved', 'success');
    } catch (error) {
      console.error('Error saving booking content:', error);
      showToast('Failed to save booking content', 'error');
    } finally {
      setSavingContent(false);
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

  const sortedBookings = useMemo(() => {
    const list = [...filteredBookings];
    const byName = (a, b) => (a.name || '').localeCompare(b.name || '');
    switch (sortBy) {
      case 'oldest':
        return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'name':
        return list.sort(byName);
      case 'date':
        return list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      case 'status':
        return list.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
      default:
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }, [filteredBookings, sortBy]);

  // Counts for the summary chips, computed from everything (not the filtered
  // set) so the chips stay a stable overview while a filter is active.
  const statusCounts = useMemo(() => {
    const counts = { all: bookings.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    bookings.forEach((b) => {
      if (counts[b.status] !== undefined) counts[b.status] += 1;
    });
    return counts;
  }, [bookings]);

  const totalPages = Math.max(1, Math.ceil(sortedBookings.length / perPage));

  // Keep the page in range when a search or filter shrinks the result set.
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus, perPage]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedBookings = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedBookings.slice(start, start + perPage);
  }, [sortedBookings, page, perPage]);

  const toggleSort = (key) => setSortBy(sortBy === key ? 'newest' : key);

  // ===== Bulk delete =====
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleSelect = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // Selects every booking on the current page, not just the filtered view.
  const allOnPageSelected =
    pagedBookings.length > 0 && pagedBookings.every((b) => selectedSet.has(b._id));
  const someOnPageSelected =
    pagedBookings.some((b) => selectedSet.has(b._id)) && !allOnPageSelected;

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pagedBookings.forEach((b) => next.delete(b._id));
      } else {
        pagedBookings.forEach((b) => next.add(b._id));
      }
      return Array.from(next);
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `Delete ${selectedIds.length} booking(s)? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await api.delete('/admin/bookings', { data: { ids: selectedIds } });
      const removed =
        res.data?.deletedCount ?? selectedIds.length;

      // Drop the deleted rows locally so the table reflects the change without
      // waiting for a refetch, and reconcile the current page after removal.
      const remaining = bookings.filter((b) => !selectedSet.has(b._id));
      setBookings(remaining);
      setSelectedIds([]);

      showToast(`${removed} booking(s) deleted`, 'success');
    } catch (error) {
      console.error('Bulk delete error:', error);
      showToast(
        error.response?.data?.message || 'Failed to delete bookings',
        'error'
      );
    } finally {
      setDeleting(false);
    }
  };

  // Clear a selection that points at rows no longer on screen (e.g. filtered out).
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.length === 0) return prev;
      const live = new Set(bookings.map((b) => b._id));
      const next = prev.filter((id) => live.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [bookings]);

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
                      handleImageError(e, '/4.jpg');
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

      {/* Booking Page Content */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 bg-gradient-to-r from-[#7A0000]/10 to-[#A00000]/5 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-gray-700 font-semibold flex items-center gap-2">
            <FileText size={18} className="text-[#7A0000]" />
            Booking Page Content
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={addContentSection}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#7A0000] text-white text-xs font-semibold hover:bg-[#5A0000] transition-all"
            >
              <Plus size={14} /> Add Section
            </button>
            <button
              onClick={saveContent}
              disabled={savingContent}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#7A0000] text-white text-xs font-semibold hover:bg-[#5A0000] transition-all disabled:opacity-50"
            >
              {savingContent ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} /> Save Content
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={contentLang === 'ne' ? 'नेपाली' : contentLang.toUpperCase()}
              readOnly
              className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-xs font-semibold text-gray-600"
            />
            <p className="text-xs text-gray-500 self-center">
              Sections shown on the booking page, in order. The section marked
              <span className="font-semibold text-[#7A0000]"> booking form </span>
              renders the real form there.
            </p>
          </div>

          <div className="flex gap-1.5 mb-4 flex-wrap">
            {['ne', 'en', 'hi', 'zh', 'ta'].map((l) => (
              <button
                key={l}
                onClick={() => setContentLang(l)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  contentLang === l
                    ? 'bg-[#7A0000] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-[#7A0000]/10'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {bookingContent.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No content sections yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm border-collapse min-w-[720px]">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-100">
                    <th className="w-10 py-2.5 pl-2 pr-0" />
                    <th className="text-left py-2.5 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-14">
                      #
                    </th>
                    <th className="text-left py-2.5 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="text-left py-2.5 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Headings
                    </th>
                    <th className="text-left py-2.5 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center w-16">
                      Paras
                    </th>
                    <th className="text-left py-2.5 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center w-16">
                      Points
                    </th>
                    <th className="text-left py-2.5 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center w-32">
                      Flags
                    </th>
                    <th className="text-left py-2.5 pl-3 pr-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right w-36">
                      Order
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {bookingContent.map((section, i) => {
                    const titleText =
                      getLocalizedValue(section.title, contentLang) ||
                      'Untitled section';
                    const paragraphsFilled = ['p1', 'p2', 'p3', 'p4'].filter(
                      (k) => getLocalizedValue(section.paragraphs?.[k], contentLang).trim()
                    ).length;
                    const pointsFilled = (section.points || []).filter((p) =>
                      getLocalizedValue(p, contentLang).trim()
                    ).length;

                    return (
                      <React.Fragment key={section.key || i}>
                        {/* Summary row - always visible, one line per section */}
                        <tr
                          key={section.key || i}
                          className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors cursor-pointer"
                          onClick={() =>
                            setExpandedSection(
                              expandedSection === (section.key || i) ? null : section.key || i
                            )
                          }
                        >
                          <td className="py-2.5 pl-2 pr-0">
                            <ChevronDown
                              size={15}
                              className={`text-gray-400 transition-transform ${
                                expandedSection === (section.key || i)
                                  ? 'rotate-0'
                                  : '-rotate-90'
                              }`}
                            />
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs text-gray-400">
                            {i + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-gray-700 block truncate max-w-[260px]">
                              {titleText}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 hidden lg:table-cell">
                            <span className="text-xs text-gray-500 truncate block max-w-[160px]">
                              {getLocalizedValue(section.listTitle, contentLang) || '—'}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-flex items-center justify-center min-w-[26px] px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                                paragraphsFilled > 0
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'bg-gray-50 text-gray-300'
                              }`}
                            >
                              {paragraphsFilled}/4
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-flex items-center justify-center min-w-[26px] px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                                pointsFilled > 0
                                  ? 'bg-[#7A0000]/10 text-[#7A0000]'
                                  : 'bg-gray-50 text-gray-300'
                              }`}
                            >
                              {pointsFilled}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            {section.showForm && (
                              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#7A0000] bg-[#7A0000]/10 rounded-full px-2 py-0.5 mr-1">
                                form
                              </span>
                            )}
                            {section.enabled === false && (
                              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                                hidden
                              </span>
                            )}
                            {!section.showForm && section.enabled !== false && (
                              <span className="text-[11px] text-gray-300">—</span>
                            )}
                          </td>

                          <td className="py-2.5 pl-3 pr-2">
                            <div className="flex items-center justify-end gap-0.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveContentSection(i, -1);
                                }}
                                disabled={i === 0}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                                title="Move up"
                              >
                                <ChevronUp size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveContentSection(i, 1);
                                }}
                                disabled={i === bookingContent.length - 1}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                                title="Move down"
                              >
                                <ChevronDown size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleContentSection(i, 'enabled');
                                }}
                                className="p-1 rounded hover:bg-gray-100"
                                title={section.enabled === false ? 'Show' : 'Hide'}
                              >
                                {section.enabled === false ? (
                                  <Eye size={14} />
                                ) : (
                                  <EyeOff size={14} />
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleContentSection(i, 'showForm');
                                }}
                                className="p-1 rounded hover:bg-gray-100"
                                title="Render the booking form at this section"
                              >
                                <CalendarDays size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeContentSection(i);
                                }}
                                className="p-1 rounded hover:bg-red-100 text-red-500"
                                title="Remove"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Editor row - only for the expanded section, so the list
                            stays scannable instead of being a wall of forms */}
                        {expandedSection === (section.key || i) && (
                          <tr className="border-b border-gray-100 bg-[#7A0000]/[0.03]">
                            <td colSpan={8} className="px-4 py-4">
                              <div className="grid md:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-semibold text-gray-600 block mb-1">
                                    Section title
                                  </label>
                                  <input
                                    type="text"
                                    value={getLocalizedValue(section.title, contentLang)}
                                    onChange={(e) =>
                                      updateContentField(i, 'title', e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                                    placeholder="Section title..."
                                  />
                                </div>

                                <div>
                                  <label className="text-xs font-semibold text-gray-600 block mb-1">
                                    Parent heading (optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={getLocalizedValue(section.group, contentLang)}
                                    onChange={(e) =>
                                      updateContentField(i, 'group', e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                                    placeholder="Parent heading"
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <label className="text-xs font-semibold text-gray-600 block mb-1">
                                    List heading (optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={getLocalizedValue(section.listTitle, contentLang)}
                                    onChange={(e) =>
                                      updateContentField(i, 'listTitle', e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                                    placeholder="List heading"
                                  />
                                </div>
                              </div>

                              {/* Paragraphs as a compact 2-column grid rather
                                  than four full-width stacked boxes */}
                              <div className="mt-3 grid md:grid-cols-2 gap-2">
                                {['p1', 'p2', 'p3', 'p4'].map((pKey) => (
                                  <div key={pKey}>
                                    <label className="text-[11px] font-semibold text-gray-500 block mb-1">
                                      Paragraph {pKey.slice(1)}
                                    </label>
                                    <textarea
                                      rows={3}
                                      value={getLocalizedValue(
                                        section.paragraphs?.[pKey],
                                        contentLang
                                      )}
                                      onChange={(e) =>
                                        updateContentParagraph(i, pKey, e.target.value)
                                      }
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm resize-y"
                                      placeholder={`Paragraph ${pKey.slice(1)}...`}
                                    />
                                  </div>
                                ))}
                              </div>

                              <div className="flex items-center justify-between mt-3 mb-1.5">
                                <label className="text-xs font-bold text-gray-600">
                                  Bullet Points
                                </label>
                                <button
                                  onClick={() => addContentPoint(i)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#7A0000]/10 text-[#7A0000] text-[11px] font-semibold hover:bg-[#7A0000]/20 transition-all"
                                >
                                  <Plus size={12} /> Add Point
                                </button>
                              </div>

                              {(section.points || []).length === 0 ? (
                                <p className="text-[11px] text-gray-400">No bullet points.</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {(section.points || []).map((point, pi) => (
                                    <div
                                      key={pi}
                                      className="flex items-start gap-1.5"
                                    >
                                      <input
                                        type="text"
                                        value={getLocalizedValue(point, contentLang)}
                                        onChange={(e) =>
                                          updateContentPoint(i, pi, e.target.value)
                                        }
                                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                                        placeholder={`Point ${pi + 1}...`}
                                      />
                                      <button
                                        onClick={() => moveContentPoint(i, pi, -1)}
                                        disabled={pi === 0}
                                        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                                        title="Move up"
                                      >
                                        <ChevronUp size={13} />
                                      </button>
                                      <button
                                        onClick={() => moveContentPoint(i, pi, 1)}
                                        disabled={pi === section.points.length - 1}
                                        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                                        title="Move down"
                                      >
                                        <ChevronDown size={13} />
                                      </button>
                                      <button
                                        onClick={() => removeContentPoint(i, pi)}
                                        className="p-1.5 rounded hover:bg-red-100 text-red-500"
                                        title="Remove"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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

      {/* Bookings Table */}
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
                placeholder="Search name, phone, email, puja..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:border-[#7A0000] focus:outline-none text-sm w-44 sm:w-64 bg-white transition-shadow"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:border-[#7A0000] focus:outline-none text-sm bg-white cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="date">Puja date</option>
              <option value="name">Name (A-Z)</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* Status summary chips - also act as filters */}
        <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2">
          {[
            { key: 'all', label: 'All', color: '#7A0000' },
            { key: 'pending', label: 'Pending', color: statusColors.pending },
            { key: 'confirmed', label: 'Confirmed', color: statusColors.confirmed },
            { key: 'completed', label: 'Completed', color: statusColors.completed },
            { key: 'cancelled', label: 'Cancelled', color: statusColors.cancelled },
          ].map((chip) => {
            const active = filterStatus === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setFilterStatus(chip.key)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  active
                    ? 'text-white shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                style={active ? { background: chip.color, borderColor: chip.color } : undefined}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: active ? 'rgba(255,255,255,0.85)' : chip.color }}
                />
                {chip.label}
                <span className={active ? 'text-white/85' : 'text-gray-400'}>
                  {statusCounts[chip.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bulk action bar - only present while rows are selected */}
        {selectedIds.length > 0 && (
          <div className="px-6 py-3 bg-[#7A0000]/[0.06] border-b border-[#7A0000]/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Check size={16} className="text-[#7A0000]" />
              <span className="font-semibold text-gray-700">
                {selectedIds.length} selected
              </span>
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs text-gray-500 hover:text-[#7A0000] underline underline-offset-2 transition-colors"
              >
                Clear
              </button>
            </div>

            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
            >
              {deleting ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              {deleting ? 'Deleting...' : 'Delete selected'}
            </button>
          </div>
        )}

        {/* Body */}
        {sortedBookings.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#7A0000]/5 flex items-center justify-center">
              <Calendar size={26} className="text-[#7A0000]/40" />
            </div>
            <p className="text-sm font-semibold text-gray-600">
              {bookings.length === 0 ? 'No bookings yet' : 'No bookings match your filters'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {bookings.length === 0
                ? 'New puja bookings will appear here automatically.'
                : 'Try a different search term or status filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-y border-gray-100">
                  <th className="py-3 pl-4 pr-0 w-10">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      ref={(el) => {
                        // Third state: checked-looking but indeterminate when
                        // only some rows on the page are selected.
                        if (el) el.indeterminate = someOnPageSelected;
                      }}
                      onChange={toggleSelectAllOnPage}
                      disabled={pagedBookings.length === 0}
                      aria-label="Select all on this page"
                      className="w-4 h-4 rounded border-gray-300 text-[#7A0000] focus:ring-[#7A0000]/30 cursor-pointer disabled:opacity-40"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Devotee
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Contact
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Puja
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    <button
                      onClick={() => toggleSort('date')}
                      className="inline-flex items-center gap-1 hover:text-[#7A0000] transition-colors"
                    >
                      Date
                      {sortBy === 'date' && <ChevronDown size={12} className="text-[#7A0000]" />}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedBookings.map((booking) => {
                  const isOpen = expandedId === booking._id;
                  return (
                    <React.Fragment key={booking._id}>
                      <tr
                        onClick={() => setExpandedId(isOpen ? null : booking._id)}
                        className={`border-b border-gray-100 cursor-pointer transition-colors ${
                          selectedSet.has(booking._id)
                            ? 'bg-[#7A0000]/[0.07]'
                            : isOpen
                            ? 'bg-[#7A0000]/[0.04]'
                            : 'hover:bg-gray-50/70'
                        }`}
                      >
                        {/* Select */}
                        <td
                          className="py-3 pl-4 pr-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSet.has(booking._id)}
                            onChange={() => toggleSelect(booking._id)}
                            aria-label={`Select booking for ${booking.name}`}
                            className="w-4 h-4 rounded border-gray-300 text-[#7A0000] focus:ring-[#7A0000]/30 cursor-pointer"
                          />
                        </td>

                        {/* Devotee */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-[#7A0000] to-[#A00000] text-white text-xs font-bold flex items-center justify-center">
                              {booking.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-800 truncate max-w-[160px]">
                                {booking.name}
                              </p>
                              <p className="text-[11px] text-gray-400 font-mono">
                                #{booking._id?.slice(-6)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3 px-4 hidden md:table-cell">
                          <p className="text-gray-700">{booking.phone || '—'}</p>
                          {booking.email && (
                            <p className="text-xs text-gray-400 truncate max-w-[180px]">{booking.email}</p>
                          )}
                        </td>

                        {/* Puja */}
                        <td className="py-3 px-4">
                          <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#7A0000]/10 text-[#7A0000] border border-[#7A0000]/20 max-w-[160px] truncate">
                            {booking.type}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-gray-600 hidden sm:table-cell whitespace-nowrap">
                          {booking.date || '—'}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={booking.status}
                            onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                            disabled={loading}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border focus:outline-none focus:ring-2 focus:ring-[#7A0000]/20 disabled:opacity-50 cursor-pointer ${getStatusBadge(
                              booking.status
                            )}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>

                        {/* Expand toggle */}
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                              isOpen
                                ? 'bg-[#7A0000] text-white'
                                : 'text-gray-400 hover:bg-gray-100 hover:text-[#7A0000]'
                            }`}
                          >
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isOpen && (
                        <tr className="bg-[#7A0000]/[0.02]">
                          <td colSpan={7} className="px-4 pb-5 pt-1">
                            <div className="rounded-xl border border-[#7A0000]/15 bg-white p-5 shadow-sm">
                              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    Full name
                                  </p>
                                  <p className="text-sm text-gray-800">{booking.name || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    Phone
                                  </p>
                                  <p className="text-sm text-gray-800">{booking.phone || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    Email
                                  </p>
                                  <p className="text-sm text-gray-800 break-all">{booking.email || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    Puja type
                                  </p>
                                  <p className="text-sm text-gray-800">{booking.type || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    Puja date
                                  </p>
                                  <p className="text-sm text-gray-800">{booking.date || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    Booked on
                                  </p>
                                  <p className="text-sm text-gray-800">
                                    {booking.createdAt
                                      ? new Date(booking.createdAt).toLocaleString()
                                      : '—'}
                                  </p>
                                </div>
                                <div className="sm:col-span-2 lg:col-span-2">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    Description
                                  </p>
                                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {booking.description || '—'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {sortedBookings.length > 0 && (
          <div className="px-6 py-3.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>
                Showing{' '}
                <span className="font-semibold text-gray-700">
                  {(page - 1) * perPage + 1}
                </span>
                -
                <span className="font-semibold text-gray-700">
                  {Math.min(page * perPage, sortedBookings.length)}
                </span>{' '}
                of <span className="font-semibold text-gray-700">{sortedBookings.length}</span>
              </span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:border-[#7A0000] focus:outline-none cursor-pointer"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      page === n
                        ? 'bg-[#7A0000] text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookings;
