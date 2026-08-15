import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  LayoutDashboard, 
  Users, 
  Video, 
  Quote, 
  Clock, 
  Info, 
  ScrollText, 
  Users as UsersIcon, 
  Image, 
  CalendarDays, 
  Image as GalleryIcon, 
  QrCode, 
  ClipboardList,
  LogOut,
  ArrowLeft,
  Sun,
  ChevronRight,
  Gift,
  Bell,
  Cloud,
  FolderOpen,
  BookOpen,
  Home,
  Settings,
  Shield,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Globe,
  Menu,
  X,
  ChevronDown,
  MessageCircle,
  FileText,
  Activity,
  BarChart3,
  PieChart,
  TrendingUp,
  Database,
  Share2 // <-- Added Share2 icon
} from 'lucide-react';

const AdminSidebar = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [settings, setSettings] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    content: true,
    management: true,
    settings: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/admin/settings');
        setSettings(response.data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const currentTab = location.pathname.split('/admin/')[1] || 'overview';

  const isSuperAdmin = user?.role === 'superadmin';

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get logo from settings
  const logoPhoto = settings?.logo?.photo || null;
  const logoText = settings?.logo?.text?.en || 'Shree Ramchandra';

  const menuSections = [
    {
      id: 'content',
      label: t.content || 'Content',
      icon: LayoutDashboard,
      items: [
        { key: 'overview', label: t.overview || 'Overview', icon: LayoutDashboard },
        { key: 'home', label: 'Home Settings', icon: Home },
        { key: 'about', label: t.aboutSection || 'About', icon: Info },
        { key: 'history', label: t.manageHistory || 'History', icon: ScrollText },
        { key: 'team', label: t.manageTeam || 'Team', icon: UsersIcon },
        { key: 'events', label: t.manageEvents || 'Events', icon: CalendarDays },
        { key: 'blogs', label: 'Blogs', icon: BookOpen },
        { key: 'gallery', label: t.manageGallery || 'Gallery', icon: GalleryIcon },
        { key: 'notice', label: 'Notice Modal', icon: Bell },
      ]
    },
    {
      id: 'management',
      label: t.management || 'Management',
      icon: Settings,
      items: [
        { key: 'users', label: t.manageUsers || 'Users', icon: Users },
        { key: 'bookings', label: t.manageBooking || 'Bookings', icon: ClipboardList },
        { key: 'donations', label: t.manageDonate || 'Donations', icon: Gift },
        { key: 'contact', label: 'Contact Messages', icon: Mail },
        { key: 'visitors', label: 'Visitor Analytics', icon: Activity },
        { key: 'backup', label: 'Backup & Restore', icon: Database },
        { key: 'cloud', label: 'Cloud Storage', icon: Cloud },
        { key: 'cloudgallery', label: 'Cloud Gallery', icon: FolderOpen },
      ]
    },
    {
      id: 'settings',
      label: t.settings || 'Settings',
      icon: Settings,
      items: [
        { key: 'hero', label: t.heroBanner || 'Hero Banner', icon: Video },
        { key: 'quote', label: t.dailyQuote || 'Daily Quote', icon: Quote },
        { key: 'timings', label: t.templeTimings || 'Timings', icon: Clock },
        { key: 'logo', label: t.logoQr || 'Logo', icon: Image },
        { key: 'footer', label: 'Footer Settings', icon: Settings },
        { key: 'social', label: 'Social Links', icon: Share2 }, // <-- Added Social Links
      ]
    }
  ];

  const handleNavigate = (key) => {
    navigate(`/admin/${key}`);
    if (onClose) onClose();
  };

  // Superadmins only see: Overview, Visitor Analytics, and Settings
  // (Settings contains Activity Logs and Create New Admin). User panel is hidden.
  const visibleMenuSections = isSuperAdmin
    ? [
        {
          id: 'content',
          label: t.overview || 'Overview',
          icon: LayoutDashboard,
          items: [
            { key: 'overview', label: t.overview || 'Overview', icon: LayoutDashboard },
            { key: 'visitors', label: 'Visitor Analytics', icon: Activity },
          ],
        },
        {
          id: 'settings',
          label: t.settings || 'Settings',
          icon: Settings,
          items: [
            { key: 'settings', label: 'Activity Logs & Create Admin', icon: Settings },
          ],
        },
      ]
    : menuSections;

  const handleLogout = () => {
    logout();
    navigate('/');
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay - slides in from left */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl border-r border-gray-100 transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:shadow-none flex flex-col h-screen`}
      >
        {/* Header - fixed at top */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-white to-gray-50 sticky top-0 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-vermilion to-maroon-deep text-white flex items-center justify-center shadow-lg shadow-vermilion/20 overflow-hidden">
            {logoPhoto ? (
              <img src={logoPhoto} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Sun size={20} />
            )}
          </div>
          <div>
            <span className="font-bold text-sm text-ink block">{t.adminDashboard || 'Admin Panel'}</span>
            <span className="text-[10px] text-ink-soft font-medium flex items-center gap-1">
              <Shield size={10} className="text-vermilion" />
              {user?.role === 'superadmin' ? 'Super Admin' : (user?.name || 'Administrator')}
            </span>
          </div>
        </div>

        {/* Scrollable navigation - independent scrolling with hidden scrollbar */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-3 sidebar-scroll">
          {visibleMenuSections.map((section) => {
            const SectionIcon = section.icon;
            const isExpanded = expandedSections[section.id];
            
            return (
              <div key={section.id} className="space-y-1">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-ink-soft/60 hover:text-ink transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <SectionIcon size={14} />
                    {section.label}
                  </span>
                  <ChevronDown 
                    size={14} 
                    className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Section Items */}
                {isExpanded && (
                  <div className="space-y-0.5 pl-2">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => handleNavigate(item.key)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                            isActive
                              ? 'bg-gradient-to-r from-vermilion/10 to-maroon/5 text-vermilion shadow-sm'
                              : 'text-ink-soft hover:bg-gray-50 hover:text-ink'
                          }`}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-vermilion rounded-r-full" />
                          )}
                          <Icon 
                            size={18} 
                            className={`transition-colors flex-shrink-0 ${
                              isActive ? 'text-vermilion' : 'text-ink-soft group-hover:text-ink'
                            }`} 
                          />
                          <span className="flex-1 text-left">{item.label}</span>
                          {isActive && <ChevronRight size={14} className="text-vermilion" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer - fixed at bottom */}
        <div className="border-t border-gray-100 p-3 space-y-1 flex-shrink-0 bg-gradient-to-r from-gray-50 to-white sticky bottom-0 z-10">
          <button
            onClick={() => { navigate('/'); if (onClose) onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ink-soft hover:bg-gray-50 hover:text-ink transition-all duration-200"
          >
            <ArrowLeft size={18} />
            <span>{t.goHome || 'Back to Site'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut size={18} />
            <span>{t.logout || 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      {/* Hide scrollbar styles */}
      <style>{`
        /* Hide scrollbar for sidebar */
        .sidebar-scroll::-webkit-scrollbar {
          width: 0;
          display: none;
        }
        .sidebar-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Smooth animations */
        .animate-in {
          animation-duration: 0.3s;
          animation-fill-mode: both;
        }
        .fade-in {
          animation-name: fadeIn;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default AdminSidebar;