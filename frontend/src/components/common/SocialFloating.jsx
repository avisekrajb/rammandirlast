import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Facebook, Youtube, Instagram, Twitter, MessageCircle, Linkedin, Mail, Phone, Globe, Share2 } from 'lucide-react';
import api from '../../services/api';

// Icon mapping for all platforms - same as admin
const iconMap = {
  Facebook: Facebook,
  Youtube: Youtube,
  Instagram: Instagram,
  Twitter: Twitter,
  Linkedin: Linkedin,
  MessageCircle: MessageCircle,
  Mail: Mail,
  Phone: Phone,
  Globe: Globe,
  Share2: Share2,
  WhatsApp: MessageCircle,
  Email: Mail,
};

// Platform colors - same as admin
const platformColors = {
  Facebook: '#1877F2',
  Instagram: '#E4405F',
  Twitter: '#000000',
  Youtube: '#FF0000',
  Linkedin: '#0A66C2',
  MessageCircle: '#25D366',
  WhatsApp: '#25D366',
  Mail: '#EA4335',
  Email: '#EA4335',
  Phone: '#34B7F1',
  Globe: '#6B6B72',
  Share2: '#6B6B72',
};

// Default social links if no data from API
const DEFAULT_LINKS = [
  { id: '1', platform: 'facebook', icon: 'Facebook', label: 'Facebook', url: 'https://www.facebook.com', enabled: true, color: '#1877F2' },
  { id: '2', platform: 'instagram', icon: 'Instagram', label: 'Instagram', url: 'https://www.instagram.com', enabled: true, color: '#E4405F' },
  { id: '3', platform: 'youtube', icon: 'Youtube', label: 'YouTube', url: 'https://www.youtube.com', enabled: true, color: '#FF0000' },
  { id: '4', platform: 'twitter', icon: 'Twitter', label: 'Twitter', url: 'https://twitter.com', enabled: true, color: '#000000' },
];

const SocialFloating = () => {
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isFooterVisible, setIsFooterVisible] = useState(true);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch social links from API
  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        console.log('SocialFloating: Fetching social links...');
        let response = await api.get('/admin/social');
        console.log('SocialFloating: Response from /admin/social:', response.data);
        
        let links = [];
        if (response.data && response.data.success && response.data.data) {
          links = response.data.data;
          console.log('SocialFloating: Found social links:', links);
        } else {
          console.log('SocialFloating: Trying to get from /admin/settings...');
          const settingsResponse = await api.get('/admin/settings');
          console.log('SocialFloating: Settings response:', settingsResponse.data);
          
          if (settingsResponse.data && settingsResponse.data.socialLinks) {
            links = settingsResponse.data.socialLinks;
            console.log('SocialFloating: Found social links in settings:', links);
          } else {
            console.log('SocialFloating: No social links found, using defaults');
            links = DEFAULT_LINKS;
          }
        }
        
        const enabledLinks = links.filter(link => {
          const isEnabled = link.enabled !== false;
          const hasUrl = link.url && link.url.trim() !== '';
          return isEnabled && hasUrl;
        });
        
        const linksWithColors = enabledLinks.map(link => ({
          ...link,
          color: link.color || platformColors[link.icon] || '#6B6B72'
        }));
        
        console.log('SocialFloating: Enabled links with colors:', linksWithColors);
        setSocialLinks(linksWithColors);
      } catch (error) {
        console.error('SocialFloating: Error fetching social links:', error);
        setSocialLinks(DEFAULT_LINKS);
      } finally {
        setLoading(false);
      }
    };
    fetchSocialLinks();
  }, []);

  // Handle scroll events for visibility and footer detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Check if footer is visible (bottom of page)
      const bottomThreshold = 150;
      const isFooterVisible = scrollY + windowHeight < documentHeight - bottomThreshold;
      setIsFooterVisible(isFooterVisible);
      
      // Hide on scroll down, show on scroll up
      if (scrollY > lastScrollY && scrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Don't show if loading, no links, or footer is NOT visible (at bottom)
  if (loading || socialLinks.length === 0 || !isFooterVisible || !isVisible) {
    return null;
  }

  // Get icon component
  const getIcon = (iconName) => {
    return iconMap[iconName] || MessageCircle;
  };

  // Get platform color (with fallback)
  const getColor = (link) => {
    return link.color || platformColors[link.icon] || '#6B6B72';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
        className={`fixed z-40 flex flex-col gap-2 ${
          isMobile 
            ? 'bottom-[100px] right-3 top-auto transform-none' 
            : 'right-4 top-1/2 -translate-y-1/2'
        }`}
        style={{
          bottom: isMobile ? '100px' : 'auto',
          right: isMobile ? '12px' : '16px',
        }}
      >
        {/* Social Links */}
        {socialLinks.map((link, index) => {
          const Icon = getIcon(link.icon);
          const color = getColor(link);
          let url = link.url;
          if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
          }
          
          return (
            <motion.a
              key={link.id || `social-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              whileHover={{ 
                scale: 1.1,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.9 }}
              className={`relative flex items-center justify-center rounded-full bg-white/95 backdrop-blur-sm shadow-lg border transition-all duration-300 group ${
                isMobile ? 'w-11 h-11' : 'w-10 h-10 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12'
              }`}
              style={{
                color: color,
                borderColor: `${color}30`,
              }}
              title={link.label || link.platform}
            >
              <Icon 
                size={isMobile ? 20 : 18} 
                className="relative z-10" 
              />
              
              {/* Tooltip - hidden on mobile */}
              {!isMobile && (
                <span className="hidden sm:block absolute right-full mr-3 px-3 py-1.5 bg-black/80 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  {link.label || link.platform}
                </span>
              )}
              
              {/* Hover background */}
              <div 
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ backgroundColor: `${color}20` }}
              />
            </motion.a>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
};

export default SocialFloating;