import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import OmLoader from '../components/common/OmLoader';
import AdminSidebar from '../components/admin/AdminSidebar';

// Admin Components
import AdminOverview from '../components/admin/AdminOverview';
import AdminUsers from '../components/admin/AdminUsers';
import AdminHero from '../components/admin/AdminHero';
import AdminQuote from '../components/admin/AdminQuote';
import AdminTimings from '../components/admin/AdminTimings';
import AdminAbout from '../components/admin/AdminAbout';
import AdminHistory from '../components/admin/AdminHistory';
import AdminTeam from '../components/admin/AdminTeam';
import AdminLogo from '../components/admin/AdminLogo';
import AdminEvents from '../components/admin/AdminEvents';
import AdminGallery from '../components/admin/AdminGallery';
import AdminDonations from '../components/admin/AdminDonations';
import AdminBookings from '../components/admin/AdminBookings';
import AdminNotice from '../components/admin/AdminNotice';
import AdminDailyAarti from '../components/admin/AdminDailyAarti';
import AdminBlogs from '../components/admin/AdminBlogs';
import AdminHome from '../components/admin/AdminHome';
import AdminFooter from '../components/admin/AdminFooter';
import AdminSocial from '../components/admin/AdminSocial'; // <-- Import AdminSocial
import AdminFacebookVideos from '../components/admin/AdminFacebookVideos'; // <-- Import AdminFacebookVideos
import AdminNotifications from './AdminNotifications';
import AdminSettings from './AdminSettings';
import CloudPhotoPage from './CloudPhotoPage';
import AdminContact from '../components/admin/AdminContact';
import AdminVisitor from '../components/admin/AdminVisitor';
import AdminBackup from '../components/admin/AdminBackup';

import { Menu, Settings, Bell, Globe, CheckCircle } from 'lucide-react';

const AdminPage = () => {
  const { t, lang, setLang } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [history, setHistory] = useState([]);
  const [team, setTeam] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [galleryVideos, setGalleryVideos] = useState([]);
  const [donations, setDonations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const fetchData = async () => {
      try {
        const [settingsRes, usersRes, eventsRes, historyRes, teamRes, galleryRes, videosRes, donationsRes, bookingsRes] = await Promise.all([
          api.get('/admin/settings'),
          api.get('/admin/users'),
          api.get('/events'),
          api.get('/admin/history'),
          api.get('/admin/team'),
          api.get('/admin/gallery'),
          api.get('/admin/gallery/videos'),
          api.get('/admin/donations'),
          api.get('/admin/bookings')
        ]);
        setSettings(settingsRes.data);
        setUsers(usersRes.data);
        setEvents(eventsRes.data);
        setHistory(historyRes.data);
        setTeam(teamRes.data);
        setGallery(galleryRes.data);
        setGalleryVideos(videosRes.data);
        setDonations(donationsRes.data);
        setBookings(bookingsRes.data);
        showToast('Admin data loaded successfully', 'success');
      } catch (error) {
        console.error('Error fetching admin data:', error);
        showToast(error.response?.data?.message || 'Error loading admin data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ========== UPDATE SETTINGS FUNCTION ==========
  const updateSettings = async (newSettings) => {
    try {
      // If newSettings is a function, call it with current settings
      const settingsToUpdate = typeof newSettings === 'function' 
        ? newSettings(settings) 
        : newSettings;
      
      const response = await api.put('/admin/settings', settingsToUpdate);
      setSettings(response.data);
      showToast(t.savedSuccess || 'Changes saved', 'success');
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      showToast(error.response?.data?.message || 'Error updating settings', 'error');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <OmLoader size="lg" color="vermilion" className="mx-auto mb-4" />
          <p className="text-ink-soft text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Helper to get page title
  const getPageTitle = () => {
    const path = location.pathname.split('/admin/')[1];
    if (!path) return 'Overview';
    if (path === 'cloud') return 'Cloud Storage';
    if (path === 'notifications') return 'Notifications';
    if (path === 'settings') return 'Settings';
    if (path === 'footer') return 'Footer Settings';
    if (path === 'home') return 'Home Settings';
    if (path === 'contact') return 'Contact Messages';
    if (path === 'visitors') return 'Visitor Analytics';
    if (path === 'backup') return 'Backup & Restore';
    if (path === 'social') return 'Social Links'; // <-- Added social page title
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 admin-page">
      {/* Sidebar - sticky and independent */}
      <div className="sticky top-0 h-screen">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content - scrollable independently */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen main-content-scroll">
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu size={20} className="text-ink-soft" />
            </button>
            <h2 className="text-lg font-serif font-semibold text-ink">
              {getPageTitle()}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Language switcher (mini) */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                title="Change language"
              >
                <Globe size={18} className="text-ink-soft" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#7A0000] rounded-full text-white text-[8px] font-bold flex items-center justify-center">
                  {lang.toUpperCase()}
                </span>
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 top-11 z-50 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    {[
                      { code: 'en', label: 'English', flag: '🇬🇧' },
                      { code: 'ne', label: 'नेपाली', flag: '🇳🇵' },
                      { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
                      { code: 'zh', label: '中文', flag: '🇨🇳' },
                      { code: 'ta', label: 'தமிழ்', flag: '🇱🇰' },
                    ].map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLang(l.code);
                          setLangOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${lang === l.code ? 'font-semibold text-[#7A0000]' : 'text-ink'}`}
                      >
                        <span className="text-base">{l.flag}</span>
                        <span className="flex-1 text-left">{l.code.toUpperCase()}</span>
                        {lang === l.code && <CheckCircle size={14} className="text-[#7A0000]" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => navigate('/admin/notifications')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            >
              <Bell size={18} className="text-ink-soft" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-vermilion rounded-full"></span>
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Settings size={18} className="text-ink-soft" />
            </button>
            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-vermilion to-maroon-deep text-white flex items-center justify-center text-sm font-bold shadow-md">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="text-sm font-medium text-ink hidden sm:block">
                {user?.name || 'Admin'}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto content-scroll">
          <Routes>
            {/* Overview */}
            <Route index element={<AdminOverview 
              settings={settings} users={users} events={events} 
              donations={donations} bookings={bookings} 
              t={t} lang={lang} 
            />} />
            <Route path="overview" element={<AdminOverview 
              settings={settings} users={users} events={events} 
              donations={donations} bookings={bookings} 
              t={t} lang={lang} 
            />} />

            {/* Home Settings */}
            <Route path="home" element={<AdminHome 
              settings={settings} updateSettings={updateSettings} t={t} 
            />} />

            {/* User Management */}
            <Route path="users" element={<AdminUsers 
              users={users} setUsers={setUsers} t={t} 
            />} />

            {/* Content Management */}
            <Route path="hero" element={<AdminHero 
              settings={settings} updateSettings={updateSettings} t={t} 
            />} />
            <Route path="quote" element={<AdminQuote 
              settings={settings} updateSettings={updateSettings} t={t} 
            />} />
            <Route path="timings" element={<AdminTimings 
              settings={settings} updateSettings={updateSettings} t={t} 
            />} />
            <Route path="about" element={<AdminAbout 
              settings={settings} updateSettings={updateSettings} t={t} 
            />} />
            
            {/* History */}
            <Route path="history" element={<AdminHistory 
              history={history} 
              setHistory={setHistory} 
              t={t} 
              settings={settings} 
              updateSettings={updateSettings}
            />} />
            
            <Route path="team" element={<AdminTeam 
              team={team} setTeam={setTeam} t={t} 
            />} />
            <Route path="logo" element={<AdminLogo 
              settings={settings} updateSettings={updateSettings} t={t} 
            />} />

            {/* Footer Settings */}
            <Route path="footer" element={<AdminFooter 
              settings={settings} updateSettings={updateSettings} t={t} 
            />} />

            {/* Events & Gallery */}
            <Route path="events" element={<AdminEvents 
              events={events} setEvents={setEvents} t={t} 
              settings={settings} updateSettings={updateSettings}
            />} />
            <Route path="events/aarti" element={<AdminDailyAarti 
              settings={settings} updateSettings={updateSettings} t={t} 
            />} />
            <Route path="gallery" element={<AdminGallery 
              gallery={gallery} setGallery={setGallery} 
              galleryVideos={galleryVideos} setGalleryVideos={setGalleryVideos} 
              t={t} 
            />} />

            {/* Donations & Bookings */}
            <Route path="donations" element={<AdminDonations 
              donations={donations} setDonations={setDonations} 
              settings={settings} updateSettings={updateSettings} 
              t={t} lang={lang} 
            />} />
            <Route path="bookings" element={<AdminBookings 
              bookings={bookings} setBookings={setBookings} t={t} 
            />} />

            {/* Notice & Blogs */}
            <Route path="notice" element={<AdminNotice 
              settings={settings} updateSettings={updateSettings} t={t} 
            />} />
            <Route path="blogs" element={<AdminBlogs 
              settings={settings} updateSettings={updateSettings} t={t} 
            />} />

            {/* Contact Messages */}
            <Route path="contact" element={<AdminContact t={t} />} />

            {/* Visitor Analytics */}
            <Route path="visitors" element={<AdminVisitor t={t} />} />

            {/* Backup & Restore */}
            <Route path="backup" element={<AdminBackup t={t} />} />

            {/* Cloud Storage */}
            <Route path="cloud" element={<CloudPhotoPage />} />

            {/* Notifications & Settings */}
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="settings" element={<AdminSettings />} />

            {/* Social Links - NEW */}
            <Route path="social" element={<AdminSocial 
              settings={settings} 
              updateSettings={updateSettings} 
              t={t} 
            />} />

            {/* Facebook Video Embeds */}
            <Route path="facebook-video" element={<AdminFacebookVideos 
              settings={settings} 
              updateSettings={updateSettings} 
              t={t} 
            />} />
          </Routes>
        </div>
      </div>

      {/* Hide scrollbar styles */}
      <style>{`
        /* Hide scrollbar for main content */
        .main-content-scroll::-webkit-scrollbar,
        .content-scroll::-webkit-scrollbar {
          width: 0;
          display: none;
        }
        .main-content-scroll,
        .content-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Hide scrollbar for entire page */
        .admin-page {
          overflow: hidden;
        }
        
        /* Smooth scrolling */
        .main-content-scroll {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
};

export default AdminPage;