import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFullscreen } from '../context/FullscreenContext';
import { ArrowRight, X, Download, Play, Pause, QuoteIcon, Clock, MapPin, Gift, Star, Share2, ThumbsUp, Loader2, Heart, Users, ChevronRight, User, Mail, Phone, Award, Calendar, Eye, Maximize, Minimize } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import api from '../services/api';
import OmLoader from '../components/common/OmLoader';
import TempleIcon from '../components/common/TempleIcon';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// ─── Fullscreen Toggle Button (Desktop only) ──────────────────────────────
function FullscreenToggle({ videoRef }) {
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isDesktop) return null;

  const handleToggle = (e) => {
    e.stopPropagation();
    // Toggle fullscreen on the entire document
    toggleFullscreen(document.documentElement);
  };

  return (
    <motion.button
      onClick={handleToggle}
      className="absolute bottom-24 left-20 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 hover:scale-110 transition-all duration-300 border border-white/30 shadow-lg pointer-events-auto"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      {isFullscreen ? (
        <Minimize className="w-4 h-4" />
      ) : (
        <Maximize className="w-4 h-4" />
      )}
    </motion.button>
  );
}

// ─── Fullscreen Image Modal ──────────────────────────────────────────────────
function ImageModal({ src, alt, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleDownload = async () => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = src.split(".").pop()?.split("?")[0] || "jpg";
      a.download = `${alt.replace(/\s+/g, "-").toLowerCase() || "image"}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, "_blank");
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="absolute top-5 right-5 flex gap-3 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs uppercase tracking-widest px-3 py-2 border border-white/25 hover:border-white/60 transition-all rounded"
          title="Download"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Download</span>
        </button>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-9 h-9 border border-white/25 hover:border-white/60 text-white/80 hover:text-white transition-all rounded"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <motion.div
        className="relative max-w-[92vw] max-h-[90vh] flex items-center justify-center"
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[90vh] object-contain shadow-2xl"
          style={{ borderRadius: 2 }}
        />
      </motion.div>
    </motion.div>
  );
}

// Hook to manage modal state
function useImageModal() {
  const [modal, setModal] = useState(null);
  const open = useCallback((src, alt) => setModal({ src, alt }), []);
  const close = useCallback(() => setModal(null), []);
  return { modal, open, close };
}

// ─── Helper Functions ──────────────────────────────────────────────────────────
const getLocalizedText = (obj, lang) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || '';
};

// ─── Team Members Horizontal Strip ──────────────────────────────────────────
function TeamStrip({ team }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  // Filter enabled team members
  const enabledTeam = team?.filter(m => m.enabled !== false) || [];

  if (enabledTeam.length === 0) return null;

  // Triple the team for seamless infinite scroll
  const tripledTeam = [...enabledTeam, ...enabledTeam, ...enabledTeam];

  // Speed control - adjust for smooth scrolling
  const speedMultiplier = 0.25;
  const BASE_SCROLL_DURATION = enabledTeam.length * 5;
  const SCROLL_DURATION = BASE_SCROLL_DURATION / speedMultiplier;

  const handleTeamClick = (member) => {
    const nameText = getLocalizedText(member.name, lang) || 'member';
    const nameSlug = nameText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    navigate(`/templeteams/${nameSlug}/${member._id}`);
  };

  return (
    <div
      className="absolute bottom-16 left-0 right-0 z-20 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden">
          {/* Gradient fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none" />

          <div
            className="flex gap-5"
            style={{
              width: 'max-content',
              animation: isHovered ? 'none' : `team-scroll-left ${SCROLL_DURATION}s linear infinite`,
            }}
          >
            {tripledTeam.map((member, idx) => {
              const nameText = getLocalizedText(member.name, lang) || 'Team Member';
              const roleText = getLocalizedText(member.role, lang) || '';

              return (
                <motion.button
                  key={`${member._id}-${idx}`}
                  onClick={() => handleTeamClick(member)}
                  className="flex-shrink-0 flex items-center gap-3 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm border border-white/5 hover:bg-black/30 hover:border-white/15 transition-all duration-300 group cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Photo - Circular with subtle glow */}
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 group-hover:border-white/40 transition-all duration-300">
                      {member.photo ? (
                        <img
                          src={member.photo}
                          alt={nameText}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.target.src = '/default-avatar.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-vermilion/80 to-maroon/80">
                          {nameText.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Subtle glow ring */}
                    <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-vermilion/20 to-marigold/20 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-white/90 text-sm font-medium truncate max-w-[100px] group-hover:text-white transition-colors duration-300">
                      {nameText}
                    </span>
                    {roleText && (
                      <span className="text-white/40 text-[10px] truncate max-w-[100px] group-hover:text-white/60 transition-colors duration-300">
                        {roleText}
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes team-scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-${(enabledTeam.length / 3) * 100}%);
          }
        }
      `}</style>
    </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function Hero({ settings, team }) {
  const { t, lang } = useLanguage();
  const ref = useRef(null);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoError, setVideoError] = useState(false);

  const heroVideo = settings?.heroVideo;
  const heroEnabled = settings?.heroEnabled !== false;
  const heroPoster = settings?.heroPoster || 'linear-gradient(160deg,#7A1F2B 0%,#5B1420 45%,#2B1810 100%)';
  const timings = settings?.timings || { open: '05:00 AM', close: '08:00 PM' };

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const smooth = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });
  const videoScale = useTransform(smooth, [0, 1], [1, 1.1]);
  const overlayOp = useTransform(smooth, [0, 0.7], [0.35, 0.8]);
  const textY = useTransform(smooth, [0, 1], ["0%", "-30%"]);
  const textOpacity = useTransform(smooth, [0, 0.5], [1, 0]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Show hero only if enabled
  if (!heroEnabled) {
    return (
      <section
        ref={ref}
        className="relative w-full overflow-hidden"
        style={{ height: "100svh", minHeight: 560, background: heroPoster }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6">
          <motion.h1
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
            className="font-serif text-5xl sm:text-6xl lg:text-8xl text-white font-light leading-tight drop-shadow-2xl mb-6"
          >
            {t.templeName || 'Shree Ramchandra Temple'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5 }}
            className="text-white/70 text-base sm:text-lg max-w-xl leading-relaxed mb-10"
          >
            {t.heroTagline || 'Where devotion meets the sacred banks of Bagmati'}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.65 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Link to="/booking" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm shadow-lg shadow-vermilion/30 hover:bg-[#a83a0c] hover:-translate-y-0.5 transition-all" style={{ backgroundColor: "#7A0000", color: "white" }}>
              {t.heroCta2 || 'Book Puja'} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/donate" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white border border-white/50 hover:bg-white/10 transition-all">
              {t.navDonate || 'Donate'}
            </Link>
          </motion.div>
        </div>
        {/* Team Strip */}
        <TeamStrip team={team} />
      </section>
    );
  }

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{ height: "100svh", minHeight: 560 }}
    >
      <motion.div
        style={{ scale: videoScale }}
        className="absolute inset-0 w-full h-full origin-center"
      >
        {heroVideo && !videoError ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            src={heroVideo}
            onError={() => setVideoError(true)}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: heroPoster }}
          />
        )}
      </motion.div>

      {/* Video Controls - Positioned absolutely over the video */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="relative w-full h-full">
          {/* Pause/Play Button - Bottom left */}
          <button
            onClick={togglePlay}
            className="absolute bottom-24 left-6 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all text-white pointer-events-auto border border-white/30"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle Button - Bottom left, next to pause button */}
          <FullscreenToggle videoRef={videoRef} />
        </div>
      </div>

      <motion.div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,1)", opacity: overlayOp }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 40%, transparent 70%)",
        }}
      />

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6"
      >
        <motion.h1
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
          className="font-serif text-5xl sm:text-6xl lg:text-8xl text-white font-light leading-tight drop-shadow-2xl mb-6"
        >
          {t.templeName || 'Shree Ramchandra Temple'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="text-white/70 text-base sm:text-lg max-w-xl leading-relaxed mb-10"
        >
          {t.heroTagline || 'Where devotion meets the sacred banks of Bagmati'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.65 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/booking" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm shadow-lg shadow-vermilion/30 hover:bg-[#a83a0c] hover:-translate-y-0.5 transition-all" style={{ backgroundColor: "#7A0000", color: "white" }}>
            {t.heroCta2 || 'Book Puja'} <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/donate" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white border border-white/50 hover:bg-white/10 transition-all">
            {t.navDonate || 'Donate'}
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        style={{ opacity: textOpacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-white/35 text-xs uppercase tracking-widest" style={{ fontFamily: "serif" }}>
          scroll
        </span>
        <motion.div
          animate={{ y: [0, 9, 0] }}
          transition={{ repeat: Infinity, duration: 1.7, ease: "easeInOut" }}
          style={{
            width: 1,
            height: 36,
            background: "linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)",
          }}
        />
      </motion.div>

      {/* Team Strip - Displayed on hero video */}
      <TeamStrip team={team} />
    </section>
  );
}

// ─── Quote Strip - FULLY LOCALIZED with Daily Quote API ────────────────────
function QuoteStrip({ quote }) {
  const { t, lang } = useLanguage();
  const [dailyQuote, setDailyQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchTodayQuote = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await api.get('/admin/quotes/today');
        if (response.data.success) {
          setDailyQuote(response.data.data);
        } else {
          setError(true);
        }
      } catch (error) {
        console.error('Error fetching daily quote:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchTodayQuote();
  }, []);

  // Get localized quote
  const getLocalizedQuote = () => {
    // If loading, show loading state
    if (loading) {
      return t.dailyQuote || "Loading daily quote...";
    }

    // If we have a daily quote from API
    if (dailyQuote && dailyQuote.quote) {
      const quoteText = dailyQuote.quote[lang] || dailyQuote.quote.en || '';
      if (quoteText) return quoteText;
    }

    // Fallback to prop quote (for backward compatibility)
    if (quote) {
      if (typeof quote === 'string') return quote;
      return quote[lang] || quote.en || t.dailyQuote || "Where there is righteousness in the heart, there is beauty in the character.";
    }

    // Final fallback
    return t.dailyQuote || "Where there is righteousness in the heart, there is beauty in the character.";
  };

  const localizedQuote = getLocalizedQuote();
  const isDefault = dailyQuote?.isDefault || false;

  return (
    <div className="bg-maroon text-white flex items-start gap-3 px-4 md:px-6 py-4 md:py-5 max-w-7xl mx-auto -mt-px rounded-b-xl shadow-lg">
      <QuoteIcon size={18} className="text-marigold flex-shrink-0 mt-1" />
      <div>
        <span className="text-[10px] md:text-xs uppercase tracking-widest text-marigold font-bold">
          {t.quoteLabel || 'Thought for the Day'}
          {dailyQuote && dailyQuote.date && (
            <span className="ml-2 text-white/40 text-[8px] font-normal">
              {dailyQuote.date}
            </span>
          )}
          {isDefault && (
            <span className="ml-2 text-yellow-400/60 text-[8px] font-normal">
              (default)
            </span>
          )}
        </span>
        <p className="font-serif text-sm md:text-base text-white/90 mt-1 leading-relaxed">
          {localizedQuote}
        </p>
      </div>
    </div>
  );
}

// ─── About Preview (Homepage Only) - IMAGES NOT CLICKABLE ────────────────────
function AboutPreview({ settings }) {
  const { t, lang } = useLanguage();
  const sectionRef = useRef(null);
  const textRef = useRef(null);
  const imagesRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (textRef.current) {
        const children = textRef.current.querySelectorAll("h2, p, a");
        gsap.set(children, { opacity: 0, x: -52, clipPath: "inset(0 100% 0 0)" });
        gsap.to(children, {
          opacity: 1,
          x: 0,
          clipPath: "inset(0 0% 0 0)",
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.14,
          scrollTrigger: {
            trigger: textRef.current,
            start: "top 78%",
            once: true,
          },
        });
      }

      if (imagesRef.current) {
        const cards = imagesRef.current.querySelectorAll(".img-card");
        gsap.set(cards, { opacity: 0, x: 60, scale: 0.97 });
        gsap.to(cards, {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 1.0,
          ease: "expo.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: imagesRef.current,
            start: "top 78%",
            once: true,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // ===== USE ABOUT PREVIEW SETTINGS (Homepage only) =====
  const aboutPreview = settings?.aboutPreview || {};

  // Check if about preview is enabled
  if (aboutPreview.enabled === false) return null;

  const title = getLocalizedText(aboutPreview.title, lang) || t.aboutTitleDefault || 'About the Temple';
  const text = getLocalizedText(aboutPreview.text, lang) || t.aboutTextDefault || 'Nestled in the heart of Gaushala, Shree Ramchandra Temple has stood as a beacon of devotion for generations.';

  // Get about preview images (filter enabled)
  const aboutImages = aboutPreview.images?.filter(img => img.enabled) || [];

  // Get timings for display
  const timings = settings?.timings || { open: '05:00 AM', close: '08:00 PM' };

  // If no images, use default fallback images
  const image1 = aboutImages[0]?.src || '/aboutusherosection.jpeg';
  const image2 = aboutImages[1]?.src || '/aboutusphoto.jpeg';
  const image3 = aboutImages[2]?.src || '/rammandir.jpeg';

  return (
    <section ref={sectionRef} className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div ref={textRef}>
          <h2 className="font-serif text-3xl sm:text-4xl mb-6" style={{ color: "#520505" }}>
            {title}
          </h2>
          <p className="text-base sm:text-lg text-mute leading-relaxed mb-8 text-justify">
            {text}
          </p>
          <ul className="list-none p-0 m-0 flex flex-col gap-2 mb-6">
            <li className="flex items-center gap-2 text-sm text-ink-soft">
              <Clock size={14} className="text-vermilion" /> {t.openHours || 'Darshan Hours'}: {timings.open} – {timings.close}
            </li>
            <li className="flex items-center gap-2 text-sm text-ink-soft">
              <MapPin size={14} className="text-vermilion" /> {t.templeAddressLine || 'Gaushala, Kathmandu, Nepal'}
            </li>
          </ul>
          <Link
  to="/about"
  className="inline-flex items-center px-5 py-2 rounded-full font-medium text-sm text-white hover:opacity-90 transition-all"
  style={{ backgroundColor: "#8B2A2A" }}
>
  {t.viewMore || "View More"}
</Link>
        </div>

        <div ref={imagesRef} className="grid grid-cols-2 gap-4">
          <div className="img-card overflow-hidden rounded-lg border border-line shadow-lg">
            <img
              src={image1}
              alt="Temple"
              className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="img-card overflow-hidden rounded-lg border border-line shadow-lg">
            <img
              src={image2}
              alt="Temple Deity"
              className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="img-card col-span-2 overflow-hidden rounded-lg border border-line shadow-lg">
            <img
              src={image3}
              alt="Temple Architecture"
              className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Facebook Video Section (NEW - renders below About section) ────────────
// Supports multiple videos in a grid, showing 6 at a time with a
// View More / View Less toggle. Videos are admin-editable via
// settings?.facebookVideos (array of { url, enabled }), falling back
// to the hardcoded list below if that field isn't present.
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

function FacebookVideoTeaser({ settings }) {
  const { t } = useLanguage();
  const [showAll, setShowAll] = useState(false);

  const fbEnabled = settings?.facebookVideo?.enabled !== false;
  if (!fbEnabled) return null;

  // Build the list of video URLs, admin-editable list first, fallback to defaults.
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
    <section className="py-20" style={{ background: "linear-gradient(180deg, #ffffff 0%, #faf8f5 100%)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="font-serif text-3xl sm:text-4xl mb-10" style={{ color: "#7A0000" }}>
          {t.facebookVideoTitle || ''}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleVideos.map((url, idx) => (
            <FacebookVideoCard key={`${url}-${idx}`} url={url} />
          ))}
        </div>

        {hasMore && (
          <div className="mt-10 flex justify-center">
            <div
              className="inline-flex items-center rounded-full p-1"
              style={{ backgroundColor: "rgba(122, 31, 43, 0.08)", border: "1px solid rgba(122, 31, 43, 0.15)" }}
            >
              <button
  onClick={() => setShowAll(prev => !prev)}
  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm text-white hover:-translate-y-0.5 transition-all shadow-lg shadow-vermilion/30"
  style={{ backgroundColor: "#8B2A2A" }}
>
  {showAll ? (t.viewLess || "View Less") : (t.viewMore || "View More")}
</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Event Detail Modal ──────────────────────────────────────────────────────
function EventDetailModal({ event, onClose, lang, t, user, onInterested, isInterested, interestedCount }) {
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
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/30 backdrop-blur-sm transition-all"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Image - NOT CLICKABLE */}
        <div className="relative h-64 sm:h-80 overflow-hidden rounded-t-2xl">
          <img
            src={event.photo || '/default-event.jpg'}
            alt={titleText}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = '/default-event.jpg'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-4 left-6">
            <span className="text-white/90 text-sm font-medium">
              {dateText || gregText || ''}
            </span>
          </div>
          {/* Upcoming badge */}
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
              {isInterested ? 'Interested' : 'Mark Interested'}
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
              Share
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
}

// ─── Events Teaser ────────────────────────────────────────────────────────────
function EventsTeaser({ onOpen }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interestedEvents, setInterestedEvents] = useState({});
  const [interestedCounts, setInterestedCounts] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);

  const formatEventDate = (dateString) => {
    if (!dateString) return 'Coming Soon';
    const date = new Date(dateString);
    const options = { month: 'long', day: 'numeric' };
    const year = date.getFullYear();
    if (year >= 2026) {
      options.year = 'numeric';
    }
    return date.toLocaleDateString('en-US', options);
  };

  // Fetch events and interested status
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/events/upcoming');
        const eventsData = response.data.slice(0, 4);
        setEvents(eventsData);

        // Initialize interested counts
        const counts = {};
        eventsData.forEach(e => {
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
        setEvents([]);
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

  const handleShare = async (event, e) => {
    if (e) e.stopPropagation();

    const titleText = getLocalizedText(event.title, lang);
    const dateText = getLocalizedText(event.dateNepali, lang);
    const gregText = getLocalizedText(event.greg, lang);

    const shareData = {
      title: titleText || 'Event',
      text: `${titleText} - ${dateText || gregText || ''}`,
      url: `${window.location.origin}/events/${event._id}`,
    };

    try {
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
      <section className="py-24" style={{ background: "linear-gradient(180deg, #faf8f5 0%, #ffffff 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <OmLoader size="md" color="vermilion" className="mx-auto" />
        </div>
      </section>
    );
  }

  if (events.length === 0) return null;

  return (
    <>
      <section className="py-24" style={{ background: "linear-gradient(180deg, #faf8f5 0%, #ffffff 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl" style={{ color: "#7A0000" }}>
              {t.upcomingEvents || 'Upcoming Events'}
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {events.map((e, i) => {
              const titleText = getLocalizedText(e.title, lang);
              const descText = getLocalizedText(e.desc, lang);
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
                  <div className="relative h-48 sm:h-56 overflow-hidden">
                    <img
                      src={e.photo || '/4.jpg'}
                      alt={titleText}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      onError={(e) => { e.target.src = '/4.jpg'; }}
                    />
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 40%)" }}
                    />
                    <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm text-white px-3 py-1.5 text-xs font-display rounded-md pointer-events-none shadow-md border border-white/10">
                      {e.date ? formatEventDate(e.date) : 'Coming Soon'}
                    </div>

                    {/* Interested count badge */}
                    {count > 0 && (
                      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none">
                        <Heart size={12} className="fill-red-400 text-red-400" />
                        {count}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-ink font-serif text-lg mb-2 group-hover:text-red-900 transition-colors line-clamp-2">
                      {titleText}
                    </h3>
                    <p className="text-sm text-mute leading-relaxed line-clamp-2">
                      {descText}
                    </p>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          handleInterested(e._id);
                        }}
                        disabled={isLoading}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all disabled:opacity-50 ${
                          isInterested
                            ? 'bg-vermilion text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {isLoading ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <ThumbsUp size={14} />
                        )}
                        {isInterested ? 'Interested' : "I'm Interested"}
                      </button>
                      <button
                        onClick={(ev) => handleShare(e, ev)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all ml-auto"
                      >
                        <Share2 size={14} />
                        Share
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="text-center mt-12">
          <Link
  to="/events"
  className="inline-flex items-center px-5 py-2 rounded-full font-medium text-sm text-white hover:opacity-90 transition-all"
  style={{ backgroundColor: "#8B2A2A" }}
>
  {t.viewMore || "View More"}
</Link>
          </div>
        </div>
      </section>

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
    </>
  );
}

// ─── Gallery Teaser - IMAGES NOT CLICKABLE ────────────────────────────────────
function GalleryTeaser({ settings }) {
  const { t, lang } = useLanguage();
  const galleryImages = settings?.galleryImages?.filter(img => img.enabled) || [];
  const imgs = galleryImages.slice(0, 8);
  const count = imgs.length;

  // Triple the images for seamless infinite scroll
  const tripledImages = [...imgs, ...imgs, ...imgs];
  const [isHovered, setIsHovered] = useState(false);

  // SPEED CONTROL: Adjust this value to control scroll speed
  const speedMultiplier = 0.25;
  const BASE_SCROLL_DURATION = count * 8;
  const SCROLL_DURATION = BASE_SCROLL_DURATION / speedMultiplier;

  const getLocalizedAlt = (obj) => {
    if (!obj) return 'Gallery Image';
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj.en || 'Gallery Image';
  };

  if (count === 0) return null;

  return (
    <section className="py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl" style={{ color: "#7A0000" }}>
            {t.galleryTitle || 'Photo Gallery'}
          </h2>
        </div>

        <div
          className="relative overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className="flex gap-4"
            style={{
              width: 'max-content',
              animation: isHovered ? 'none' : `scroll-left ${SCROLL_DURATION}s linear infinite`,
            }}
          >
            {tripledImages.map((img, idx) => (
              <div
                key={`${img.id}-${idx}`}
                className="flex-shrink-0 rounded-xl shadow-lg group overflow-hidden relative"
                style={{
                  width: 280,
                  height: 280
                }}
              >
                <img
                  src={img.src}
                  alt={getLocalizedAlt(img.alt)}
                  loading="lazy"
                  draggable={false}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 40%)" }}
                />
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes scroll-left {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-${(count / 3) * 100}%);
            }
          }
        `}</style>

        <div className="text-center mt-8">
        <Link
  to="/gallery"
  className="inline-flex items-center px-5 py-2 rounded-full font-medium text-sm text-white hover:opacity-90 transition-all"
  style={{ backgroundColor: "#8B2A2A" }}
>
  {t.viewMore || "View More"}
</Link>
        </div>
      </div>
    </section>
  );
}

// ─── Live Darshan ────────────────────────────────────────────────────────────
function LiveDarshan({ settings }) {
  const { t, lang } = useLanguage();
  const [videoError, setVideoError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [useAlternativeEmbed, setUseAlternativeEmbed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef(null);

  // Default live video with proper autoplay URL
  const liveVideo = settings?.liveVideo || {
    enabled: true,
    url: 'https://www.youtube.com/embed/aPGvK6tJMXk?autoplay=1&mute=1&playsinline=1&rel=0',
    title: { en: 'Live Darshan', ne: 'लाइभ दर्शन', hi: 'लाइव दर्शन', zh: '现场朝拜', ta: 'நேரடி தரிசனம்' },
    description: {
      en: 'Experience the divine presence of Lord Ram from anywhere in the world',
      ne: 'संसारको कुनै पनि स्थानबाट भगवान रामको दिव्य उपस्थिति अनुभव गर्नुहोस्',
      hi: 'दुनिया में कहीं से भी भगवान राम की दिव्य उपस्थिति का अनुभव करें',
      zh: '从世界任何地方体验拉姆勋爵的神圣存在',
      ta: 'உலகில் எங்கிருந்தும் இறைவன் ராமின் தெய்வீக இருப்பை அனுபவியுங்கள்'
    },
  };
  const timings = settings?.timings || { open: '05:00 AM', close: '08:00 PM' };

  // ── YouTube URL Parser with Autoplay Support ──────────────────────────────
  const parseYouTubeUrl = (url) => {
    let videoId = null;
    let playlistId = null;
    let embedUrl = null;
    let watchUrl = null;
    let isLiveStream = false;

    // Clean the URL
    url = url.trim();

    // Check if it's already an embed URL with proper parameters
    if (url.includes('/embed/')) {
      embedUrl = url;
      const match = url.match(/\/embed\/([^?]+)/);
      if (match) videoId = match[1];
      watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

      // Check if URL already has autoplay and mute parameters
      if (!url.includes('autoplay=1')) {
        const separator = url.includes('?') ? '&' : '?';
        embedUrl = `${url}${separator}autoplay=1&mute=1&playsinline=1&rel=0`;
      }
      return { videoId, playlistId, embedUrl, watchUrl, isLiveStream };
    }

    // Extract video ID from youtube.com/watch?v=
    if (url.includes('youtube.com/watch?v=')) {
      const params = new URLSearchParams(url.split('?')[1]);
      videoId = params.get('v');
      playlistId = params.get('list');
      watchUrl = url;
    }
    // Extract from youtu.be/
    else if (url.includes('youtu.be/')) {
      const parts = url.split('youtu.be/')[1]?.split('?');
      videoId = parts?.[0];
      if (parts?.[1]) {
        const params = new URLSearchParams(parts[1]);
        playlistId = params.get('list');
      }
      watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    }
    // Extract from youtube.com/embed/
    else if (url.includes('youtube.com/embed/')) {
      const parts = url.split('youtube.com/embed/')[1]?.split('?');
      videoId = parts?.[0];
      if (parts?.[1]) {
        const params = new URLSearchParams(parts[1]);
        playlistId = params.get('list');
      }
      watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    }
    // Extract from youtube.com/shorts/
    else if (url.includes('youtube.com/shorts/')) {
      const parts = url.split('youtube.com/shorts/')[1]?.split('?');
      videoId = parts?.[0];
      watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    }
    // Extract from live stream URL
    else if (url.includes('/live/')) {
      const match = url.match(/\/live\/([^?]+)/);
      if (match) videoId = match[1];
      isLiveStream = true;
      watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    }
    // Extract from URL with v= parameter
    else if (url.includes('v=')) {
      const params = new URLSearchParams(url.split('?')[1]);
      videoId = params.get('v');
      playlistId = params.get('list');
      watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    }
    // Check if it's a live stream based on URL patterns
    else if (url.includes('live') || url.includes('stream')) {
      isLiveStream = true;
    }

    // ── BUILD EMBED URL WITH AUTOPLAY AND MUTE ──
    const origin = window.location.origin;

    if (playlistId) {
      embedUrl = `https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1&mute=1&playsinline=1&rel=0&enablejsapi=1&origin=${origin}`;
    } else if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0&enablejsapi=1&origin=${origin}`;
    } else {
      embedUrl = 'https://www.youtube.com/embed/aPGvK6tJMXk?autoplay=1&mute=1&playsinline=1&rel=0';
      watchUrl = 'https://www.youtube.com/watch?v=aPGvK6tJMXk';
    }

    return { videoId, playlistId, embedUrl, watchUrl, isLiveStream };
  };

  const { videoId, playlistId, embedUrl, watchUrl, isLiveStream } = parseYouTubeUrl(liveVideo.url);

  // ─── Handle iframe load timeout ─────────────────────────────────────────────
  useEffect(() => {
    let timeoutId;
    if (isLoading) {
      timeoutId = setTimeout(() => {
        setIsLoading(false);
        if (!videoError) {
          setVideoError(true);
          setErrorMessage('Video is taking too long to load. Please try again.');
        }
      }, 15000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, videoError]);

  if (!liveVideo.enabled) return null;

  const titleText = getLocalizedText(liveVideo.title, lang) || 'Live Darshan';
  const descText = getLocalizedText(liveVideo.description, lang) || 'Experience the divine presence of Lord Ram from anywhere in the world';

  const handleIframeError = (e) => {
    console.error('YouTube iframe error:', e);
    setVideoError(true);
    setErrorMessage('Video playback error. Please try again or watch on YouTube directly.');
    setIsLoading(false);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setVideoError(false);
    setErrorMessage('');
  };

  const handleRetry = () => {
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    setVideoError(false);
    setErrorMessage('');
    setIsLoading(true);

    if (newRetryCount >= 2) {
      setUseAlternativeEmbed(true);
    }

    if (newRetryCount >= 5) {
      setUseAlternativeEmbed(false);
      setRetryCount(0);
    }
  };

  const getEmbedUrl = () => {
    if (useAlternativeEmbed && videoId) {
      const origin = window.location.origin;
      return `https://www.youtube.com/embed/${videoId}?mute=1&playsinline=1&rel=0&enablejsapi=1&origin=${origin}`;
    }
    if (useAlternativeEmbed && playlistId) {
      const origin = window.location.origin;
      return `https://www.youtube.com/embed/videoseries?list=${playlistId}&mute=1&playsinline=1&rel=0&enablejsapi=1&origin=${origin}`;
    }
    return embedUrl;
  };

  const currentEmbedUrl = getEmbedUrl();

  return (
    <section className="bg-red-900 text-white py-20 border-t border-line">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="font-serif text-3xl sm:text-4xl text-white">
          {titleText}
        </h2>
        <p className="mt-3 text-white/70">
          {descText}
        </p>

        <div className="mt-8 aspect-video w-full overflow-hidden rounded-lg border border-white/20 bg-black relative">
          {isLoading && !videoError && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
              <div className="flex flex-col items-center gap-3">
                <OmLoader size="lg" color="white" />
                <span className="text-white/70 text-sm">Loading live stream...</span>
              </div>
            </div>
          )}

          {!videoError ? (
            <iframe
              key={`youtube-iframe-${retryCount}`}
              ref={iframeRef}
              className="w-full h-full"
              src={currentEmbedUrl}
              title="Live Darshan"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups"
              onError={handleIframeError}
              onLoad={handleIframeLoad}
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center flex-col gap-4 p-6 bg-black/90">
              <div className="text-4xl mb-2">📺</div>
              <div className="text-white/80 text-sm max-w-md text-center">
                <p className="font-semibold mb-1">Unable to load the live stream</p>
                <p className="text-white/60 text-xs">{errorMessage || 'The live stream may be unavailable or restricted in your region.'}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <span>🔄</span> Retry {retryCount > 0 && `(${retryCount})`}
                </button>

                {watchUrl && (
                  <a
                    href={watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors inline-flex items-center gap-2"
                  >
                    <span>▶</span> Watch on YouTube
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/booking" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm shadow-lg shadow-vermilion/30 hover:bg-[#a83a0c] hover:-translate-y-0.5 transition-all" style={{ backgroundColor: "#7A0000", color: "white" }}>
            {t.heroCta2 || 'Book Puja'} <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/donate" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white border border-white/50 hover:bg-white/10 transition-all">
            {t.navDonate || 'Donate'}
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Main Home Page ──────────────────────────────────────────────────────────
const HomePage = () => {
  const { modal, open, close } = useImageModal();
  const [settings, setSettings] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);
  const { t, lang } = useLanguage();

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const fetchData = async () => {
      try {
        const [settingsRes, teamRes] = await Promise.all([
          api.get('/admin/settings'),
          api.get('/admin/team')
        ]);
        setSettings(settingsRes.data);
        // Sort team by order and filter enabled members
        const sortedTeam = (teamRes.data || [])
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .filter(m => m.enabled !== false);
        setTeam(sortedTeam);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <OmLoader size="lg" color="vermilion" className="mx-auto mb-4" />
          <p className="text-ink-soft text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Get the quote - supports both string and object with language keys
  const getQuote = () => {
    const quoteData = settings?.quotes;
    if (!quoteData) return t.dailyQuote || "Where there is righteousness in the heart, there is beauty in the character.";

    if (typeof quoteData === 'object' && !Array.isArray(quoteData)) {
      return quoteData[lang] || quoteData.en || t.dailyQuote || "Where there is righteousness in the heart, there is beauty in the character.";
    }

    return quoteData || t.dailyQuote || "Where there is righteousness in the heart, there is beauty in the character.";
  };

  const quote = getQuote();

  return (
    <>
      <Hero settings={settings} team={team} />
      <QuoteStrip quote={quote} />
      <AboutPreview settings={settings} />
      <FacebookVideoTeaser settings={settings} />
      <EventsTeaser onOpen={open} />
      <GalleryTeaser settings={settings} />
      <LiveDarshan settings={settings} />

      {modal && (
        <ImageModal src={modal.src} alt={modal.alt} onClose={close} />
      )}
    </>
  );
};

export default HomePage;