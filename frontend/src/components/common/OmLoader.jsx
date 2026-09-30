import React from 'react';

const OmLoader = ({ size = 'md', color = 'maroon', className = '' }) => {
  const sizes = {
    sm: { box: 'h-7 w-7', om: 'text-base' },
    md: { box: 'h-12 w-12', om: 'text-2xl' },
    lg: { box: 'h-14 w-14', om: 'text-3xl' },
    xl: { box: 'h-20 w-20', om: 'text-5xl' },
  };

  // Neon red accent used on the outer ring (user request: neon red + white)
  const neon = {
    maroon: '#e11d48',
    white: '#ff3b3b',
    vermilion: '#ff5722',
    green: '#10b981',
  };

  const omColors = {
    maroon: '#7A1F2B',
    white: '#ffffff',
    vermilion: '#C1440E',
    green: '#10b981',
  };

  const s = sizes[size] || sizes.md;
  const accent = neon[color] || neon.maroon;
  const omColor = omColors[color] || omColors.maroon;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`relative ${s.box}`}>
        {/* Static white neon ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid rgba(255,255,255,0.95)',
            boxShadow:
              `0 0 10px ${accent}, 0 0 22px rgba(255,255,255,0.55), inset 0 0 8px rgba(255,255,255,0.35)`,
          }}
        />
        {/* Spinning neon red ring segment (ring rotates, ॐ stays still) */}
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg 250deg, ${accent} 300deg, #ffffff 340deg, transparent 360deg)`,
            WebkitMask:
              'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))',
          }}
        />
        {/* Static ॐ - never rotates */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`leading-none font-serif font-bold select-none ${s.om}`}
            style={{ color: omColor, textShadow: color === 'white' ? `0 0 10px rgba(255,255,255,0.8)` : 'none' }}
          >
            ॐ
          </span>
        </div>
      </div>
    </div>
  );
};

export default OmLoader;