import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { adToBs } from '../../utils/nepaliCalendar';
import { 
  Sun, 
  Clock,
  Send,
  MessageCircle,
} from 'lucide-react';

// CORRECT: Use the full embed URL format (NOT the short maps.app.goo.gl URL)
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

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    if (!user) {
      showToast('Please log in to subscribe for updates', 'warning');
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
  // Nepali (Bikram Sambat) users see the BS year, everyone else the Gregorian one
  const bsYear = adToBs(new Date())?.year;
  const currentYear = lang === 'ne' && bsYear ? bsYear : new Date().getFullYear();

  // Only true when there is an actual photo/video OR a custom dark background color
  const hasMedia = (footer.bgType === 'image' && footer.bgImage) || (footer.bgType === 'video' && footer.bgVideo);
  const isDarkColor = footer.bgColor && !(
    ['#ffffff', '#fff', '#fffdfc', '#f8f5f0'].includes(String(footer.bgColor).toLowerCase())
  );
  const hasBg = hasMedia || isDarkColor;

  const getBgStyle = () => {
    if (footer.bgType === 'image' && footer.bgImage) {
      return { backgroundImage: `url(${footer.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' };
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

  // Click handlers for contact items
  const handlePhoneClick = (phone) => {
    if (phone) window.location.href = `tel:${phone.replace(/\s/g, '')}`;
  };
  const handleEmailClick = (email) => {
    if (email) window.location.href = `mailto:${email}`;
  };
  const handleAddressClick = (address) => {
    if (address) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  const handleMapError = () => setMapError(true);

  const getMapUrl = () => {
    if (mapError) return FALLBACK_MAP_URL;
    const userMapUrl = footer.mapUrl;
    if (userMapUrl && userMapUrl.includes('maps.app.goo.gl')) return DEFAULT_MAP_URL;
    return userMapUrl || DEFAULT_MAP_URL;
  };

  return (
    <footer className="relative overflow-hidden mt-10" style={getBgStyle()}>
      {/* Gradient accent top line */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #7A0000, #A23A2E, #9A3412, #5B1420)' }} />

      {/* Video background */}
      {footer.bgType === 'video' && footer.bgVideo && (
        <video className="absolute inset-0 w-full h-full object-cover" src={footer.bgVideo} autoPlay muted loop playsInline />
      )}
      {hasMedia && (
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(35,3,7,0.55) 0%, rgba(35,3,7,0.6) 45%, rgba(35,3,7,0.82) 100%)' }}
        />
      )}

      <div className="relative z-10">
        {/* Top Banner - Clean, just text */}
        <div className={`py-3 text-center border-b ${hasBg ? 'border-white/10' : 'border-gray-100'}`}>
          <span className={`font-bold text-sm md:text-base tracking-[0.15em] uppercase ${hasBg ? 'text-white/90' : 'text-[#8A1D2B]'}`}
            style={{ letterSpacing: '0.15em' }}>
            🕉 {getLocalizedText(footer.footerText?.blessing) || t.footerBlessing || 'Jai Shree Ram'} 🕉
          </span>
        </div>

        {/* Main Footer Content - original 4-column layout */}
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand Column - Logo on top, temple name below */}
            <div className="lg:col-span-1">
              <div className="flex flex-col items-center md:items-start">
                <div
                  className={`${getLogoShapeClass()} flex items-center justify-center overflow-hidden flex-shrink-0`}
                  style={{ background: 'linear-gradient(135deg, #7A0000, #5B1420)', boxShadow: '0 16px 40px -14px rgba(122,0,0,0.5)' }}
                >
                  {logoPhoto ? (
                    <img src={logoPhoto} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Sun size={footer.logoSize === 'lg' ? 56 : footer.logoSize === 'sm' ? 32 : 44} className="text-[#F5BEAE]" />
                  )}
                </div>
                {/* Temple Name - Below the logo */}
                <div className="mt-3 text-center md:text-left">
                  <span className={`font-serif font-bold text-3xl block leading-tight ${hasBg ? 'text-white' : 'text-gray-900'}`}>
                    {logoText}
                  </span>
                  <span className={`text-sm ${hasBg ? 'text-white/70' : 'text-gray-700'}`}>
                    {t.footerLocationLine || 'Gaushala, Kathmandu'}
                  </span>
                </div>
              </div>

              <p className={`text-sm leading-relaxed mt-4 max-w-sm ${hasBg ? 'text-white/80' : 'text-gray-700'}`}>
                {t.footerDescription || 'A sacred Vaishnava temple dedicated to Lord Ram, Sita, and Lakshman, serving devotees for generations on the banks of the Bagmati River.'}
              </p>

              <div className={`mt-4 flex items-center gap-2 text-sm ${hasBg ? 'text-white/80' : 'text-gray-700'}`}>
                <Clock size={16} style={{ color: '#A23A2E' }} />
                <span>
                  <span className={`font-medium ${hasBg ? 'text-white' : 'text-gray-900'}`}>{t.openHours || 'Darshan'}:</span> {timings.open} – {timings.close}
                </span>
              </div>

              {/* WhatsApp Button */}
              <div className="mt-5">
                <a
                  href="https://wa.me/9779851154432?text=Namaste!%20I%20want%20to%20know%20more%20about%20Shree%20Ramchandra%20Temple"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 ${
                    hasBg
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                      : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                  }`}
                >
                  <MessageCircle size={16} />
                  <span>{t.footerWhatsApp || 'Chat on WhatsApp'}</span>
                </a>
              </div>
            </div>

            {/* Navigation Buttons - MODERN CLEAN LINK LIST */}
            {footer.showQuickLinks !== false && navButtons && navButtons.length > 0 && (
              <div>
                <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-5 ${hasBg ? 'text-white' : 'text-gray-900'}`}>
                  {t.navigation || 'Quick Navigation'}
                </h5>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  {navButtons.map((btn, index) => (
                    <Link
                      key={index}
                      to={btn.path}
                      className={`inline-flex items-center group text-sm font-medium transition-all duration-200 ${
                        hasBg ? 'text-white/70 hover:text-white' : 'text-gray-700 hover:text-[#7A0000]'
                      }`}
                    >
                      <span className={`w-1 h-1 rounded-full mr-1.5 transition-colors ${hasBg ? 'bg-white/30 group-hover:bg-white' : 'bg-gray-400 group-hover:bg-[#7A0000]'}`} />
                      {getLocalizedText(btn.label)}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Info - Clickable */}
            {footer.showContact !== false && (
              <div>
                <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-5 ${hasBg ? 'text-white' : 'text-gray-900'}`}>
                  {t.contactInfo || 'Get in Touch'}
                </h5>
                <ul className="space-y-3">
                  <li className="group cursor-pointer" onClick={() => handleAddressClick(getLocalizedText(footer.contactInfo?.address) || 'Battisputali, Gaushala, Kathmandu, Nepal')}>
                    <span className={`text-sm leading-relaxed transition-colors duration-300 ${hasBg ? 'text-white/60 hover:text-white' : 'text-gray-700 hover:text-[#7A0000]'}`}>
                      {getLocalizedText(footer.contactInfo?.address) || 'Battisputali, Gaushala, Kathmandu, Nepal'}
                    </span>
                  </li>
                  <li className="group cursor-pointer" onClick={() => handlePhoneClick(footer.contactInfo?.phone || '+977-1-4XXXXXX')}>
                    <span className={`text-sm transition-colors duration-300 ${hasBg ? 'text-white/60 hover:text-white' : 'text-gray-700 hover:text-[#7A0000]'}`}>
                      {footer.contactInfo?.phone || '+977-1-4XXXXXX'}
                    </span>
                  </li>
                  <li className="group cursor-pointer" onClick={() => handleEmailClick(footer.contactInfo?.email || 'info@ramchandratemple.org.np')}>
                    <span className={`text-sm transition-colors duration-300 ${hasBg ? 'text-white/60 hover:text-white' : 'text-gray-700 hover:text-[#7A0000]'}`}>
                      {footer.contactInfo?.email || 'info@ramchandratemple.org.np'}
                    </span>
                  </li>
                </ul>
              </div>
            )}

            {/* Subscribe & Map Section - No Icons */}
            <div className="space-y-6">
              {/* Subscribe Section - Modern */}
              {footer.showSubscribe !== false && (
                <div>
                  <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-5 ${hasBg ? 'text-white' : 'text-gray-900'}`}>
                    {t.subscribe || 'Stay Updated'}
                  </h5>
                  {isSubscribed ? (
                    <div className={`text-sm ${hasBg ? 'text-green-400' : 'text-green-600'} flex items-center gap-2 p-3 rounded-xl ${hasBg ? 'bg-white/5' : 'bg-green-50'}`}>
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
                          className={`w-full px-4 py-3 pr-12 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all duration-300 ${
                            hasBg
                              ? 'bg-white/10 text-white placeholder-white/50 border border-white/20 focus:border-white/40 focus:ring-white/20'
                              : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#7A0000] focus:ring-[#7A0000]/10 focus:bg-white'
                          }`}
                          required
                        />
                        <button
                          type="submit"
                          disabled={subscribing}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-300 ${
                            hasBg ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-[#7A0000] text-white hover:bg-[#5B1420]'
                          } disabled:opacity-50`}
                        >
                          {subscribing ? (
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin block" />
                          ) : (
                            <Send size={16} />
                          )}
                        </button>
                      </div>
                      <p className={`text-xs ${hasBg ? 'text-white/40' : 'text-gray-700'}`}>
                        {t.subscribeInfo || 'Get important updates about events and temple news.'}
                      </p>
                    </form>
                  )}
                </div>
              )}

              {/* Map Section - with error handling */}
              {footer.showMap !== false && (
                <div>
                  <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 ${hasBg ? 'text-white' : 'text-gray-900'}`}>
                    {t.location || 'Find Us'}
                  </h5>
                  <div className={`rounded-xl overflow-hidden border ${hasBg ? 'border-white/10' : 'border-gray-200'} shadow-lg`}>
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

        {/* Bottom Bar - Always red-brown with light text */}
        <div className="border-t border-white/10" style={{ background: 'linear-gradient(90deg, #7A0000, #5B1420)' }}>
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

              {/* Copyright */}
              <p className="text-xs text-white/70 leading-relaxed text-center md:text-left order-2 md:order-1">
                <span className="text-white/90 font-medium">© {currentYear} {logoText}.</span>{' '}
                {lang === 'ne' ? 'सर्वाधिकार सुरक्षित।' : 'All rights reserved.'}
              </p>

              {/* Operated by */}
              <a
                href="https://www.zeroinfinitytechnologies.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="order-1 md:order-2 inline-flex items-center gap-1.5 self-center px-4 py-2 rounded-full bg-white/10 border border-white/15 text-[11px] font-medium tracking-wide text-white/80 hover:bg-white/20 hover:text-white hover:border-white/30 transition-all duration-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                {lang === 'ne' ? 'ZeroInfinity द्वारा संचालित' : 'Operated by ZeroInfinity'}
              </a>

              {/* Legal Links */}
              <div className="order-3 flex items-center justify-center gap-2">
                <Link
                  to="/privacy"
                  className="px-3.5 py-1.5 rounded-full text-[11px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  {lang === 'ne' ? 'गोपनीयता नीति' : 'Privacy Policy'}
                </Link>
                <Link
                  to="/terms"
                  className="px-3.5 py-1.5 rounded-full text-[11px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  {lang === 'ne' ? 'सेवा सर्तहरू' : 'Terms of Service'}
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