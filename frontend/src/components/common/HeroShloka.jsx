import React from 'react';

/**
 * HeroShloka — the invocation and stuti shown over the home page hero video.
 *
 * The hero no longer carries the temple name or the tagline as visible text;
 * this replaces it. The temple name is still rendered as a visually hidden
 * <h1> so the page keeps exactly one top-level heading for screen readers and
 * search engines, which a visible title used to provide.
 *
 * Text is supplied as lines rather than one string so each can be sized and
 * spaced individually: the two labels sit apart from the verse itself.
 */

const INVOCATION = 'श्रीरामचन्द्राय नम:';
const STUTI_LABEL = 'श्रीरामस्तुति:';
const VERSE = [
  'लोकाभिरामं रणरङ्गधीरं राजीवनेत्रं रघुवंशनाथम् ।',
  'कारुण्यरूपं करुणाकरंतं श्रीरामचन्द्रंशरणं प्रपद्ये॥',
];

const HeroShloka = ({ templeName }) => (
  <div className="hero-shloka">
    {/* One real h1 per page, available to assistive tech and crawlers. */}
    <h1 className="sr-only">{templeName}</h1>

    <p className="hero-shloka__label">{INVOCATION}</p>
    <p className="hero-shloka__label">{STUTI_LABEL}</p>

    <div className="hero-shloka__rule" aria-hidden />

    <p className="hero-shloka__verse">
      {VERSE.map((line) => (
        <span key={line} className="hero-shloka__line">
          {line}
        </span>
      ))}
    </p>
  </div>
);

export default HeroShloka;