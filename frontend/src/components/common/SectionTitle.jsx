import React from 'react';
import { motion } from 'framer-motion';

/**
 * SectionTitle — single source of truth for every section heading on the
 * public site (home teasers, gallery, videos, blogs, events, ...).
 *
 * Why this exists:
 *  - Headings used to be hand-written per section, so the same word rendered at
 *    four different sizes and two different weights across the site.
 *  - Nothing scaled with the language, so a long Devanagari/Tamil heading and a
 *    short English one looked like they came from different pages.
 *
 * One component fixes both: identical markup, identical responsive scale and
 * identical weight no matter which language `children` holds.
 *
 * `tone="dark"` is for headings that sit on the maroon/vermilion sections.
 */

const TONES = {
  light: {
    title: '#7A0000',
    sub: 'text-ink-soft',
    ornament: 'from-[#7A0000] via-vermilion to-marigold',
    dot: '#C1440E',
    edge: 'from-transparent via-[#7A0000]/25 to-transparent',
  },
  dark: {
    title: '#ffffff',
    sub: 'text-white/70',
    ornament: 'from-white/0 via-marigold to-white/0',
    dot: '#E8A93D',
    edge: 'from-transparent via-white/20 to-transparent',
  },
};

const SectionTitle = ({
  children,
  sub,
  tone = 'light',
  align = 'center',
  className = '',
  subClassName = '',
  delay = 0,
  animate = true,
}) => {
  const c = TONES[tone] || TONES.light;
  const isCenter = align === 'center';

  const heading = (
    <>
      <h2
        className={`
          font-serif font-bold tracking-tight
          text-[1.75rem] leading-[1.25]
          sm:text-[2.1rem]
          md:text-[2.5rem]
          ${className}
        `}
        style={{ color: c.title }}
      >
        {children}
      </h2>

      {/* Gradient rule + diamond: the ornament that makes it read as one family */}
      <div
        aria-hidden
        className={`mt-3 sm:mt-4 flex items-center gap-2 ${
          isCenter ? 'justify-center' : 'justify-start'
        }`}
      >
        <span
          className={`h-[3px] w-12 sm:w-16 rounded-full bg-gradient-to-r ${c.ornament}`}
        />
        <span
          className="h-1.5 w-1.5 rotate-45 rounded-[2px]"
          style={{ background: c.dot }}
        />
        <span
          className={`h-[3px] w-12 sm:w-16 rounded-full bg-gradient-to-l ${c.ornament}`}
        />
      </div>

      {sub && (
        <p className={`mt-3 sm:mt-4 text-sm sm:text-base ${c.sub} ${subClassName}`}>
          {sub}
        </p>
      )}
    </>
  );

  const alignCls = isCenter ? 'text-center' : 'text-left';

  if (!animate) {
    return <div className={`rt-section-title ${alignCls}`}>{heading}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`rt-section-title ${alignCls}`}
    >
      {heading}
    </motion.div>
  );
};

export default SectionTitle;