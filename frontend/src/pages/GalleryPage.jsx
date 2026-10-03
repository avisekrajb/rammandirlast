import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { X, Download, Image as ImageIcon, Youtube } from 'lucide-react';
import api from '../services/api';
import { handleImageError } from '../utils/imageFallback';
import OmLoader from '../components/common/OmLoader';
import FacebookVideoSection from '../components/common/FacebookVideoSection';
import PageHeader from '../components/common/PageHeader';
import { optimizeImageCached } from '../utils/imageOptimize';


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
            src={optimizeImageCached(item.photo, { width: 1600, quality: 'high' })}
            alt={caption}
            decoding="async"
            className="max-w-full max-h-[82vh] object-contain rounded-lg"
              onError={(e) => { handleImageError(e, '/1.jpg'); }}
            />
          )}
        <div className="mt-3 text-center">
          {(() => {
            const title = getLocalizedText(item.title, lang) || caption;
            const desc = getLocalizedText(item.description, lang);
            return (
              <>
                {title && <p className="text-white/80 text-sm font-serif font-medium">{title}</p>}
                {desc && <p className="text-white/50 text-xs mt-1 max-w-md mx-auto">{desc}</p>}
              </>
            );
          })()}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') === 'videos' ? 'videos' : 'photos');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lbState, setLbState] = useState(null);
  const [settings, setSettings] = useState(null);
  const fetched = useRef(false);

  // Keep the tab in sync with the ?tab= query param (used by "View More Reels")
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'videos' || tab === 'photos') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'videos' ? { tab: 'videos' } : {}, { replace: true });
  };

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
      <div className="min-h-[60vh] flex items-center justify-center" style={{ background: '#ffffff' }}>
        <div className="text-center">
          <OmLoader size="lg" color="vermilion" className="mx-auto mb-4" />
          <p className="text-ink-soft text-sm">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
      {/* Header */}
      <div className="pt-28 pb-6 px-4">
        <PageHeader>{t.galleryTitle || 'Photo Gallery'}</PageHeader>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-center gap-2 py-4">
          <button
            onClick={() => handleTabChange('photos')}
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
            onClick={() => handleTabChange('videos')}
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
                        src={optimizeImageCached(item.photo, { width: 640 })}
                        alt={caption}
                        loading="lazy"
                        decoding="async"
                        width={640}
                        height={640}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                        onError={(e) => { handleImageError(e, '/1.jpg'); }}
                      />
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Hover Text - Bottom Center */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                    <div className="text-center">
                      <p className="text-white/90 text-xs sm:text-sm font-medium tracking-wider font-serif">
                        {getLocalizedText(item.title, lang) || caption || 'श्री राम मंदिर'}
                      </p>
                      {(() => {
                        const desc = getLocalizedText(item.description, lang);
                        return desc ? (
                          <p className="text-white/60 text-[10px] sm:text-xs mt-0.5 line-clamp-2">
                            {desc}
                          </p>
                        ) : (
                          <p className="text-white/60 text-[10px] sm:text-xs mt-0.5 truncate">
                            {caption}
                          </p>
                        );
                      })()}
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

      {/* Facebook Videos + Reels - Videos tab only */}
      {activeTab === 'videos' && (
        <FacebookVideoSection settings={settings} t={t} showViewMoreReels={false} containerClass="max-w-7xl mx-auto px-4 sm:px-6 pb-16" />
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