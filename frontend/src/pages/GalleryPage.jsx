import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { X, Download, Image as ImageIcon, Youtube } from 'lucide-react';
import api from '../services/api';
import OmLoader from '../components/common/OmLoader';

// Fallback images for when API fails
const fallbackImages = [
  { _id: '1', photo: '/1.jpg', cap: { en: 'Temple View' }, type: 'photo', category: 'temple' },
  { _id: '2', photo: '/2.jpg', cap: { en: 'Temple Interior' }, type: 'photo', category: 'temple' },
  { _id: '3', photo: '/3.jpg', cap: { en: 'Temple Deity' }, type: 'photo', category: 'deity' },
  { _id: '4', photo: '/4.jpg', cap: { en: 'Festival Celebration' }, type: 'photo', category: 'festival' },
  { _id: '5', photo: '/6.jpg', cap: { en: 'Devotional Gathering' }, type: 'photo', category: 'devotion' },
  { _id: '6', photo: '/5.jpg', cap: { en: 'Temple Ceremony' }, type: 'photo', category: 'ceremony' },
  { _id: '7', photo: '/2.jpg', cap: { en: 'Sacred Rituals' }, type: 'photo', category: 'ritual' },
  { _id: '8', photo: '/1.jpg', cap: { en: 'Temple Architecture' }, type: 'photo', category: 'architecture' },
  { _id: '9', photo: '/3.jpg', cap: { en: 'Evening Aarti' }, type: 'photo', category: 'aarti' },
  { _id: '10', photo: '/4.jpg', cap: { en: 'Temple Courtyard' }, type: 'photo', category: 'courtyard' },
];

// Helper to get text in current language
const getLocalizedText = (obj, lang) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || '';
};

// ─── Facebook Embedded Videos (same set used on the Home page) ─────────────
// Admin-editable via settings?.facebookVideos (array of { url, enabled }) if
// wired up later; falls back to this hardcoded list otherwise.
const DEFAULT_FACEBOOK_VIDEOS = [
  'https://www.facebook.com/shreeramchandramandir/videos/2472164706588918/',
  'https://www.facebook.com/shreeramchandramandir/videos/1075819584931828/',
  'https://www.facebook.com/shreeramchandramandir/videos/2273607406769837/',
  'https://www.facebook.com/shreeramchandramandir/videos/1614691790082453/',
  'https://www.facebook.com/shreeramchandramandir/videos/2106938773498642/',
  'https://www.facebook.com/shreeramchandramandir/videos/1041350001985138/',
];

const FACEBOOK_VIDEOS_PAGE_SIZE = 6;

function FacebookVideoCard({ url }) {
  const embedSrc = `https://www.facebook.com/plugins/video.php?height=314&href=${encodeURIComponent(
    url
  )}&show_text=false&width=560&t=0`;

  return (
    <div className="rounded-xl overflow-hidden shadow-lg border border-line bg-black">
      <div className="relative w-full" style={{ paddingBottom: '56.13%' /* 314/560 aspect ratio */ }}>
        <iframe
          src={embedSrc}
          className="absolute inset-0 w-full h-full"
          style={{ border: 'none', overflow: 'hidden' }}
          scrolling="no"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          title="Facebook Video"
        />
      </div>
    </div>
  );
}

function FacebookVideosSection({ settings, t }) {
  const [showAll, setShowAll] = useState(false);

  const fbEnabled = settings?.facebookVideo?.enabled !== false;
  if (!fbEnabled) return null;

  const configuredVideos = settings?.facebookVideos
    ?.filter(v => v.enabled !== false)
    ?.map(v => v.url)
    ?.filter(Boolean);

  const videos = configuredVideos && configuredVideos.length > 0
    ? configuredVideos
    : DEFAULT_FACEBOOK_VIDEOS;

  if (videos.length === 0) return null;

  const visibleVideos = showAll ? videos : videos.slice(0, FACEBOOK_VIDEOS_PAGE_SIZE);
  const hasMore = videos.length > FACEBOOK_VIDEOS_PAGE_SIZE;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <div className="text-center mb-8">
        <h2 className="font-serif text-2xl sm:text-3xl" style={{ color: "#7A0000" }}>
          {t.facebookVideoTitle || 'Watch on Facebook'}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleVideos.map((url, idx) => (
          <FacebookVideoCard key={`${url}-${idx}`} url={url} />
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-10">
          <button
            onClick={() => setShowAll(prev => !prev)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white hover:-translate-y-0.5 transition-all shadow-lg shadow-vermilion/30"
            style={{ backgroundColor: "#7A0000" }}
          >
            {showAll ? (t.viewLess || 'View Less') : (t.viewMore || 'View More')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Watermark Utility Functions ──────────────────────────────────────────
const WATERMARK_TEXT = 'श्री राम मंदिर';

// Function to add centered text watermark to image
const addWatermarkToImage = (imageSrc) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // ─── Centered Text Watermark ──────────────────────────────────────
        // Smaller font size - responsive
        const fontSize = Math.max(14, Math.min(24, Math.min(img.width, img.height) / 30));
        const textX = canvas.width / 2;
        const textY = canvas.height / 2;
        
        ctx.save();
        
        // Subtle shadow for readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // Text settings - centered
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        
        // Semi-transparent white text with subtle gradient
        const gradient = ctx.createRadialGradient(
          textX - fontSize * 1.5, 
          textY - fontSize * 0.5, 
          fontSize * 0.5,
          textX, 
          textY, 
          fontSize * 4
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.15)');
        
        ctx.fillStyle = gradient;
        ctx.fillText(WATERMARK_TEXT, textX, textY);
        
        // Very subtle outline
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.05)';
        ctx.lineWidth = 0.5;
        ctx.strokeText(WATERMARK_TEXT, textX, textY);
        
        ctx.restore();
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create image blob'));
          }
        }, 'image/jpeg', 0.95);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageSrc;
  });
};

// Function to add centered text watermark to video
const addWatermarkToVideo = (videoSrc) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.onloadedmetadata = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Create a media stream from canvas
        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 5000000
        });
        
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };
        
        // Start recording
        mediaRecorder.start();
        
        // Play video and draw frames with watermark
        video.play();
        const drawFrame = () => {
          if (video.paused || video.ended) {
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
            return;
          }
          
          // Draw video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // ─── Centered Text Watermark ──────────────────────────────────
          const fontSize = Math.max(14, Math.min(24, Math.min(canvas.width, canvas.height) / 30));
          const textX = canvas.width / 2;
          const textY = canvas.height / 2;
          
          ctx.save();
          
          // Subtle shadow for readability
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
          
          // Text settings - centered
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
          
          // Semi-transparent white text with subtle gradient
          const gradient = ctx.createRadialGradient(
            textX - fontSize * 1.5, 
            textY - fontSize * 0.5, 
            fontSize * 0.5,
            textX, 
            textY, 
            fontSize * 4
          );
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
          gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
          gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0.15)');
          
          ctx.fillStyle = gradient;
          ctx.fillText(WATERMARK_TEXT, textX, textY);
          
          // Very subtle outline
          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.05)';
          ctx.lineWidth = 0.5;
          ctx.strokeText(WATERMARK_TEXT, textX, textY);
          
          ctx.restore();
          
          requestAnimationFrame(drawFrame);
        };
        
        video.addEventListener('ended', () => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        });
        
        drawFrame();
      } catch (error) {
        reject(error);
      }
    };
    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = videoSrc;
  });
};

// ─── Lightbox Modal ──────────────────────────────────────────────────────────
function LightboxModal({ items, index, t, lang, onClose, onPrev, onNext }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const item = items[index];
  if (!item) return null;

  const isVideo = item.type === 'video';
  const caption = getLocalizedText(item.cap, lang);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (isVideo) {
        // Download video with watermark
        const videoBlob = await addWatermarkToVideo(item.photo);
        const url = URL.createObjectURL(videoBlob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = `${caption.replace(/\s+/g, '-').toLowerCase() || 'video'}-watermarked.webm`;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Download image with watermark
        const imageBlob = await addWatermarkToImage(item.photo);
        const url = URL.createObjectURL(imageBlob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = `${caption.replace(/\s+/g, '-').toLowerCase() || 'image'}-watermarked.jpg`;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download with watermark failed:', error);
      // Fallback: open in new tab
      window.open(item.photo, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(8px)' }}
    >
      <div className="absolute top-4 right-4 flex gap-3 z-10" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={`flex items-center text-white/60 hover:text-white text-xs px-3 py-2 border border-white/15 hover:border-white/40 transition-all rounded-lg ${
            isDownloading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Download className="w-4 h-4 mr-1" />
          {isDownloading ? 'Processing...' : 'Download'}
        </button>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-9 h-9 border border-white/15 hover:border-white/40 text-white/60 hover:text-white transition-all rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>

      <motion.div
        key={index}
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-[92vw] max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            src={item.photo}
            className="max-w-full max-h-[82vh] object-contain rounded-lg"
            controls
            autoPlay
          />
        ) : (
          <img
            src={item.photo}
            alt={caption}
            className="max-w-full max-h-[82vh] object-contain rounded-lg"
            onError={(e) => { e.target.src = '/1.jpg'; }}
          />
        )}
        <div className="mt-3 text-center">
          {caption && <p className="text-white/80 text-sm">{caption}</p>}
          <p className="text-white/35 text-xs mt-1">{index + 1} / {items.length}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Gallery Page ──────────────────────────────────────────────────────
const GalleryPage = () => {
  const { t, lang } = useLanguage();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('photos');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lbState, setLbState] = useState(null);
  const [settings, setSettings] = useState(null);
  const fetched = useRef(false);

  // Fetch gallery items from API
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const fetchGallery = async () => {
      try {
        const response = await api.get('/admin/gallery/all');
        if (response.data && response.data.data && response.data.data.length > 0) {
          setItems(response.data.data);
        } else {
          setItems(fallbackImages);
        }
      } catch (error) {
        console.error('Fetch gallery error:', error);
        setItems(fallbackImages);
        showToast('Using sample images', 'warning');
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, [showToast]);

  // Fetch admin settings (used for the Facebook videos section)
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

  // Filter items based on active tab
  const filteredItems = useMemo(() => {
    if (activeTab === 'photos') {
      return items.filter(item => item.type === 'photo' || !item.type);
    }
    return items.filter(item => item.type === 'video');
  }, [items, activeTab]);

  const openLb = useCallback((idx, source) => {
    setLbState({ items: source || filteredItems, index: idx });
    document.body.style.overflow = 'hidden';
  }, [filteredItems]);

  const closeLb = useCallback(() => {
    setLbState(null);
    document.body.style.overflow = '';
  }, []);

  const lbPrev = useCallback(() => {
    setLbState((s) => s ? { ...s, index: (s.index - 1 + s.items.length) % s.items.length } : null);
  }, []);

  const lbNext = useCallback(() => {
    setLbState((s) => s ? { ...s, index: (s.index + 1) % s.items.length } : null);
  }, []);

  useEffect(() => {
    if (!lbState) return;
    const handler = (e) => {
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') lbPrev();
      if (e.key === 'ArrowRight') lbNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lbState, closeLb, lbPrev, lbNext]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" style={{ background: '#faf8f5' }}>
        <div className="text-center">
          <OmLoader size="lg" color="vermilion" className="mx-auto mb-4" />
          <p className="text-ink-soft text-sm">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#faf8f5' }}>
      {/* Header */}
      <div className="pt-28 pb-6 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-light leading-tight font-serif"
            style={{ color: "#7A0000" }}
          >
            {t.galleryTitle || 'Photo Gallery'}
          </h1>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-center gap-2 py-4">
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'photos'
                ? 'bg-vermilion text-white shadow-lg shadow-vermilion/20'
                : 'text-ink-soft hover:text-ink hover:bg-gray-100/50'
            }`}
          >
            <ImageIcon size={16} />
            {t.galleryPhotos || 'Photos'}
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'videos'
                ? 'bg-vermilion text-white shadow-lg shadow-vermilion/20'
                : 'text-ink-soft hover:text-ink hover:bg-gray-100/50'
            }`}
          >
            <Youtube size={16} />
            {t.galleryVideos || 'Videos'}
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredItems.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
            {filteredItems.map((item, index) => {
              const isVideo = item.type === 'video';
              const caption = getLocalizedText(item.cap, lang);
              
              return (
                <motion.div
                  key={item._id || index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (index % 10) * 0.03, duration: 0.4 }}
                  className="relative overflow-hidden rounded-lg group cursor-zoom-in aspect-square w-full"
                  style={{ background: '#1a1a1a' }}
                  onClick={() => openLb(index)}
                >
                  {isVideo ? (
                    <video
                      src={item.photo}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                      muted
                    />
                  ) : (
                    <img
                      src={item.photo}
                      alt={caption}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                      onError={(e) => { e.target.src = '/1.jpg'; }}
                    />
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Hover Text - Bottom Center */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                    <div className="text-center">
                      <p className="text-white/90 text-xs sm:text-sm font-medium tracking-wider font-serif">
                        श्री राम मंदिर
                      </p>
                      {caption && (
                        <p className="text-white/60 text-[10px] sm:text-xs mt-0.5 truncate">
                          {caption}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Video Badge */}
                  {isVideo && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 z-10">
                      <Youtube size={10} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredItems.length === 0 && (
        <div className="py-20 text-center">
          <ImageIcon size={64} className="mx-auto text-ink-soft/20 mb-4" />
          <p className="text-ink-soft">No {activeTab} available</p>
        </div>
      )}

      {/* Facebook Embedded Videos - Videos tab only */}
      {activeTab === 'videos' && (
        <FacebookVideosSection settings={settings} t={t} />
      )}

      <AnimatePresence>
        {lbState && (
          <LightboxModal
            items={lbState.items}
            index={lbState.index}
            t={t}
            lang={lang}
            onClose={closeLb}
            onPrev={lbPrev}
            onNext={lbNext}
          />
        )}
      </AnimatePresence>

      {/* Hide scrollbar */}
      <style>{`
        html {
          overflow-y: scroll;
          scrollbar-width: none;
        }
        html::-webkit-scrollbar {
          width: 0;
          display: none;
        }
        body {
          -ms-overflow-style: none;
        }
      `}</style>
    </div>
  );
};

export default GalleryPage;