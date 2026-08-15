import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Home, Info, ScrollText, CalendarDays, ImageIcon, Hand, Gift, Phone,
  Globe, User, LogOut, Menu, X, ChevronDown, MapPin, Sun, BadgeCheck,
  CircleDot, LayoutDashboard, ClipboardList, ChevronRight, Plus, Users, BookOpen
} from 'lucide-react';

const Header = ({ onLogout, setAuthModal }) => {
  const { t, lang, setLang } = useLanguage();
  const { user } = useAuth();
  const isAdminUser = user?.role === 'admin' || user?.role === 'superadmin';
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const headerRef = useRef(null);

  // Fetch admin settings for logo
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

  // Navigation items - BLOGS HIDDEN from header
  const navItems = useMemo(() => [
    { key: '/', label: t.navHome || 'Home', icon: Home, protected: false },
    { key: '/about', label: t.navAbout || 'About Us', icon: Info, protected: false },
    { key: '/history', label: t.navHistory || 'History', icon: ScrollText, protected: false },
    // BLOGS REMOVED FROM HEADER - hidden
    // { key: '/blogs', label: t.navBlogs || 'Blogs', icon: BookOpen, protected: false },
    { key: '/events', label: t.navEvents || 'Events', icon: CalendarDays, protected: false },
    { key: '/gallery', label: t.navGallery || 'Gallery', icon: ImageIcon, protected: false },
    { key: '/booking', label: t.navBooking || 'Book Puja', icon: Hand, protected: true },
    { key: '/donate', label: t.navDonate || 'Donate', icon: Gift, protected: true },
    { key: '/contact', label: t.navContact || 'Contact', icon: Phone, protected: false },
  ], [t]);

  const languages = [
    { code: 'en', label: t.langEnglish || 'English' },
    { code: 'ne', label: t.langNepali || 'नेपाली' },
    { code: 'hi', label: t.langHindi || 'हिन्दी' },
    { code: 'zh', label: t.langChinese || '中文' },
    { code: 'ta', label: t.langTamil || 'தமிழ்' },
  ];

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setLangMenuOpen(false);
        setProfileMenuOpen(false);
        setAboutDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleNavClick = (path, isProtected) => {
    setMobileNavOpen(false);
    setAboutDropdownOpen(false);
    setLangMenuOpen(false);
    setProfileMenuOpen(false);
    
    if (isProtected && !user) {
      setAuthModal('login');
      return;
    }
    
    navigate(path);
  };

  const handleLangSelect = (code) => {
    setLang(code);
    setLangMenuOpen(false);
  };

  const handleLogoutClick = () => {
    setProfileMenuOpen(false);
    setLogoutConfirmOpen(true);
  };

  const handleLogoutConfirm = () => {
    setLogoutConfirmOpen(false);
    onLogout();
  };

  const handleLogoutCancel = () => {
    setLogoutConfirmOpen(false);
  };

  // Get user profile photo or fallback
  const userProfilePhoto = user?.profilePhoto || null;
  
  // Get logo settings from admin with fallbacks
  const logoPhoto = settings?.logo?.photo || null;
  const logoText = settings?.logo?.text?.[lang] || t.templeName || 'Shree Ramchandra Temple';
  const logoSettings = settings?.logo || {};
  
  // Logo styling from admin settings with MODERN CONSTRAINTS
  const logoSize = logoSettings.size || 'w-12 h-12';
  const logoShape = logoSettings.shape || 'rounded-xl';
  const logoBgColor = logoSettings.bgColor || 'from-vermilion to-maroon-deep';
  const showText = logoSettings.showText !== false;
  const textColor = logoSettings.textColor || 'text-maroon';
  // INCREASED TEXT SIZE - Responsive with bigger mobile size
  const textSize = logoSettings.textSize || 'text-[11px] sm:text-xs md:text-sm lg:text-base';
  const fontWeight = logoSettings.fontWeight || 'font-bold';
  const showLocation = logoSettings.showLocation !== false;

  // Get max width based on logo size to prevent stretching
  const getLogoMaxWidth = (size) => {
    const maxWidths = {
      'w-8 h-8': 'max-w-[32px]',
      'w-10 h-10': 'max-w-[40px]',
      'w-12 h-12': 'max-w-[48px]',
      'w-14 h-14': 'max-w-[56px]',
      'w-16 h-16': 'max-w-[64px]',
      'w-20 h-20': 'max-w-[80px]',
    };
    return maxWidths[size] || 'max-w-[48px]';
  };

  const logoMaxWidth = getLogoMaxWidth(logoSize);

  // Split logo text into parts for wrapping
  const splitLogoText = (text) => {
    if (!text) return { first: '', second: '' };
    const words = text.split(' ');
    if (words.length <= 2) {
      return { first: words[0] || '', second: words.slice(1).join(' ') || '' };
    }
    // If more than 2 words, split at the middle
    const mid = Math.ceil(words.length / 2);
    return {
      first: words.slice(0, mid).join(' '),
      second: words.slice(mid).join(' ')
    };
  };

  const { first: logoFirstPart, second: logoSecondPart } = splitLogoText(logoText);

  return (
    <>
      <header className="rt-header" ref={headerRef}>
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-4 md:px-6 h-16 sm:h-[72px] md:h-[76px]">
          {/* Logo - Using settings from admin with text wrapping and size constraints */}
          <button 
            onClick={() => handleNavClick('/', false)} 
            className="flex items-center gap-2 sm:gap-3 bg-transparent border-0 p-0 text-left group flex-shrink-0 min-w-0"
          >
            <div className={`${logoSize} ${logoShape} bg-gradient-to-br ${logoBgColor} text-white flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg shadow-vermilion/20 group-hover:shadow-xl group-hover:shadow-vermilion/30 transition-all duration-300 group-hover:scale-105 ${logoMaxWidth}`}>
              {logoPhoto ? (
                <img src={logoPhoto} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Sun size={20} strokeWidth={2.2} className="text-white/90" />
              )}
            </div>
            {showText && (
              <div className="flex flex-col leading-tight min-w-0 max-w-[140px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[260px]">
                {/* Temple Name with BR tag for wrapping - INCREASED SIZE */}
                <span className={`font-serif ${textSize} ${fontWeight} ${textColor} group-hover:text-[#8a2430] transition-colors duration-300 leading-tight`}>
                  {logoFirstPart}
                  {logoSecondPart && (
                    <>
                      <br />
                      {logoSecondPart}
                    </>
                  )}
                </span>
                {showLocation && (
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] text-ink-soft flex items-center gap-1 truncate mt-0.5">
                    <MapPin size={9} className="text-vermilion flex-shrink-0" /> 
                    <span className="truncate">{t.templeSub || 'Gaushala, Kathmandu'}</span>
                  </span>
                )}
              </div>
            )}
          </button>

          {/* Desktop Navigation - Mini responsive buttons */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
            {navItems.map((item) => {
              if (item.key === '/about') {
                return (
                  <div key={item.key} className="relative">
                    <button
                      onClick={() => setAboutDropdownOpen(!aboutDropdownOpen)}
                      className={`px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-full text-xs xl:text-sm font-semibold transition-all duration-200 inline-flex items-center gap-1 ${
                        isActive(item.key) || location.pathname === '/templeteams'
                          ? 'bg-maroon text-white shadow-sm shadow-maroon/20' 
                          : 'text-ink-soft hover:text-maroon hover:bg-maroon/10'
                      }`}
                    >
                      <span className="truncate max-w-[60px] xl:max-w-full">{item.label}</span>
                      <ChevronDown size={12} className={`transition-transform duration-200 ${aboutDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {aboutDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1.5 bg-white border border-line rounded-xl shadow-lg min-w-[160px] p-1.5 z-50 animate-fadeIn">
                        <button
                          onClick={() => handleNavClick('/about', false)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-panel transition-colors duration-200"
                        >
                          <Info size={15} className="text-vermilion" />
                          {t.navAbout || 'About Us'}
                        </button>
                        <button
                          onClick={() => handleNavClick('/templeteams', false)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-panel transition-colors duration-200"
                        >
                          <Users size={15} className="text-vermilion" />
                          {t.teamMembers || 'Team Members'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key, item.protected)}
                  className={`px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-full text-xs xl:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                    isActive(item.key) 
                      ? 'bg-maroon text-white shadow-sm shadow-maroon/20' 
                      : 'text-ink-soft hover:text-maroon hover:bg-maroon/10'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
            {/* Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1 bg-white border border-line rounded-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:border-vermilion transition-all duration-200"
              >
                <Globe size={14} className="text-ink-soft" />
                <span className="font-bold text-[10px] sm:text-xs hidden sm:inline text-ink">{lang.toUpperCase()}</span>
                <ChevronDown size={10} className="text-ink-soft" />
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 bg-white border border-line rounded-xl shadow-lg min-w-[160px] p-1.5 z-50 animate-fadeIn">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => handleLangSelect(l.code)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium hover:bg-panel transition-colors duration-200 ${
                        lang === l.code ? 'text-vermilion font-bold bg-vermilion/5' : 'text-ink'
                      }`}
                    >
                      {l.label}
                      {lang === l.code && <span className="text-vermilion">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border-2 transition-all duration-200 ${
                  user ? 'bg-maroon text-white border-maroon shadow-md shadow-maroon/20' : 'bg-white border-line hover:border-vermilion'
                } overflow-hidden`}
              >
                {user ? (
                  userProfilePhoto ? (
                    <img 
                      src={userProfilePhoto} 
                      alt={user.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs sm:text-sm font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                  )
                ) : (
                  <User size={16} className="text-ink-soft" />
                )}
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 bg-white border border-line rounded-xl shadow-lg min-w-[220px] sm:min-w-[250px] p-2 z-50 animate-fadeIn">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-line">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-vermilion to-maroon-deep text-white flex items-center justify-center font-bold text-base overflow-hidden shadow-md shadow-vermilion/20 flex-shrink-0">
                          {userProfilePhoto ? (
                            <img src={userProfilePhoto} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-ink truncate">{user.name}</div>
                          <div className="text-xs text-ink-soft truncate">{user.email}</div>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                            isAdminUser ? 'bg-marigold/20 text-marigold' : 'bg-panel text-maroon'
                          }`}>
                            {isAdminUser ? (
                              <BadgeCheck size={10} />
                            ) : (
                              <CircleDot size={10} />
                            )}
                            {isAdminUser ? t.adminDashboard : t.profile}
                          </span>
                        </div>
                      </div>
                      <div className="py-1">
                        {isAdminUser ? (
                          <button
                            onClick={() => { navigate('/admin'); setProfileMenuOpen(false); }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium hover:bg-panel transition-colors duration-200"
                          >
                            <span className="flex items-center gap-2.5">
                              <LayoutDashboard size={16} className="text-vermilion" /> {t.adminDashboard || 'Admin'}
                            </span>
                            <ChevronRight size={14} className="text-ink-soft" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => { navigate('/profile'); setProfileMenuOpen(false); }}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium hover:bg-panel transition-colors duration-200"
                            >
                              <span className="flex items-center gap-2.5">
                                <User size={16} className="text-vermilion" /> {t.profile || 'Profile'}
                              </span>
                              <ChevronRight size={14} className="text-ink-soft" />
                            </button>
                            <button
                              onClick={() => { navigate('/mybookings'); setProfileMenuOpen(false); }}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium hover:bg-panel transition-colors duration-200"
                            >
                              <span className="flex items-center gap-2.5">
                                <ClipboardList size={16} className="text-vermilion" /> {t.myBookings || 'My Bookings'}
                              </span>
                              <ChevronRight size={14} className="text-ink-soft" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => { handleNavClick('/donate', true); setProfileMenuOpen(false); }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium hover:bg-panel transition-colors duration-200"
                        >
                          <span className="flex items-center gap-2.5">
                            <Gift size={16} className="text-vermilion" /> {t.navDonate || 'Donate'}
                          </span>
                          <ChevronRight size={14} className="text-ink-soft" />
                        </button>
                      </div>
                      <div className="border-t border-line pt-1">
                        <button
                          onClick={handleLogoutClick}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors duration-200"
                        >
                          <LogOut size={16} /> {t.logout || 'Logout'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setAuthModal('login'); setProfileMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-panel transition-colors duration-200"
                      >
                        <User size={16} className="text-vermilion" /> {t.login || 'Login'}
                      </button>
                      <button
                        onClick={() => { setAuthModal('signup'); setProfileMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-panel transition-colors duration-200"
                      >
                        <Plus size={16} className="text-vermilion" /> {t.signup || 'Sign Up'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden bg-white border border-line rounded-xl p-2 hover:border-vermilion transition-all duration-200"
              aria-label="Menu"
            >
              {mobileNavOpen ? <X size={18} className="text-ink" /> : <Menu size={18} className="text-ink" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white ${
          mobileNavOpen ? 'max-h-[calc(100vh-80px)] border-t border-line shadow-lg' : 'max-h-0'
        }`}>
          <div className="py-2 px-4 overflow-y-auto max-h-[calc(100vh-160px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key, item.protected)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-sm font-semibold border-b border-line last:border-0 transition-colors duration-200 ${
                    isActive(item.key) ? 'text-vermilion bg-vermilion/5' : 'text-ink-soft hover:text-maroon hover:bg-maroon/5'
                  }`}
                >
                  <Icon size={18} /> {item.label}
                </button>
              );
            })}
            {/* Mobile About Dropdown Items */}
            <button
              onClick={() => handleNavClick('/about', false)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 text-sm font-semibold border-b border-line last:border-0 text-ink-soft hover:text-maroon hover:bg-maroon/5 transition-colors duration-200 pl-12"
            >
              <Info size={17} /> {t.navAbout || 'About Us'}
            </button>
            <button
              onClick={() => handleNavClick('/templeteams', false)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 text-sm font-semibold border-b border-line last:border-0 text-ink-soft hover:text-maroon hover:bg-maroon/5 transition-colors duration-200 pl-12"
            >
              <Users size={17} /> {t.teamMembers || 'Team Members'}
            </button>
          </div>
        </div>

        {/* Add animation keyframes */}
        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-6px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out forwards;
          }
          
          /* Smooth scrolling for mobile nav */
          .overflow-y-auto {
            scrollbar-width: thin;
          }
          .overflow-y-auto::-webkit-scrollbar {
            width: 3px;
          }
          .overflow-y-auto::-webkit-scrollbar-thumb {
            background: #ddd;
            border-radius: 3px;
          }
        `}</style>
      </header>

      {/* Logout Confirmation Modal */}
      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <LogOut size={28} className="text-red-500" />
              </div>
              <h3 className="text-xl font-serif font-bold text-ink mb-2">
                {t.logout || 'Logout'}
              </h3>
              <p className="text-sm text-ink-soft mb-6">
                {t.logoutPromptMsg || 'Are you sure you want to logout?'}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLogoutCancel}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-ink-soft font-medium hover:bg-gray-50 transition-all"
                >
                  {t.notNow || 'Cancel'}
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all"
                >
                  {t.yesLogout || 'Logout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;