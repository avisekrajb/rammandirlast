import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import OmLoader from '../components/common/OmLoader';

const getLocalizedText = (obj, lang) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || '';
};

// ===== HERO COMPONENT =====
function AboutHero({ hero }) {
  const { lang } = useLanguage();
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

  const titleText = getLocalizedText(hero?.title, lang) || 'About Us';
  const imageSrc = hero?.image || '/aboutusphoto.jpeg';

  return (
    <div ref={ref} className="relative w-full overflow-hidden" style={{ height: "100svh", minHeight: 520 }}>
      <motion.img
        src={imageSrc}
        alt=""
        aria-hidden
        style={{ scale: imgScale }}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none origin-center"
        onError={(e) => { e.target.src = '/aboutusphoto.jpeg'; }}
      />
      <motion.div className="absolute inset-0" style={{ background: "rgba(0,0,0,1)", opacity: overlayOp }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.08) 45%, transparent 70%)" }} />
      
      <motion.div style={{ y: textY, opacity: textOpacity }} className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="font-serif text-5xl sm:text-6xl lg:text-7xl text-white font-light leading-tight drop-shadow-2xl"
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
  const { lang } = useLanguage();
  
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
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-maroon/20" />
          <span className="text-xs uppercase tracking-widest text-maroon/40 font-serif">Introduction</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-maroon/20" />
        </div>
        
        <p className="font-serif text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-700 max-w-3xl mx-auto text-justify">
          {text}
        </p>
        
        <div className="mt-8 flex justify-center items-center gap-3">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-maroon/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-maroon/30" />
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-maroon/30" />
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
  const bodyText = getLocalizedText(section.body, lang) || 'Section description...';
  const defaultImages = ['/1.jpg', '/2.jpg', '/3.jpg'];

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
          onError={(e) => { e.target.src = defaultImages[index % defaultImages.length]; }}
        />
      </div>
      <div className="flex flex-col justify-center">
        <h2 className="font-serif text-2xl sm:text-3xl mb-4" style={{ color: "#7A0000" }}>
          {titleText}
        </h2>
        <p className="text-mute leading-relaxed text-base sm:text-lg text-justify">{bodyText}</p>
      </div>
    </motion.div>
  );
}

// ===== ACTIVITIES COMPONENT =====
function ActivitiesSection({ activities }) {
  const { lang } = useLanguage();

  if (!activities || activities.length === 0) return null;

  return (
    <section className="py-16">
      <div className="max-w-4xl mx-auto px-6 text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-300" />
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl" style={{ color: "#1a0a00" }}>
          Activities & Programs
        </h2>
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
              className={`py-12 px-6 sm:px-10 lg:px-16 ${isEven ? "" : "bg-[#faf7f4]"} rounded-xl ${index > 0 ? "mt-6" : ""}`}
            >
              <div className="max-w-5xl mx-auto">
                <div className="flex items-baseline gap-4 mb-4">
                  <span className="text-xs tracking-widest text-mute shrink-0" style={{ fontFamily: "serif", minWidth: "2.5rem" }}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl leading-tight" style={{ color: "#520505" }}>
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
      className="bg-gradient-to-r from-amber-50 via-white to-amber-50 py-12 px-6 border-y border-amber-200/30"
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
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [aboutData, setAboutData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/about');
        setAboutData(response.data.data);
        console.log('About Data:', response.data.data);
        console.log('Intro Text:', response.data.data?.introText);
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

      <div className="bg-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto px-6 py-12 text-center"
        >
          <p className="font-serif text-2xl font-semibold text-red-900">
            Shree Ramchandra Temple — A Living Heritage
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;