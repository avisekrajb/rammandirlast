import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import OmLoader from '../components/common/OmLoader';
import { 
  Heart, Share2, Users, X, Calendar, MapPin, Clock, 
  ThumbsUp, Eye, Loader2 
} from 'lucide-react';

// Daily Aarti timings
const dailyKeys = [
  { key: "mangala", time: { en: "4:30 AM", ne: "४:३० बिहान", hi: "४:३० सुबह" } },
  { key: "bhog", time: { en: "9:00 AM", ne: "९:०० बिहान", hi: "९:०० सुबह" } },
  { key: "madhyahna", time: { en: "12:30 PM", ne: "१२:३० दिउँसो", hi: "१२:३० दोपहर" } },
  { key: "sandhya", time: { en: "6:30 PM", ne: "६:३० साँझ", hi: "६:३० शाम" } },
  { key: "shayan", time: { en: "8:00 PM", ne: "८:०० राति", hi: "८:०० रात" } },
];

// Helper to get text in current language
const getLocalizedText = (obj, lang) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || '';
};
// Event Detail Modal Component
const EventDetailModal = ({ event, onClose, lang, t, user, onInterested, isInterested, interestedCount }) => {
  const { showToast } = useToast();
  const [sharing, setSharing] = useState(false);

  if (!event) return null;

  const titleText = getLocalizedText(event.title, lang);
  const descText = getLocalizedText(event.desc, lang);
  const dateText = getLocalizedText(event.dateNepali, lang);
  const gregText = getLocalizedText(event.greg, lang);

  const handleShare = async () => {
    setSharing(true);
    try {
      const shareData = {
        title: titleText || 'Event',
        text: `${titleText} - ${dateText || gregText || ''}`,
        url: `${window.location.origin}/events/${event._id}`,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        showToast('Event link copied to clipboard!', 'success');
      }
      
      // Track share
      try {
        await api.post(`/events/${event._id}/share`);
      } catch (e) {
        console.error('Share tracking error:', e);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
        showToast('Failed to share event', 'error');
      }
    } finally {
      setSharing(false);
    }
  };

  const handleInterestedClick = () => {
    if (!user) {
      showToast('Please login to mark as interested', 'warning');
      return;
    }
    onInterested(event._id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
      >
        {/* Close button - white transparent */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Image */}
        <div className="relative h-64 sm:h-80 overflow-hidden rounded-t-2xl">
          <img
            src={event.photo || '/default-event.jpg'}
            alt={titleText}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = '/default-event.jpg'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-6">
            <span className="text-white/90 text-sm font-medium">
              {dateText || gregText || ''}
            </span>
          </div>
          {/* Upcoming badge - left side */}
          {event.upcoming && (
            <div className="absolute top-4 left-4 bg-red-900 text-white px-4 py-1.5 text-xs font-bold rounded-full shadow-lg z-10">
              Upcoming
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink mb-3">
            {titleText || 'Event'}
          </h2>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-ink-soft mb-4">
            {gregText && (
              <span className="flex items-center gap-1.5">
                <Calendar size={16} className="text-vermilion" />
                {gregText}
              </span>
            )}
            {event.date && (
              <span className="flex items-center gap-1.5">
                <Clock size={16} className="text-vermilion" />
                {event.date}
              </span>
            )}
          </div>

          <p className="text-base text-ink-soft leading-relaxed mb-6">
            {descText || 'No description available'}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={handleInterestedClick}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                isInterested
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-100 text-ink hover:bg-gray-200'
              }`}
            >
              <Heart size={18} className={isInterested ? 'fill-white' : ''} />
              {isInterested ? (t.interested || 'Interested') : (t.markInterested || 'Mark Interested')}
              <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {interestedCount || 0}
              </span>
            </button>

            <button
              onClick={handleShare}
              disabled={sharing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
            >
              {sharing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Share2 size={18} />
              )}
              {t.share || 'Share'}
            </button>

            <div className="ml-auto flex items-center gap-2 text-xs text-ink-soft">
              <Eye size={14} />
              <span>Viewed</span>
              <span className="font-bold">{event.views || 0}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Main Events Page
const EventsPage = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [interestedEvents, setInterestedEvents] = useState({});
  const [interestedCounts, setInterestedCounts] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/events');
        setEvents(response.data);
        
        // Initialize interested counts
        const counts = {};
        response.data.forEach(e => {
          counts[e._id] = e.interestedCount || 0;
        });
        setInterestedCounts(counts);

        // If user is logged in, fetch their interested events
        if (user) {
          try {
            const interestedRes = await api.get('/events/interested');
            const interestedMap = {};
            interestedRes.data.forEach(e => {
              interestedMap[e._id] = true;
            });
            setInterestedEvents(interestedMap);
          } catch (error) {
            console.error('Error fetching interested events:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [user]);

  const handleInterested = async (eventId) => {
    if (!user) {
      showToast('Please login to mark as interested', 'warning');
      return;
    }

    if (!eventId) {
      console.error('No event ID provided');
      showToast('Error: Event ID is missing', 'error');
      return;
    }

    setActionLoading(prev => ({ ...prev, [eventId]: true }));
    
    try {
      const isCurrentlyInterested = interestedEvents[eventId];
      const endpoint = isCurrentlyInterested 
        ? `/events/${eventId}/uninterested` 
        : `/events/${eventId}/interested`;
      
      const response = await api.post(endpoint);
      
      // Update interested state
      setInterestedEvents(prev => ({
        ...prev,
        [eventId]: !isCurrentlyInterested
      }));
      
      // Update count
      setInterestedCounts(prev => ({
        ...prev,
        [eventId]: response.data.count || (isCurrentlyInterested ? prev[eventId] - 1 : prev[eventId] + 1)
      }));

      showToast(
        isCurrentlyInterested 
          ? 'Removed from interested' 
          : 'Marked as interested!',
        'success'
      );
    } catch (error) {
      console.error('Error updating interest:', error);
      showToast(error.response?.data?.message || 'Failed to update interest', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    // Track view
    if (event && event._id) {
      api.post(`/events/${event._id}/view`).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <OmLoader size="md" color="maroon" />
      </div>
    );
  }

  const upcoming = events.filter(e => e.upcoming).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = events.filter(e => !e.upcoming).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div 
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #faf8f5 0%, #ffffff 50%, #faf8f5 100%)' }}
    >
      {/* Header */}
      <div className="pt-24 pb-8 text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
          className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light"
          style={{ color: "#7A0000" }}
        >
          {t.eventsTitle || 'Temple Events'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-4 text-base sm:text-lg text-mute max-w-xl mx-auto leading-relaxed"
        >
          {t.eventsSubtitle || 'Stay connected with the spiritual calendar of Shree Ramchandra Temple'}
        </motion.p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        {/* Upcoming Events */}
        {upcoming.length > 0 && (
          <div className="mb-14">
            <h2 
              className="font-serif text-2xl sm:text-3xl mb-8"
              style={{ color: "#7A0000" }}
            >
              {t.upcomingEvents || 'Upcoming Events'}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcoming.map((e, i) => {
                const titleText = getLocalizedText(e.title, lang);
                const descText = getLocalizedText(e.desc, lang);
                const dateText = getLocalizedText(e.dateNepali, lang);
                const gregText = getLocalizedText(e.greg, lang);
                const isInterested = interestedEvents[e._id] || false;
                const count = interestedCounts[e._id] || 0;
                const isLoading = actionLoading[e._id] || false;

                return (
                  <motion.div
                    key={e._id || i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: [0.25, 1, 0.5, 1] }}
                    className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 cursor-pointer"
                    onClick={() => handleEventClick(e)}
                  >
                    <div className="relative h-56 sm:h-64 overflow-hidden">
                      <img
                        src={e.photo || '/default-event.jpg'}
                        alt={titleText}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        onError={(e) => {
                          e.target.src = '/default-event.jpg';
                        }}
                      />
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 40%)" }}
                      />
                      <div className="absolute top-4 right-4 bg-red-900 text-white px-3.5 py-1.5 text-xs font-display rounded-md pointer-events-none shadow-md">
                        {gregText || 'Coming Soon'}
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <span className="text-white/90 text-xs uppercase drop-shadow tracking-widest">
                          {dateText || ''}
                        </span>
                      </div>
                      
                      {/* Interested count badge */}
                      {count > 0 && (
                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none">
                          <Heart size={12} className="fill-red-400 text-red-400" />
                          {count}
                        </div>
                      )}
                    </div>
                    <div className="p-6 sm:p-7">
                      <h3 className="text-ink font-serif text-xl sm:text-2xl mb-3 group-hover:text-red-900 transition-colors">
                        {titleText || 'Event'}
                      </h3>
                      <p className="text-sm sm:text-base text-mute leading-relaxed line-clamp-3">
                        {descText || ''}
                      </p>
                      
                      {/* Action buttons on card */}
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleInterested(e._id);
                          }}
                          disabled={isLoading}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            isInterested
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 text-ink-soft hover:bg-gray-200'
                          }`}
                        >
                          {isLoading ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Heart size={12} className={isInterested ? 'fill-white' : ''} />
                          )}
                          {isInterested ? 'Interested' : 'Interested'}
                        </button>
                        
                        <button
                          onClick={async (event) => {
                            event.stopPropagation();
                            const shareData = {
                              title: titleText || 'Event',
                              text: `${titleText} - ${dateText || gregText || ''}`,
                              url: `${window.location.origin}/events/${e._id}`,
                            };
                            try {
                              if (navigator.share) {
                                await navigator.share(shareData);
                              } else {
                                await navigator.clipboard.writeText(
                                  `${shareData.title}\n${shareData.text}\n${shareData.url}`
                                );
                                showToast('Event link copied!', 'success');
                              }
                              // Track share
                              await api.post(`/events/${e._id}/share`);
                            } catch (err) {
                              if (err.name !== 'AbortError') {
                                console.error('Share error:', err);
                              }
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                        >
                          <Share2 size={12} />
                          Share
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Daily Aarti & Temple Info */}
        <div className="pt-10">
          <h2 
            className="font-serif text-2xl sm:text-3xl mb-8"
            style={{ color: "#7A0000" }}
          >
            {t.dailyTitle || 'Daily Aarti & Temple Information'}
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Daily Aarti Timings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-8"
            >
              <h3 
                className="font-serif text-lg sm:text-xl mb-6"
                style={{ color: "#7A0000" }}
              >
                {t.dailyTimings || 'दैनिक आरती तालिका'}
              </h3>
              <div className="space-y-0">
                {dailyKeys.map((d, i) => {
                  const timeValue = d.time[lang] || d.time.en;
                  const aartiName = t[`aarti_${d.key}`] || d.key;
                  return (
                    <div
                      key={d.key}
                      className={`flex justify-between items-center py-4 ${i < dailyKeys.length - 1 ? "border-b border-gray-100" : ""}`}
                    >
                      <span className="text-ink text-sm sm:text-base font-medium">
                        {aartiName}
                      </span>
                      <span className="text-mute font-serif text-sm sm:text-base">
                        {timeValue}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Temple Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-8"
            >
              <h3 
                className="font-serif text-lg sm:text-xl mb-6"
                style={{ color: "#7A0000" }}
              >
                {t.templeInfo || 'मन्दिर जानकारी'}
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-medium text-mute uppercase tracking-wider mb-1">
                    {t.openingHours || 'खुल्ने समय'}
                  </p>
                  <p className="text-ink text-sm sm:text-base">
                    {t.openingValue || 'बिहान ४:३० – साँझ ८:३० दैनिक'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-mute uppercase tracking-wider mb-1">
                    {t.locationLabel || 'स्थान'}
                  </p>
                  <p className="text-ink text-sm sm:text-base">
                    {t.locationValue || 'बत्तिसपुतली, गौशाला, काठमाडौँ, नेपाल'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-mute uppercase tracking-wider mb-1">
                    {t.specialAartis || 'विशेष आरती'}
                  </p>
                  <p className="text-ink text-sm sm:text-base">
                    {t.specialValue || 'सूर्योदय र साँझ ६:३०'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Past Events */}
        {past.length > 0 && (
          <div className="pt-14">
            <h2 
              className="font-serif text-2xl sm:text-3xl mb-8"
              style={{ color: "#7A0000" }}
            >
              {t.pastEvents || 'Past Events'}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-70">
              {past.map((e, i) => {
                const titleText = getLocalizedText(e.title, lang);
                const descText = getLocalizedText(e.desc, lang);
                const dateText = getLocalizedText(e.dateNepali, lang);

                return (
                  <motion.div
                    key={e._id || i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: [0.25, 1, 0.5, 1] }}
                    className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 cursor-pointer"
                    onClick={() => handleEventClick(e)}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={e.photo || '/default-event.jpg'}
                        alt={titleText}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = '/default-event.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <span className="text-white/80 text-xs uppercase drop-shadow tracking-widest">
                          {dateText || ''}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-ink font-serif text-base font-semibold mb-1">
                        {titleText || 'Event'}
                      </h3>
                      <p className="text-xs text-mute leading-relaxed line-clamp-2">
                        {descText || ''}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            lang={lang}
            t={t}
            user={user}
            onInterested={handleInterested}
            isInterested={interestedEvents[selectedEvent._id] || false}
            interestedCount={interestedCounts[selectedEvent._id] || 0}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default EventsPage;