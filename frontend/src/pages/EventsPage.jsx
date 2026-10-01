import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { handleImageError } from '../utils/imageFallback';
import OmLoader from '../components/common/OmLoader';
import PageHeader from '../components/common/PageHeader';
import SectionTitle from '../components/common/SectionTitle';

const getLocalizedText = (obj, lang) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || obj.ne || '';
};

// paragraphs is a free-length list; older records stored a fixed { p1..p4 } object
const readParagraphs = (raw, lang) => {
  if (Array.isArray(raw)) return raw.map((p) => getLocalizedText(p, lang)).filter(Boolean);
  if (raw && typeof raw === 'object') {
    return Object.keys(raw)
      .filter((k) => /^p\d+$/i.test(k))
      .sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10))
      .map((k) => getLocalizedText(raw[k], lang))
      .filter(Boolean);
  }
  return [];
};

const ACCENT = '#7A0000';
const ACCENT_2 = '#C1440E';

// Fallbacks used when Admin → Events has not published a row for a slot yet.
const TEXT_FALLBACK = {
  'page-title': { ne: 'आयोजना तथा कार्यक्रम', en: 'Events and Programs' },
  'page-subtitle': { ne: 'मन्दिरमा नियमित रूपमा सञ्चालन हुने कार्यक्रमहरूको विवरण।', en: 'Details of the programs regularly conducted at the temple.' },
  'festivals-title': { ne: 'पर्व तथा उत्सव', en: 'Festivals and Events' },
  'programs-title': { ne: 'आयोजन गरिने कार्यक्रमहरू', en: 'Programs Conducted' },
  'footer-note': { ne: 'कार्यक्रमको विवरणमा परिवर्तन हुन सक्छ।', en: 'Program details are subject to change.' },
};

const buildTextLookup = (rows) => {
  const map = {};
  (Array.isArray(rows) ? rows : [])
    .filter((r) => r && r.enabled !== false && r.key)
    .forEach((r) => {
      map[r.key] = r.text;
    });
  return map;
};

const readSlot = (map, key, lang) => {
  const custom = map[key];
  const text = getLocalizedText(custom, lang);
  if (text) return text;
  return getLocalizedText(TEXT_FALLBACK[key], lang);
};

/* ===== पर्वहरू — festivals added from Admin → Events =====================
 * Dated, photographed announcements. Kept as cards because they carry an
 * image and a calendar date, unlike the standing programs below.
 * ====================================================================== */
const FestivalCards = ({ events, lang, title }) => {
  if (!events || events.length === 0) return null;

  return (
    <section className="w-full">
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-4">
        <SectionTitle>{title}</SectionTitle>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {events.map((e, i) => {
            const title = getLocalizedText(e.title, lang);
            const desc = getLocalizedText(e.desc, lang);
            const dateNepali = getLocalizedText(e.dateNepali, lang);

            return (
              <motion.article
                key={e._id || i}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="group relative flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-gray-100 shadow-[0_2px_4px_rgba(15,23,42,0.04),0_16px_36px_-20px_rgba(15,23,42,0.25)] hover:ring-[#7A0000]/25 hover:shadow-[0_28px_56px_-24px_rgba(122,0,0,0.5)] hover:-translate-y-2 transition-all duration-500"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={e.photo || '/default-event.jpg'}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                       onError={(ev) => { handleImageError(ev, '/default-event.jpg'); }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)' }}
                  />
                  {dateNepali && (
                    <span className="absolute bottom-4 left-4 px-3 py-1 rounded-full text-[11px] font-bold bg-white/95 text-[#7A0000] shadow-md">
                      {dateNepali}
                    </span>
                  )}

                  {/* Home page position set in Admin -> Events, same number as the home page */}
                  {(e.homeSlot || 0) > 0 && (
                    <div className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md border-2 border-white/90"
                      style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})` }}>
                      {e.homeSlot}
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink leading-snug transition-colors duration-300 group-hover:text-[#7A0000]">
                    {title}
                  </h3>
                  <div className="h-px w-12 mt-3 mb-3 transition-all duration-500 group-hover:w-20" style={{ background: `${ACCENT}40` }} />
                  {desc && (
                    <p className="text-base text-mute leading-[1.85] text-justify line-clamp-4">
                      {desc}
                    </p>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ===== आयोजन गरिने कार्यक्रमहरू =========================================
 * The published program text, laid out as two 50% columns of plain prose.
 * Hovering a program tints the block and pushes its rule across.
 * ====================================================================== */
const ProgramsText = ({ events, lang, title }) => {
  const isNe = lang === 'ne';

  const items = useMemo(
    () =>
      (events || [])
        .map((e, i) => ({
          key: e._id || e.seedKey || i,
          title: getLocalizedText(e.title, lang),
          period: getLocalizedText(e.period, lang),
          year: e.yearText || '',
          desc: getLocalizedText(e.desc, lang),
          paragraphs: readParagraphs(e.paragraphs, lang),
          listTitle: getLocalizedText(e.listTitle, lang),
          points: (e.points || []).map((p) => getLocalizedText(p, lang)).filter(Boolean),
        }))
        .filter((x) => x.title || x.desc || x.paragraphs.length || x.points.length),
    [events, lang]
  );

  if (items.length === 0) return null;

  const half = Math.ceil(items.length / 2);
  const columns = [items.slice(0, half), items.slice(half)];

  const renderItem = (item, index) => (
    <motion.article
      key={item.key}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: (index % half) * 0.06 }}
      className="group relative pl-6 pr-2 py-6 rounded-r-2xl transition-all duration-400 hover:bg-gradient-to-r hover:from-[#7A0000]/[0.055] hover:to-transparent hover:shadow-[0_18px_40px_-28px_rgba(122,0,0,0.5)] hover:-translate-y-1"
    >
      {/* accent rail grows on hover */}
      <span
        className="absolute left-0 top-6 bottom-6 w-[3px] rounded-full transition-all duration-400"
        style={{ background: `linear-gradient(180deg, ${ACCENT}, ${ACCENT_2})` }}
      />

      <h3 className="font-serif text-2xl sm:text-[28px] font-bold text-ink leading-snug transition-colors duration-300 group-hover:text-[#7A0000]">
        <span className="text-[#7A0000]/35 font-mono text-base sm:text-lg mr-2 align-middle">
          {String(index + 1).padStart(2, '0')}
        </span>
        {item.title}
      </h3>

      {(item.period || item.year) && (
        <p className="mt-2.5 inline-block text-sm sm:text-base text-[#7A0000] font-semibold">
          {item.period}
          {item.period && item.year ? '  ·  ' : ''}
          {item.year && `${isNe ? 'वर्ष' : 'Year'} ${item.year}`}
        </p>
      )}

      {item.desc && (
        <p className="mt-4 text-lg sm:text-xl text-ink-soft leading-[1.95] text-justify">
          {item.desc}
        </p>
      )}

      {item.paragraphs.map((text, pi) => (
        <p key={pi} className="mt-3 text-lg sm:text-xl text-ink-soft leading-[1.95] text-justify">
          {text}
        </p>
      ))}

      {item.listTitle && (
        <p className="mt-7 font-serif text-xl sm:text-2xl font-bold text-[#7A0000]">
          {item.listTitle}
        </p>
      )}

      {item.points.length > 0 && (
        <ul className="mt-3.5 space-y-2.5">
          {item.points.map((point, pi) => (
            <li key={pi} className="flex items-start gap-3 transition-transform duration-300 group-hover:translate-x-0.5">
              <span
                className="shrink-0 mt-3.5 w-2 h-2 rounded-full"
                style={{ background: `linear-gradient(135deg, #E8A93D, ${ACCENT_2})` }}
              />
              <span className="text-lg sm:text-xl text-ink-soft leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.article>
  );

  return (
    <section className="w-full">
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-24">
        <SectionTitle>{title}</SectionTitle>

        <div className="grid lg:grid-cols-2 gap-x-14 gap-y-2 mt-12">
          {columns.map((col, ci) => (
            <div key={ci}>
              {col.map((item) => renderItem(item, items.indexOf(item)))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Main Events Page
const EventsPage = () => {
  const { lang } = useLanguage();
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const [eventsRes, settingsRes] = await Promise.all([
          api.get('/events'),
          api.get('/admin/settings').catch(() => null),
        ]);
        const payload = eventsRes.data;
        setEvents(Array.isArray(payload) ? payload : payload?.data || []);
        setSettings(settingsRes?.data || null);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const { seeded, adminAdded } = useMemo(() => {
    const byOrder = (a, b) => {
      const oa = a.order ?? 999;
      const ob = b.order ?? 999;
      if (oa !== ob) return oa - ob;
      return new Date(a.date) - new Date(b.date);
    };
    // Admin-placed home page positions (1-4) come first, in that exact order, so
    // the number on a card means the same thing here as on the home page.
    // Everything else keeps the existing date order.
    const byHomeSlotThenDate = (a, b) => {
      const sa = a.homeSlot || 0;
      const sb = b.homeSlot || 0;
      if (sa !== sb) {
        if (sa < 1) return 1;
        if (sb < 1) return -1;
        return sa - sb;
      }
      return new Date(a.date) - new Date(b.date);
    };
    return {
      seeded: events.filter((e) => e.seedKey).sort(byOrder),
      adminAdded: events.filter((e) => !e.seedKey).sort(byHomeSlotThenDate),
    };
  }, [events]);

  const pageText = useMemo(() => buildTextLookup(settings?.eventsPageText), [settings]);
  const txt = (key) => readSlot(pageText, key, lang);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <OmLoader size="lg" color="vermilion" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Heading */}
      <section className="w-full pt-28 sm:pt-32 pb-6">
        <div className="max-w-7xl mx-auto px-6">
          <PageHeader>{txt('page-title')}</PageHeader>
        </div>
      </section>

      <FestivalCards events={adminAdded} lang={lang} title={txt('festivals-title')} />

      <ProgramsText events={seeded} lang={lang} title={txt('programs-title')} />
    </div>
  );
};

export default EventsPage;
