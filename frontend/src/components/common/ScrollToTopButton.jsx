import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { useScroll } from '../../context/ScrollContext';

const ScrollToTopButton = () => {
  const { isVisible, isAtBottom, scrollProgress, scrollToTop } = useScroll();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't show if not visible or at bottom (footer area)
  if (!isVisible || isAtBottom) {
    return null;
  }

  // Calculate rotation based on scroll progress
  const rotation = (scrollProgress / 100) * 360;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, scale: 0.8, x: -20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.8, x: -20 }}
        transition={{ 
          duration: 0.3, 
          ease: [0.16, 1, 0.3, 1],
          type: 'spring',
          stiffness: 400,
          damping: 30
        }}
        onClick={scrollToTop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed z-50 group"
        style={{
          bottom: isMobile ? '100px' : '32px',
          left: isMobile ? '12px' : '24px',
          right: 'auto',
        }}
      >
        {/* Outer Glow Ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, #7A1F2B, #C1440E, #E8A93D, #7A1F2B)',
            padding: '3px',
            opacity: isHovered ? 1 : 0.6,
            transition: 'opacity 0.3s ease'
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          <div className="w-full h-full rounded-full bg-white" />
        </motion.div>

        {/* Main Button */}
        <motion.div
          className="relative w-12 h-12 rounded-full bg-gradient-to-br from-vermilion to-maroon-deep shadow-lg shadow-vermilion/30 flex items-center justify-center text-white overflow-hidden"
          whileTap={{ scale: 0.9 }}
          animate={{
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {/* Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="22"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="3"
              fill="none"
            />
            <circle
              cx="50%"
              cy="50%"
              r="22"
              stroke="white"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={Math.PI * 2 * 22}
              strokeDashoffset={Math.PI * 2 * 22 * (1 - scrollProgress / 100)}
              style={{
                transition: 'stroke-dashoffset 0.1s ease'
              }}
            />
          </svg>

          {/* Icon */}
          <motion.div
            animate={{
              y: isHovered ? -4 : 0,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <ChevronUp 
              size={24} 
              strokeWidth={2.5}
              className="relative z-10 drop-shadow-lg"
            />
          </motion.div>

          {/* Ripple effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-white/20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: isHovered ? 1.4 : 0,
              opacity: isHovered ? 0 : 0,
            }}
            transition={{ duration: 0.5 }}
          />
        </motion.div>

        {/* Tooltip - positioned to the right on left side */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            x: isHovered ? 8 : -10
          }}
          transition={{ duration: 0.2 }}
          className="absolute top-1/2 -translate-y-1/2 left-full ml-3 whitespace-nowrap bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded-lg backdrop-blur-sm pointer-events-none"
        >
          Scroll to Top
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-black/80 rotate-45" />
        </motion.div>
      </motion.button>
    </AnimatePresence>
  );
};

export default ScrollToTopButton;