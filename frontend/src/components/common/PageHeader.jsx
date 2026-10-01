import React from 'react';
import { motion } from 'framer-motion';

/**
 * PageHeader — the single top-of-page heading for every public page.
 *
 * Before this existed each page hand-rolled its own <h1>: About/History/Terms
 * used text-3xl, Events/Calendar/Videos/Blogs jumped to text-6xl, some were
 * font-light and some font-bold, and each picked a different maroon shade. The
 * result was that moving between pages felt like moving between sites.
 *
 * One component locks the scale, weight and colour so every page title matches,
 * and it renders identically for every language because only `children` changes.
 *
 * `tone="dark"` is for pages that sit on the maroon banner.
 */

const TONES = {
  light: {
    title: '#7A0000',
    sub: 'text-ink-soft',
    ornament: 'from-[#7A0000] via-vermilion to-marigold',
    dot: '#C1440E',
  },
  dark: {
    title: '#ffffff',
    sub: 'text-white/75',
    ornament: 'from-white/0 via-marigold to-white/0',
    dot: '#E8A93D',
  },
};

const PageHeader = ({
  children,
  sub,
  tone = 'light',
  className = '',
  subClassName = '',
  animate = true,
}) => {
  const c = TONES[tone] || TONES.light;

  const content = (
    <>
      <h1
        className={`
          font-serif font-bold tracking-tight
          text-[1.9rem] leading-[1.2]
          sm:text-[2.35rem]
          md:text-[2.75rem]
          ${className}
        `}
        style={{ color: c.title }}
      >
        {children}
      </h1>

      {/* Gradient rule + diamond: matches SectionTitle so page and section
          headings read as the same design family */}
      <div
        aria-hidden
        className="mt-3.5 sm:mt-4 flex items-center justify-center gap-2"
      >
        <span className={`h-[3px] w-14 sm:w-20 rounded-full bg-gradient-to-r ${c.ornament}`} />
        <span className="h-1.5 w-1.5 rotate-45 rounded-[2px]" style={{ background: c.dot }} />
        <span className={`h-[3px] w-14 sm:w-20 rounded-full bg-gradient-to-l ${c.ornament}`} />
      </div>

      {sub && (
        <p className={`mt-4 text-sm sm:text-base ${c.sub} max-w-2xl mx-auto leading-relaxed ${subClassName}`}>
          {sub}
        </p>
      )}
    </>
  );

  if (!animate) {
    return <div className="text-center">{content}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="text-center"
    >
      {content}
    </motion.div>
  );
};

export default PageHeader;