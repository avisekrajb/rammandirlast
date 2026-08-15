import React from 'react';

const OmLoader = ({ size = 'md', color = 'maroon', className = '' }) => {
  const sizes = {
    sm: 'h-6 w-6 text-base',
    md: 'h-10 w-10 text-xl',
    lg: 'h-12 w-12 text-3xl',
    xl: 'h-16 w-16 text-4xl',
  };

  const ringColors = {
    maroon: 'border-maroon/40 border-t-maroon shadow-maroon/20',
    white: 'border-white/40 border-t-white shadow-white/20',
    vermilion: 'border-vermilion/40 border-t-vermilion shadow-vermilion/20',
    green: 'border-green-500/40 border-t-green-500 shadow-green-500/20',
  };

  const omColors = {
    maroon: 'text-maroon',
    white: 'text-white',
    vermilion: 'text-vermilion',
    green: 'text-green-500',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`relative ${sizes[size] || sizes.md}`}>
        <div
          className={`absolute inset-0 rounded-full border-3 ${ringColors[color] || ringColors.maroon} animate-spin shadow-lg`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`leading-none font-serif font-bold select-none ${omColors[color] || omColors.maroon} animate-spin-slow`}
          >
            ॐ
          </span>
        </div>
      </div>
    </div>
  );
};

export default OmLoader;
