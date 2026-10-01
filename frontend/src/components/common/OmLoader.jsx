import React from 'react';

/**
 * OmLoader — the ॐ loading mark used across the site.
 *
 * The ring rotates; the ॐ never does. The arc sweeps through a red-brown into
 * orange, which reads as movement without the ring strobing, and the glyph stays
 * fixed in the centre so it remains legible while the animation runs.
 *
 * Every moving part is transform-only, so it runs on the compositor and does
 * not compete with scrolling for main-thread time.
 */

const SIZES = {
  sm: { box: 'h-9 w-9', om: 'text-xl', ring: 2, arc: 2 },
  md: { box: 'h-14 w-14', om: 'text-3xl', ring: 2, arc: 3 },
  lg: { box: 'h-[4.5rem] w-[4.5rem]', om: 'text-4xl', ring: 2.5, arc: 3.5 },
  xl: { box: 'h-24 w-24', om: 'text-5xl', ring: 3, arc: 4 },
};

/*
 * Ring arc: [red-brown, gold, orange]. The temple's own maroon and marigold,
 * with a warmer orange at the leading edge so the direction of travel is clear.
 */
const ARC_COLORS = {
  maroon: ['#7A1F2B', '#E8A93D', '#FF5722'],
  white: ['#8B2635', '#E8A93D', '#FF7043'],
  vermilion: ['#C1440E', '#E8A93D', '#FF9800'],
  green: ['#1F4E3D', '#E8A93D', '#FF9800'],
};

// Accent used for the ring glow.
const ACCENT = {
  maroon: '#7A1F2B',
  white: '#ff3b3b',
  vermilion: '#C1440E',
  green: '#10b981',
};

// Solid colour of the ॐ glyph.
const GLYPH = {
  maroon: '#7A1F2B',
  white: '#ffffff',
  vermilion: '#C1440E',
  green: '#1F4E3D',
};

const OmLoader = ({ size = 'md', color = 'maroon', className = '' }) => {
  const s = SIZES[size] || SIZES.md;
  const accent = ACCENT[color] || ACCENT.maroon;
  const glyph = GLYPH[color] || GLYPH.maroon;
  const [dark, gold, orange] = ARC_COLORS[color] || ARC_COLORS.maroon;

  const onDark = color === 'white';
  const ringColor = onDark ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.95)';

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading</span>

      <div className={`relative ${s.box}`}>
        {/* Soft glow behind the mark, so it reads on light and dark */}
        <span
          aria-hidden
          className="absolute -inset-2 rounded-full"
          style={{
            background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
          }}
        />

        {/* Static outer ring */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            border: `${s.ring}px solid ${ringColor}`,
            boxShadow: `0 0 12px ${accent}44, inset 0 0 8px rgba(255,255,255,0.35)`,
          }}
        />

        {/*
          The rotating arc. Masked into a thin ring so it reads as a stroke
          rather than a filled pie, and rotated by a class rather than an
          inline animation so it stays on the compositor.
        */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full rt-om-spin"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg 235deg, ${dark} 280deg, ${gold} 320deg, ${orange} 348deg, transparent 360deg)`,
            WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${s.arc}px), #000 calc(100% - ${s.arc - 1}px))`,
            mask: `radial-gradient(farthest-side, transparent calc(100% - ${s.arc}px), #000 calc(100% - ${s.arc - 1}px))`,
          }}
        />

        {/* ॐ stays still while the arc moves around it */}
        <span className="absolute inset-0 flex items-center justify-center">
          <span
            aria-hidden
            className={`leading-none font-serif font-bold select-none ${s.om}`}
            style={{
              color: glyph,
              textShadow: onDark ? '0 0 12px rgba(255,255,255,0.85)' : 'none',
            }}
          >
            ॐ
          </span>
        </span>
      </div>
    </div>
  );
};

export default OmLoader;