// pages/HistoryPage.jsx - Updated: counting numbers + Clock icon removed
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import OmLoader from '../components/common/OmLoader';
import PageHeader from '../components/common/PageHeader';
import getLocalizedYear from '../utils/localizedYear';

// Helper to get localized text
const getLocalizedText = (obj, lang) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || '';
};

const pageTitle = {
  ne: 'श्रीरामचन्द्रमन्दिरको इतिहास',
  en: 'History of Shree Ramchandra Temple',
  hi: 'श्रीरामचन्द्रमन्दिर का इतिहास',
  zh: '罗摩钱德拉神庙的历史',
  ta: 'ஸ்ரீ ராமச்சந்திர கோயிலின் வரலாறு',
};

// ===== TIMELINE COMPONENT =====
function TimelineSection({ items, lang, heading }) {
  if (!items || items.length === 0) return null;

  const filteredItems = items.filter(item => item.enabled !== false);

  if (filteredItems.length === 0) return null;

  return (
    <div className="pt-32 sm:pt-36 pb-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {heading && (
          <div className="mb-12 sm:mb-14">
            <PageHeader>{heading}</PageHeader>
          </div>
        )}
        <div className="space-y-24">
          {filteredItems.map((item, index) => {
            const titleText =
              getLocalizedText(item.title, lang) ||
              getLocalizedText(item.period, lang) ||
              getLocalizedText(item.desc, lang);
            const descText = getLocalizedText(item.desc, lang) || '';
            const periodText = getLocalizedText(item.period, lang) || '';
            const imageSrc = item.photo || '';

            // paragraphs is a list; older records stored a fixed { p1..p4 } object
            const paragraphs = Array.isArray(item.paragraphs)
              ? item.paragraphs.map((p) => getLocalizedText(p, lang)).filter(Boolean)
              : item.paragraphs && typeof item.paragraphs === 'object'
                ? Object.keys(item.paragraphs)
                    .filter((k) => /^p\d+$/i.test(k))
                    .sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10))
                    .map((k) => getLocalizedText(item.paragraphs[k], lang))
                    .filter(Boolean)
                : [];
            if (paragraphs.length === 0 && descText) paragraphs.push(descText);

            const listTitleText = getLocalizedText(item.listTitle, lang);
            const points = Array.isArray(item.points)
              ? item.points.map((p) => getLocalizedText(p, lang)).filter(Boolean)
              : [];
            const yearEntries = Array.isArray(item.entries)
              ? item.entries
                  .map((e) => ({ year: getLocalizedYear(e.year, lang), text: getLocalizedText(e.text, lang) }))
                  .filter((e) => e.text || e.year)
              : [];

            return (
              <motion.div
                key={item._id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                className={`grid md:grid-cols-2 gap-10 lg:gap-16 items-center ${
                  index % 2 !== 0 ? 'md:[&>*:first-child]:order-2' : ''
                }`}
              >
                <motion.div
                  className="rounded-xl overflow-hidden shadow-2xl relative min-h-[300px]"
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Glowing Gas/Aura effect container */}
                  <div className="relative w-full h-80 rounded-xl overflow-hidden">
                    {/* Outer glow layer - yellow/golden gas effect */}
                    <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-yellow-400/30 via-amber-400/40 to-yellow-500/30 blur-2xl animate-pulse" />

                    {/* Second glow layer for more gas effect */}
                    <div className="absolute -inset-2 rounded-xl bg-gradient-to-tr from-amber-300/20 via-yellow-200/30 to-orange-300/20 blur-xl" />

                    {/* Inner glow layer */}
                    <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-yellow-500/20 via-amber-400/20 to-yellow-600/20 blur-lg" />

                    {/* Image container with border */}
                    <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-[#8B3A3A] shadow-[0_0_40px_rgba(255,200,0,0.15)]">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={titleText}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            const fallback = document.createElement('div');
                            fallback.className = 'w-full h-full flex items-center justify-center bg-gradient-to-br from-maroon/20 to-maroon-deep/20';
                            fallback.innerHTML = '<span class="text-ink-soft/30 text-4xl font-serif">🕉️</span>';
                            parent.appendChild(fallback);
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-maroon/10 to-maroon-deep/10">
                          <span className="text-4xl text-ink-soft/20">🕉️</span>
                        </div>
                      )}
                      {item.year && (
                        <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-lg text-xs font-bold z-10">
                          {getLocalizedYear(item.year, lang)}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                <div className="flex flex-col justify-center space-y-4">
                  {/* Period row — counting number and clock icon removed */}
                  {periodText && (
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-px bg-maroon/20" />
                      <span className="text-sm text-ink-soft font-medium tracking-wide">
                        {periodText}
                      </span>
                    </div>
                  )}
                  <h2 className="font-serif text-2xl sm:text-3xl text-maroon font-bold leading-tight">
                    {titleText}
                  </h2>

                  {paragraphs.map((text, pi) => (
                    <p key={pi} className="text-ink-soft leading-relaxed text-base sm:text-lg text-justify">
                      {text}
                    </p>
                  ))}

                  {points.length > 0 && (
                    <div>
                      {listTitleText && (
                        <p className="font-semibold text-base text-maroon mb-3">{listTitleText}</p>
                      )}
                      <ul className="space-y-2">
                        {points.map((point, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span
                              className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full"
                              style={{ background: 'linear-gradient(135deg, #E8A93D, #C1440E)' }}
                            />
                            <span className="text-ink-soft leading-relaxed text-base">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {yearEntries.length > 0 && (
                    <ul className="mt-1 space-y-2.5">
                      {yearEntries.map((entry, ei) => (
                        <li key={ei} className="flex items-start gap-3">
                          <span
                            className="shrink-0 mt-0.5 rounded-md bg-maroon/10 text-maroon text-[11px] font-bold px-2 py-1 whitespace-nowrap min-w-[76px] text-center"
                          >
                            {entry.year}
                          </span>
                          <span className="text-ink-soft leading-relaxed text-base text-justify">
                            {entry.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


// ===== MAIN HISTORY PAGE =====
const HistoryPage = () => {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState([]);
  const fetched = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get('/admin/history');
      const historyItems = response.data || [];
      const sorted = historyItems
        .filter(item => item.enabled !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setHistoryData(sorted);
    } catch (error) {
      console.error('Error fetching history data:', error);
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <OmLoader size="lg" color="vermilion" className="mx-auto mb-4" />
          <p className="text-ink-soft text-sm">
            {lang === 'ne' ? 'इतिहास लोड हुँदैछ...' : lang === 'hi' ? 'इतिहास लोड हो रहा है...' : lang === 'zh' ? '正在加载历史...' : lang === 'ta' ? 'வரலாறு ஏற்றப்படுகிறது...' : 'Loading history...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        background: '#ffffff'
      }}
    >
      {/* Timeline */}
      <TimelineSection
        items={historyData}
        lang={lang}
        heading={getLocalizedText(pageTitle, lang)}
      />
    </div>
  );
};

export default HistoryPage;