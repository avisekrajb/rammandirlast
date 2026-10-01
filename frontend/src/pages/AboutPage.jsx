import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { handleImageError } from '../utils/imageFallback';
import OmLoader from '../components/common/OmLoader';
import FacebookVideoSection from '../components/common/FacebookVideoSection';
import SectionTitle from '../components/common/SectionTitle';
import { getSectionTitle } from '../utils/sectionTitle';

const getLocalizedText = (obj, lang) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || '';
};

// ===== HERO COMPONENT =====
function AboutHero({ hero }) {
  const { t, lang } = useLanguage();
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const smooth = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });
  const imgScale = useTransform(smooth, [0, 1], [1, 1.16]);
  const overlayOp = useTransform(smooth, [0, 0.7], [0.32, 0.72]);
  const textY = useTransform(smooth, [0, 1], ["0%", "-26%"]);
  const textOpacity = useTransform(smooth, [0, 0.5], [1, 0]);

  /*
 * The hero banner title comes from Admin → About, so a saved empty value
 * would otherwise fall back to the generic 'About Us'. Fall back to the
 * localized "Shree Ramchandra Temple — introduction" line instead so the
 * banner always names the temple in the visitor's own language.
 *
 * getSectionTitle also discards an older placeholder saved before the rename
 * (e.g. "श्री रामचन्द्र मन्दिरको बारेमा"), so this shows the current wording
 * without waiting for the backend backfill to run.
 */
  const titleText =
    getSectionTitle(hero?.title, lang) || t.aboutHeroTitle;
  const imageSrc = hero?.image || '/aboutusphoto.jpeg';

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden"
      data-hero-section="about"
      style={{ height: "100svh", minHeight: 520 }}
    >
      <motion.img
        src={imageSrc}
        alt=""
        aria-hidden
        style={{ scale: imgScale }}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none origin-center"
           onError={(e) => { handleImageError(e, '/aboutusphoto.jpeg'); }}
      />
      <motion.div className="absolute inset-0" style={{ background: "rgba(0,0,0,1)", opacity: overlayOp }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.08) 45%, transparent 70%)" }} />
      
      <motion.div style={{ y: textY, opacity: textOpacity }} className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="temple-heading"
        >
          {titleText}
        </motion.h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        style={{ opacity: textOpacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-white/40 text-xs uppercase tracking-widest" style={{ fontFamily: "serif" }}>scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          style={{ width: 1, height: 32, background: "linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)" }}
        />
      </motion.div>
    </div>
  );
}

// ===== INTRO TEXT COMPONENT - VISIBLE BELOW HERO =====
function IntroText({ introText }) {
  const { t, lang } = useLanguage();

  const text = getLocalizedText(introText, lang);

  if (!text) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      className="bg-white py-16 px-6 border-b border-gray-100"
    >
      <div className="max-w-4xl mx-auto text-center">
        {/*
           "परिचय" sits directly below the hero banner and introduces the intro
           text. It was text-xs (12px) with wide tracking, which is too small to
           register as a heading - it read as a stray label. Bumped to text-base
           / text-lg with slightly tighter tracking.
         */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6">
          <div className="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent to-maroon/50" />
          <span className="font-serif font-bold text-maroon text-base sm:text-lg lg:text-xl tracking-[0.12em] leading-[1.7]">
            {t.aboutIntroduction || 'Introduction'}
          </span>
          <div className="h-px w-10 sm:w-16 bg-gradient-to-l from-transparent to-maroon/50" />
        </div>

        <p className="font-serif text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-700 max-w-3xl mx-auto text-justify">
          {text}
        </p>

        <div className="mt-8 flex justify-center items-center gap-3">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-maroon/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-maroon/50" />
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-maroon/40" />
        </div>
      </div>
    </motion.div>
  );
}

// ===== SECTION COMPONENT =====
function AboutSection({ section, index }) {
  const { lang } = useLanguage();
  const isEven = index % 2 === 0;
  const titleText = getLocalizedText(section.title, lang) || 'Section Title';
  const defaultImages = ['/1.jpg', '/2.jpg', '/3.jpg'];

  // Prefer the structured paragraphs; fall back to the single `body` field.
  const paragraphs = section.paragraphs
    ? Object.keys(section.paragraphs)
        .map((pKey) => getLocalizedText(section.paragraphs[pKey], lang))
        .filter(Boolean)
    : [];
  if (paragraphs.length === 0) {
    const bodyText = getLocalizedText(section.body, lang);
    if (bodyText) paragraphs.push(bodyText);
  }

  const listTitleText = getLocalizedText(section.listTitle, lang);
  const points = Array.isArray(section.points)
    ? section.points.map((p) => getLocalizedText(p, lang)).filter(Boolean)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className={`grid md:grid-cols-2 gap-12 items-center ${!isEven ? "md:[&>*:first-child]:order-2" : ""}`}
    >
      <div className="rounded-xl overflow-hidden shadow-lg">
        <img
          src={section.image || defaultImages[index % defaultImages.length]}
          alt={titleText}
          loading="lazy"
          className="w-full h-80 object-cover"
            onError={(e) => { handleImageError(e, defaultImages[index % defaultImages.length]); }}
        />
      </div>
      <div className="flex flex-col justify-center">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-4" style={{ color: "#7A0000" }}>
          {titleText}
        </h2>

        {paragraphs.map((text, i) => (
          <p key={i} className="text-mute leading-relaxed text-base sm:text-lg text-justify mb-4 last:mb-0">
            {text}
          </p>
        ))}

        {points.length > 0 && (
          <div className="mt-5">
            {listTitleText && (
              <p className="font-semibold text-base sm:text-lg mb-3" style={{ color: "#7A1F2B" }}>
                {listTitleText}
              </p>
            )}
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
              {points.map((point, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span
                    className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full"
                    style={{ background: "linear-gradient(135deg, #E8A93D, #C1440E)" }}
                  />
                  <span className="text-base sm:text-lg text-mute leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ===== ACTIVITIES COMPONENT =====
function ActivitiesSection({ activities }) {
  const { t, lang } = useLanguage();

  if (!activities || activities.length === 0) return null;

  return (
    <section className="py-16">
      <div className="max-w-4xl mx-auto px-6 mb-12">
        <SectionTitle>{t.activitiesPrograms || 'Activities & Programs'}</SectionTitle>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {activities.map((activity, index) => {
          const isEven = index % 2 === 0;
          const hasParagraphs = activity.paragraphs && Object.keys(activity.paragraphs).length > 0;
          const titleText = getLocalizedText(activity.title, lang) || activity.key || 'Activity';
          const descText = getLocalizedText(activity.desc, lang) || '';

          return (
            <motion.div
              key={activity.key || index}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
              className={`py-12 px-6 sm:px-10 lg:px-16 ${isEven ? "" : "bg-gray-50"} rounded-xl ${index > 0 ? "mt-6" : ""}`}
            >
              <div className="max-w-5xl mx-auto">
                <div className="flex items-baseline gap-4 mb-4">
                  <span className="text-xs tracking-widest text-mute shrink-0" style={{ fontFamily: "serif", minWidth: "2.5rem" }}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl leading-tight" style={{ color: "#7A1F2B" }}>
                    {titleText}
                  </h3>
                </div>

                <div className="ml-10 max-w-3xl">
                  {hasParagraphs ? (
                    <div className="space-y-4">
                      {Object.keys(activity.paragraphs).map((pKey) => {
                        const paraText = getLocalizedText(activity.paragraphs[pKey], lang);
                        if (!paraText) return null;
                        return (
                          <p key={pKey} className="text-sm sm:text-base text-mute leading-relaxed text-justify">
                            {paraText}
                          </p>
                        );
                      })}
                    </div>
                  ) : descText ? (
                    <p className="text-sm sm:text-base text-mute leading-relaxed text-justify">{descText}</p>
                  ) : (
                    <p className="text-sm sm:text-base text-mute leading-relaxed text-justify">No description available</p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ===== BANNER TEXT COMPONENT =====
function BannerText({ bannerText }) {
  const { lang } = useLanguage();
  
  if (!bannerText) return null;
  
  const text = getLocalizedText(bannerText, lang);
  if (!text) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="bg-gray-50 py-12 px-6 border-y border-gray-100"
    >
      <div className="max-w-4xl mx-auto text-center">
        <p className="font-serif text-lg sm:text-xl md:text-2xl leading-relaxed text-gray-700 italic text-justify">
          "{text}"
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <span className="inline-block w-12 h-px bg-amber-400/60" />
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400/60" />
          <span className="inline-block w-12 h-px bg-amber-400/60" />
        </div>
      </div>
    </motion.div>
  );
}

// ===== MAIN ABOUT PAGE =====
const AboutPage = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [aboutData, setAboutData] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [aboutRes, settingsRes] = await Promise.all([
          api.get('/about'),
          api.get('/admin/settings').catch(() => null),
        ]);
        setAboutData(aboutRes.data.data);
        setSettings(settingsRes?.data || null);
      } catch (error) {
        console.error('Error fetching about data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <OmLoader size="md" color="maroon" />
      </div>
    );
  }

  const sections = aboutData?.sections?.filter(s => s.enabled !== false).sort((a, b) => (a.order || 0) - (b.order || 0)) || [];
  const activities = aboutData?.activities?.filter(a => a.enabled !== false).sort((a, b) => (a.order || 0) - (b.order || 0)) || [];

  return (
    <div className="w-full min-h-screen bg-white">
      <AboutHero hero={aboutData?.hero} />
      <IntroText introText={aboutData?.introText} />

      {aboutData?.bannerText && (
        <BannerText bannerText={aboutData.bannerText} />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 space-y-24">
        {sections.map((section, index) => (
          <AboutSection key={section.key || index} section={section} index={index} />
        ))}
      </div>

      <ActivitiesSection activities={activities} />

      {/* Reels & short videos — below Activities & Programs */}
      <div className="bg-white pb-16">
        <FacebookVideoSection
          settings={settings}
          t={t}
          onlyReels
          showViewMoreReels={false}
          containerClass="max-w-7xl mx-auto px-4 sm:px-6"
        />
      </div>
    </div>
  );
};

export default AboutPage;