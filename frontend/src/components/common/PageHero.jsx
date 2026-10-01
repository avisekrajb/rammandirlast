import React from 'react';
import PageHeader from './PageHeader';

/**
 * PageHero — maroon banner variant of the standard page title.
 *
 * Donate, My Bookings, Profile and the dynamic footer pages use a coloured
 * banner while the rest of the site uses PageHeader on a light background.
 * Both now delegate their typography to PageHeader, so the title keeps the same
 * size, weight and ornament everywhere; only the background differs.
 */
const PageHero = ({ title, sub }) => {
  return (
    <div className="bg-gradient-to-br from-maroon to-maroon-deep text-white px-5 py-14 sm:py-16">
      <PageHeader tone="dark" sub={sub} subClassName="text-white/75">
        {title}
      </PageHeader>
    </div>
  );
};

export default PageHero;