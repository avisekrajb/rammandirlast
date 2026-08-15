import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Sun, 
  Clock,
  Send,
  MessageCircle,
} from 'lucide-react';

// CORRECT: Use the full embed URL format (NOT the short maps.app.goo.gl URL)
// This is the official Google Maps embed URL that works in iframes
const DEFAULT_MAP_URL = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3532.338901892935!2d85.33819027546734!3d27.706820676182815!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb19761839ec2b%3A0xcc3f44bcaa9f2a2f!2sRam%20Mandir%2C%20Battisputali!5e0!3m2!1sen!2snp!4v1786766027231!5m2!1sen!2snp";

// Fallback map in case the primary one fails - Kathmandu city center
const FALLBACK_MAP_URL = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14129.325401675968!2d85.310921018506!3d27.701616110994977!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb198a307baabf%3A0xb5137c1bf18db1ea!2sKathmandu%2044600!5e0!3m2!1sen!2snp!4v1700000000000!5m2!1sen!2snp";

const Footer = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [settings, setSettings] = useState(null);
  const [footerSettings, setFooterSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [scrollColor, setScrollColor] = useState('text-violet-400');
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/admin/settings');
        setSettings(response.data);
        const footerData = response.data?.footer || {};
        setFooterSettings({
          enabled: footerData.enabled !== undefined ? footerData.enabled : true,
          ...footerData
        });
      } catch (error) {
        console.error('Error fetching settings:', error);
        setFooterSettings({ enabled: true });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Color change effect for scrollable text
  useEffect(() => {
    const interval = setInterval(() => {
      setScrollColor(prev => 
        prev === 'text-violet-400' ? 'text-white' : 'text-violet-400'
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setSubscribing(true);
    try {
      await api.post('/subscribe', { email });
      setIsSubscribed(true);
      showToast('Successfully subscribed! You\'ll receive important updates.', 'success');
      setEmail('');
    } catch (error) {
      console.error('Subscribe error:', error);
      showToast(error.response?.data?.message || 'Subscription failed. Please try again.', 'error');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return null;
  }

  const footer = footerSettings || { enabled: true };
  const logoText = settings?.logo?.text?.[lang] || t.templeName || 'Shree Ramchandra Temple';
  const logoPhoto = settings?.logo?.photo || null;
  const timings = settings?.timings || { open: '05:00 AM', close: '08:00 PM' };
  const currentYear = new Date().getFullYear();

  const getBgStyle = () => {
    if (footer.bgType === 'image' && footer.bgImage) {
      return { 
        backgroundImage: `url(${footer.bgImage})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      };
    }
    if (footer.bgType === 'video' && footer.bgVideo) {
      return { position: 'relative' };
    }
    return { backgroundColor: footer.bgColor || '#ffffff' };
  };

  const getLogoShapeClass = () => {
    const shape = footer.logoShape || 'circle';
    const size = footer.logoSize || 'lg';
    const sizeMap = { sm: 'w-20 h-20', md: 'w-28 h-28', lg: 'w-36 h-36' };
    const shapeMap = { 
      circle: 'rounded-full', 
      square: 'rounded-lg', 
      rectangle: 'rounded-lg w-36 h-24' 
    };
    return `${sizeMap[size] || sizeMap.lg} ${shapeMap[shape] || shapeMap.circle}`;
  };

  // Navigation Buttons from settings - No Icons, No Boxes
  const defaultNavButtons = [
    { label: { en: 'Home', ne: 'गृह', hi: 'होम', zh: '首页', ta: 'முகப்பு' }, path: '/' },
    { label: { en: 'About', ne: 'बारे', hi: 'के बारे में', zh: '关于', ta: 'பற்றி' }, path: '/about' },
    { label: { en: 'History', ne: 'इतिहास', hi: 'इतिहास', zh: '历史', ta: 'வரலாறு' }, path: '/history' },
    { label: { en: 'Events', ne: 'कार्यक्रम', hi: 'आयोजन', zh: '活动', ta: 'நிகழ்வுகள்' }, path: '/events' },
    { label: { en: 'Gallery', ne: 'ग्यालरी', hi: 'गैलरी', zh: '画廊', ta: 'கேலரி' }, path: '/gallery' },
    { label: { en: 'Blogs', ne: 'ब्लग', hi: 'ब्लॉग', zh: '博客', ta: 'வலைப்பதிவு' }, path: '/blogs' },
    { label: { en: 'Contact', ne: 'सम्पर्क', hi: 'संपर्क', zh: '联系', ta: 'தொடர்பு' }, path: '/contact' },
    { label: { en: 'Donate', ne: 'दान', hi: 'दान', zh: '捐赠', ta: 'நன்கொடை' }, path: '/donate' },
    { label: { en: 'Team', ne: 'टोली', hi: 'टीम', zh: '团队', ta: 'குழு' }, path: '/templeteams' },
  ];

  const navButtons = footer.navButtons || defaultNavButtons;

  const getLocalizedText = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj.en || '';
  };

  if (footer.enabled === false) {
    return null;
  }

  const isDarkBg = footer.bgType === 'image' || footer.bgType === 'video' || 
                   (footer.bgColor && footer.bgColor !== '#ffffff' && footer.bgColor !== '#f8f5f0');

  // Click handlers for contact items
  const handlePhoneClick = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone.replace(/\s/g, '')}`;
    }
  };

  const handleEmailClick = (email) => {
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  const handleAddressClick = (address) => {
    if (address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    }
  };

  // Handle map error - fallback to Kathmandu map
  const handleMapError = () => {
    setMapError(true);
  };

  // Get the map URL to use
  const getMapUrl = () => {
    if (mapError) {
      return FALLBACK_MAP_URL;
    }
    // Check if footer.mapUrl is a short link (contains maps.app.goo.gl)
    const userMapUrl = footer.mapUrl;
    if (userMapUrl && userMapUrl.includes('maps.app.goo.gl')) {
      // If it's a short link, use default instead
      return DEFAULT_MAP_URL;
    }
    return userMapUrl || DEFAULT_MAP_URL;
  };

  return (
    <footer className="relative overflow-hidden mt-10" style={getBgStyle()}>
      {/* Jai Shree Ram Banner - Top Center */}
      {footer.bgType === 'video' && footer.bgVideo && (
        <video 
          className="absolute inset-0 w-full h-full object-cover"
          src={footer.bgVideo}
          autoPlay
          muted
          loop
          playsInline
        />
      )}
      
      {(footer.bgType === 'image' || footer.bgType === 'video') && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      <div className="relative z-10">
        {/* Top Banner - Clean, just text */}
        <div className={`py-3 text-center border-b ${isDarkBg ? 'border-white/10' : 'border-gray-200'}`}>
          <span className={`font-bold text-sm md:text-base tracking-[0.15em] uppercase ${
            isDarkBg ? 'text-white/90' : 'text-maroon'
          }`} style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", letterSpacing: '0.15em' }}>
            🕉 {getLocalizedText(footer.footerText?.blessing) || t.footerBlessing || 'Jai Shree Ram'} 🕉
          </span>
        </div>

        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand Column - Logo on top, temple name below */}
            <div className="lg:col-span-1">
              <div className="flex flex-col items-center md:items-start">
                <div className={`${getLogoShapeClass()} bg-gradient-to-br from-vermilion to-maroon-deep text-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg shadow-vermilion/20`}>
                  {logoPhoto ? (
                    <img src={logoPhoto} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Sun size={footer.logoSize === 'lg' ? 56 : footer.logoSize === 'sm' ? 32 : 44} />
                  )}
                </div>
                {/* Temple Name - Below the logo */}
                <div className="mt-3 text-center md:text-left">
                  <span className={`font-serif font-bold text-3xl block leading-tight drop-shadow-lg ${isDarkBg ? 'text-white' : 'text-ink'}`}>
                    {logoText}
                  </span>
                  <span className={`text-sm drop-shadow ${isDarkBg ? 'text-white/70' : 'text-ink-soft'}`}>
                    {t.footerLocationLine || 'Gaushala, Kathmandu'}
                  </span>
                </div>
              </div>
              
              <p className={`text-sm leading-relaxed mt-4 max-w-sm drop-shadow ${isDarkBg ? 'text-white/80' : 'text-ink-soft'}`}>
                {t.footerDescription || 'A sacred Vaishnava temple dedicated to Lord Ram, Sita, and Lakshman, serving devotees for generations on the banks of the Bagmati River.'}
              </p>

              <div className={`mt-4 flex items-center gap-2 text-sm ${isDarkBg ? 'text-white/80' : 'text-ink-soft'}`}>
                <Clock size={16} className="text-marigold" />
                <span>
                  <span className={`font-medium ${isDarkBg ? 'text-white' : 'text-ink'}`}>{t.openHours || 'Darshan'}:</span> {timings.open} – {timings.close}
                </span>
              </div>

              {/* WhatsApp Button */}
              <div className="mt-5">
                <a
                  href="https://wa.me/9779851154432?text=Namaste!%20I%20want%20to%20know%20more%20about%20Shree%20Ramchandra%20Temple"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 ${
                    isDarkBg 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30' 
                      : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                  }`}
                >
                  <MessageCircle size={16} />
                  <span>{t.footerWhatsApp || 'Chat on WhatsApp'}</span>
                </a>
              </div>
            </div>

            {/* Navigation Buttons - PLAIN TEXT LINKS, NO BOXES */}
            {footer.showQuickLinks !== false && navButtons && navButtons.length > 0 && (
              <div>
                <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-4 drop-shadow ${isDarkBg ? 'text-white' : 'text-ink'}`}>
                  {t.navigation || 'Quick Navigation'}
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  {navButtons.map((btn, index) => (
                    <Link
                      key={index}
                      to={btn.path}
                      className={`inline-flex items-center justify-center px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${
                        isDarkBg 
                          ? 'text-white/70 bg-white/10 hover:bg-white/20 hover:text-white border border-white/15' 
                          : 'text-ink-soft bg-white hover:text-vermilion hover:border-vermilion border border-gray-200'
                      }`}
                    >
                      {getLocalizedText(btn.label)}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Info - Clickable */}
            {footer.showContact !== false && (
              <div>
                <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-4 drop-shadow ${isDarkBg ? 'text-white' : 'text-ink'}`}>
                  {t.contactInfo || 'Get in Touch'}
                </h5>
                <ul className="space-y-3">
                  <li 
                    className="group cursor-pointer"
                    onClick={() => handleAddressClick(getLocalizedText(footer.contactInfo?.address) || 'Battisputali, Gaushala, Kathmandu, Nepal')}
                  >
                    <span className={`text-sm leading-relaxed transition-colors duration-300 ${isDarkBg ? 'text-white/60 hover:text-white' : 'text-ink-soft/70 hover:text-ink'}`}>
                      {getLocalizedText(footer.contactInfo?.address) || 'Battisputali, Gaushala, Kathmandu, Nepal'}
                    </span>
                  </li>
                  <li 
                    className="group cursor-pointer"
                    onClick={() => handlePhoneClick(footer.contactInfo?.phone || '+977-1-4XXXXXX')}
                  >
                    <span className={`text-sm transition-colors duration-300 ${isDarkBg ? 'text-white/60 hover:text-white' : 'text-ink-soft/70 hover:text-ink'}`}>
                      {footer.contactInfo?.phone || '+977-1-4XXXXXX'}
                    </span>
                  </li>
                  <li 
                    className="group cursor-pointer"
                    onClick={() => handleEmailClick(footer.contactInfo?.email || 'info@ramchandratemple.org.np')}
                  >
                    <span className={`text-sm transition-colors duration-300 ${isDarkBg ? 'text-white/60 hover:text-white' : 'text-ink-soft/70 hover:text-ink'}`}>
                      {footer.contactInfo?.email || 'info@ramchandratemple.org.np'}
                    </span>
                  </li>
                </ul>
              </div>
            )}

            {/* Subscribe & Map Section - No Icons */}
            <div className="space-y-6">
              {/* Subscribe Section */}
              {footer.showSubscribe !== false && (
                <div>
                  <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-4 drop-shadow ${isDarkBg ? 'text-white' : 'text-ink'}`}>
                    {t.subscribe || 'Stay Updated'}
                  </h5>
                  {isSubscribed ? (
                    <div className={`text-sm ${isDarkBg ? 'text-green-400' : 'text-green-600'} flex items-center gap-2 p-3 rounded-xl ${isDarkBg ? 'bg-white/5' : 'bg-green-50'}`}>
                      <span>✅</span> {t.subscribed || 'Subscribed successfully!'}
                    </div>
                  ) : (
                    <form onSubmit={handleSubscribe} className="space-y-3">
                      <div className="relative">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t.enterEmail || 'Enter your email...'}
                          className={`w-full px-4 py-3 pr-12 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-vermilion transition-all duration-300 ${
                            isDarkBg 
                              ? 'bg-white/10 text-white placeholder-white/50 border border-white/20 focus:border-white/40' 
                              : 'bg-white border border-gray-200 text-ink placeholder-ink-soft focus:border-vermilion'
                          }`}
                          required
                        />
                        <button
                          type="submit"
                          disabled={subscribing}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-300 ${
                            isDarkBg 
                              ? 'bg-marigold/20 text-marigold hover:bg-marigold/30' 
                              : 'bg-vermilion/10 text-vermilion hover:bg-vermilion/20'
                          } disabled:opacity-50`}
                        >
                          {subscribing ? (
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin block" />
                          ) : (
                            <Send size={16} />
                          )}
                        </button>
                      </div>
                      <p className={`text-xs ${isDarkBg ? 'text-white/40' : 'text-ink-soft/60'}`}>
                        {t.subscribeInfo || 'Get important updates about events and temple news.'}
                      </p>
                    </form>
                  )}
                </div>
              )}

              {/* Map Section - with error handling */}
              {footer.showMap !== false && (
                <div>
                  <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 drop-shadow ${isDarkBg ? 'text-white' : 'text-ink'}`}>
                    {t.location || 'Find Us'}
                  </h5>
                  <div className={`rounded-xl overflow-hidden border ${isDarkBg ? 'border-white/10' : 'border-gray-200'} shadow-lg`}>
                    <iframe
                      src={getMapUrl()}
                      className="w-full h-48"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Ram Mandir, Battisputali, Kathmandu"
                      onError={handleMapError}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar - "Powered by ZeroInfinity" Centered - Clickable */}
        <div className={`border-t ${isDarkBg ? 'border-white/10 bg-black/20' : 'border-gray-100 bg-gray-50/50'}`}>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col items-center justify-center gap-2">
              {/* Copyright */}
              <p className={`text-xs font-medium ${isDarkBg ? 'text-white/60' : 'text-ink-soft/70'}`}>
                © {currentYear} {logoText}. All rights reserved.
              </p>
              
              {/* Mini Scrollable "Powered by ZeroInfinity" - Clickable, No Icon, Centered */}
              <div className="w-full max-w-xs overflow-hidden text-center">
                <a
                  href="https://www.zeroinfinitytechnologies.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs font-medium tracking-wider transition-colors duration-1000 ${scrollColor} hover:opacity-80`}
                >
                  <div className="animate-marquee whitespace-nowrap inline-block">
                    {t.footerPowered || 'Powered by ZeroInfinity'}
                  </div>
                </a>
              </div>

              {/* Legal Links */}
              <div className="flex items-center gap-4 text-[11px]">
                <Link 
                  to="/privacy" 
                  className={`transition-all duration-300 ${isDarkBg ? 'text-white/40 hover:text-white' : 'text-ink-soft/40 hover:text-ink'}`}
                >
                  {t.footerPrivacy || 'Privacy Policy'}
                </Link>
                <span className={`w-px h-3 ${isDarkBg ? 'bg-white/20' : 'bg-gray-200'}`} />
                <Link 
                  to="/terms" 
                  className={`transition-all duration-300 ${isDarkBg ? 'text-white/40 hover:text-white' : 'text-ink-soft/40 hover:text-ink'}`}
                >
                  {t.footerTerms || 'Terms of Service'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden element to detect footer presence for scroll button */}
      <div id="footer-detector" className="h-0.5 w-full opacity-0 pointer-events-none" />
    </footer>
  );
};

export default Footer;