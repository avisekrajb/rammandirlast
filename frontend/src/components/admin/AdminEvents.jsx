import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Pencil, Trash2, Save, X, Upload, Calendar, 
  Image, Eye, Heart, Share2, Users, Search, 
  Check, XCircle, ChevronDown, Loader2, BarChart3,
  TrendingUp, Eye as EyeIcon, Clock
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import api from '../../services/api';
import OmLoader from '../../components/common/OmLoader';

const AdminEvents = ({ events, setEvents, t }) => {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(null);
  const [activeLang, setActiveLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [interestedUsers, setInterestedUsers] = useState([]);
  const [loadingInterested, setLoadingInterested] = useState(false);
  const [engagementStats, setEngagementStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [filterUpcoming, setFilterUpcoming] = useState('all');
  const fileInputRef = useRef(null);

  // Fetch engagement stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/events/stats/engagement');
        setEngagementStats(response.data.data);
      } catch (error) {
        console.error('Error fetching engagement stats:', error);
      }
    };
    fetchStats();
  }, []);

  const blank = () => ({
    date: '',
    photo: null,
    upcoming: true,
    title: { en: '', ne: '', hi: '', zh: '', ta: '' },
    desc: { en: '', ne: '', hi: '', zh: '', ta: '' },
    dateNepali: { en: '', ne: '', hi: '', zh: '', ta: '' },
    greg: { en: '', ne: '', hi: '', zh: '', ta: '' },
    interestedCount: 0,
    views: 0,
    shareCount: 0,
    interestedBy: [],
  });

  const handleSave = async () => {
    // Validate required fields
    if (!editing.title?.en?.trim()) {
      showToast('Title is required (English)', 'error');
      return;
    }
    if (!editing.desc?.en?.trim()) {
      showToast('Description is required (English)', 'error');
      return;
    }
    if (!editing.date) {
      showToast('Date is required', 'error');
      return;
    }

    setLoading(true);
    try {
      if (editing._id) {
        const response = await api.put(`/admin/events/${editing._id}`, editing);
        setEvents(events.map(e => e._id === editing._id ? response.data : e));
        showToast('Event updated successfully', 'success');
      } else {
        const response = await api.post('/admin/events', editing);
        setEvents([...events, response.data]);
        showToast('Event created successfully', 'success');
      }
      setEditing(null);
    } catch (error) {
      console.error('Save event error:', error);
      showToast(error.response?.data?.message || 'Failed to save event', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    setLoading(true);
    try {
      await api.delete(`/admin/events/${id}`);
      setEvents(events.filter(e => e._id !== id));
      showToast('Event deleted successfully', 'success');
    } catch (error) {
      console.error('Delete event error:', error);
      showToast(error.response?.data?.message || 'Failed to delete event', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEventPhotoUpload = async (e) => {
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

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('eventId', editing._id || 'new');

    try {
      const response = await api.post('/admin/upload/event', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditing({ ...editing, photo: response.data.url });
      showToast('Photo uploaded successfully', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      showToast(error.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  };

  const handleViewInterested = async (eventId) => {
    setLoadingInterested(true);
    setShowModal(true);
    try {
      const response = await api.get(`/events/${eventId}/interested-users`);
      setInterestedUsers(response.data.users || []);
      setSelectedEvent(events.find(e => e._id === eventId));
    } catch (error) {
      console.error('Error fetching interested users:', error);
      showToast('Failed to fetch interested users', 'error');
    } finally {
      setLoadingInterested(false);
    }
  };

  const getLocalizedText = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[activeLang] || obj.en || '';
  };

  // Filter events
  const filteredEvents = events.filter(e => {
    const title = e.title?.en?.toLowerCase() || '';
    const desc = e.desc?.en?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    let matchesSearch = title.includes(search) || desc.includes(search);
    
    if (filterUpcoming === 'upcoming') {
      matchesSearch = matchesSearch && e.upcoming === true;
    } else if (filterUpcoming === 'past') {
      matchesSearch = matchesSearch && e.upcoming === false;
    }
    
    return matchesSearch;
  });

  // Sort events by date (newest first)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  const getStatusBadge = (upcoming) => {
    if (upcoming) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"><Check size={12} /> Upcoming</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600"><Clock size={12} /> Past</span>;
  };

  if (editing) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-serif font-semibold text-ink">
            {editing._id ? 'Edit Event' : 'Create New Event'}
          </h4>
          <button 
            onClick={() => setEditing(null)} 
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Photo Upload */}
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Event Photo</label>
            <div 
              className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden h-48 flex items-center justify-center cursor-pointer bg-gray-50 hover:border-vermilion transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleEventPhotoUpload} 
                className="hidden" 
              />
              {editing.photo ? (
                <>
                  <img src={editing.photo} alt="Event" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs font-bold py-2 flex items-center justify-center gap-1.5">
                    <Upload size={14} /> Click to change photo
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-ink-soft">
                  <Image size={40} />
                  <span className="text-sm font-medium">Click to upload event photo</span>
                  <span className="text-xs text-ink-soft/60">JPG, PNG, WEBP • Max 5MB</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <OmLoader size="lg" color="white" />
                </div>
              )}
            </div>
          </div>

          <LanguageSwitcher active={activeLang} onChange={setActiveLang} t={t} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">Title *</label>
              <input
                type="text"
                value={editing.title[activeLang] || ''}
                onChange={(e) => setEditing({ ...editing, title: { ...editing.title, [activeLang]: e.target.value } })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
                placeholder="Enter event title..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">Date *</label>
              <input
                type="date"
                value={editing.date || ''}
                onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Description *</label>
            <textarea
              rows={3}
              value={editing.desc[activeLang] || ''}
              onChange={(e) => setEditing({ ...editing, desc: { ...editing.desc, [activeLang]: e.target.value } })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors resize-none"
              placeholder="Enter event description..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">Nepali Date</label>
              <input
                type="text"
                value={editing.dateNepali[activeLang] || ''}
                onChange={(e) => setEditing({ ...editing, dateNepali: { ...editing.dateNepali, [activeLang]: e.target.value } })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
                placeholder="Enter Nepali date..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">Gregorian Date</label>
              <input
                type="text"
                value={editing.greg[activeLang] || ''}
                onChange={(e) => setEditing({ ...editing, greg: { ...editing.greg, [activeLang]: e.target.value } })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
                placeholder="Enter Gregorian date..."
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <input
                type="checkbox"
                checked={editing.upcoming !== false}
                onChange={(e) => setEditing({ ...editing, upcoming: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-vermilion focus:ring-vermilion"
              />
              Upcoming Event
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={loading || uploading}
            className="w-full py-3 rounded-xl bg-vermilion text-white font-semibold text-sm hover:bg-[#a83a0c] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                {editing._id ? 'Update Event' : 'Create Event'}
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Engagement Stats */}
      {engagementStats && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-serif font-semibold text-ink flex items-center gap-2">
              <BarChart3 size={18} className="text-vermilion" />
              Event Engagement Stats
            </h4>
            <button
              onClick={() => setShowStats(!showStats)}
              className="text-xs text-ink-soft hover:text-vermilion transition-colors"
            >
              {showStats ? 'Hide' : 'View Details'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-700">{engagementStats.totalEvents || 0}</div>
              <div className="text-xs text-red-600 font-medium">Total Events</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{engagementStats.upcomingEvents || 0}</div>
              <div className="text-xs text-green-600 font-medium">Upcoming</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{engagementStats.totalInterested || 0}</div>
              <div className="text-xs text-blue-600 font-medium">Total Interested</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-700">{engagementStats.totalViews || 0}</div>
              <div className="text-xs text-purple-600 font-medium">Total Views</div>
            </div>
          </div>

          {showStats && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-ink-soft">Avg Interested:</span>
                  <span className="ml-2 font-bold text-ink">{Math.round(engagementStats.avgInterested || 0)}</span>
                </div>
                <div>
                  <span className="text-ink-soft">Avg Views:</span>
                  <span className="ml-2 font-bold text-ink">{Math.round(engagementStats.avgViews || 0)}</span>
                </div>
                <div>
                  <span className="text-ink-soft">Total Shares:</span>
                  <span className="ml-2 font-bold text-ink">{engagementStats.totalShares || 0}</span>
                </div>
                <div>
                  <span className="text-ink-soft">Past Events:</span>
                  <span className="ml-2 font-bold text-ink">{engagementStats.pastEvents || 0}</span>
                </div>
              </div>
              
              {engagementStats.mostInterested?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-2">Most Popular Events</p>
                  <div className="flex flex-wrap gap-2">
                    {engagementStats.mostInterested.map((e, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 rounded-full text-xs">
                        <Heart size={12} className="text-red-400 fill-red-400" />
                        {e.title?.en} ({e.interestedCount})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Events List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-gray-100 gap-4">
          <div>
            <h4 className="text-lg font-serif font-semibold text-ink flex items-center gap-2">
              <Calendar size={20} className="text-vermilion" />
              {t.manageEvents || 'Events'}
            </h4>
            <p className="text-xs text-ink-soft">
              Total: <span className="font-bold text-ink">{events?.length || 0}</span> events
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative w-full sm:w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
              />
            </div>
            {/* Filter */}
            <select
              value={filterUpcoming}
              onChange={(e) => setFilterUpcoming(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
            <button
              onClick={() => setEditing(blank())}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-vermilion text-white text-sm font-semibold hover:bg-[#a83a0c] transition-all whitespace-nowrap"
            >
              <Plus size={16} /> {t.add || 'Add Event'}
            </button>
          </div>
        </div>

        {/* Events Grid */}
        {sortedEvents?.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-ink-soft">{searchTerm ? 'No events found matching your search' : 'No events added yet'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 max-h-[600px] overflow-y-auto scroll-smooth">
            {sortedEvents.map((event) => {
              const titleText = getLocalizedText(event.title);
              const descText = getLocalizedText(event.desc);
              
              return (
                <div
                  key={event._id}
                  className="group bg-white rounded-xl border border-gray-100 hover:border-vermilion/30 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Photo */}
                  <div className="relative aspect-[16/10] bg-gradient-to-br from-vermilion/10 to-maroon-deep/5">
                    {event.photo ? (
                      <img 
                        src={event.photo} 
                        alt={titleText} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image size={40} className="text-ink-soft/30" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      {getStatusBadge(event.upcoming)}
                    </div>

                    {/* Engagement badges */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {event.interestedCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          <Heart size={10} className="fill-red-400" />
                          {event.interestedCount}
                        </span>
                      )}
                      {event.views > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                          <EyeIcon size={10} />
                          {event.views}
                        </span>
                      )}
                    </div>

                    {/* Actions on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditing(event)}
                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
                        title="Edit"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleViewInterested(event._id)}
                        className="p-2 rounded-lg bg-blue-500/70 hover:bg-blue-500 text-white transition-all"
                        title="View Interested Users"
                      >
                        <Users size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(event._id)}
                        className="p-2 rounded-lg bg-red-500/70 hover:bg-red-500 text-white transition-all"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h5 className="font-serif font-semibold text-ink text-sm truncate">
                      {titleText || 'Untitled Event'}
                    </h5>
                    <p className="text-xs text-ink-soft line-clamp-2 mt-1">
                      {descText || 'No description'}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <span className="text-xs text-ink-soft">
                        {event.date || 'No date'}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-ink-soft">
                        <span className="flex items-center gap-0.5">
                          <Heart size={10} className="text-red-400" />
                          {event.interestedCount || 0}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <EyeIcon size={10} />
                          {event.views || 0}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Share2 size={10} />
                          {event.shareCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interested Users Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-serif font-semibold text-ink">
                  Interested Users
                </h3>
                <p className="text-sm text-ink-soft">
                  {selectedEvent?.title?.en || 'Event'} • {interestedUsers.length} users
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingInterested ? (
                <div className="flex items-center justify-center py-12">
                  <OmLoader size="md" color="vermilion" />
                </div>
              ) : interestedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-ink-soft">No users have marked this event as interested yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {interestedUsers.map((user, index) => (
                    <div key={user._id || index} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-vermilion to-maroon-deep text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {user.profilePhoto ? (
                          <img src={user.profilePhoto} alt={user.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          user.name?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-ink">{user.name || 'Anonymous'}</p>
                        <p className="text-xs text-ink-soft">{user.email || 'No email'}</p>
                        {user.phone && <p className="text-xs text-ink-soft/60">{user.phone}</p>}
                      </div>
                      <span className="text-xs text-ink-soft/60">#{index + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;