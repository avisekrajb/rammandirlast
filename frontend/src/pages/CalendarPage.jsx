import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import {
  ChevronLeft, ChevronRight, CalendarDays, RotateCcw, Sparkles,
  PartyPopper, Sunrise, Sunset, AlertCircle
} from 'lucide-react';
import {
  getBsMonthDays,
  getBsMonthStartWeekday,
  adToBs,
  bsToAd,
  toNepaliDigits,
  WEEKDAYS_SHORT,
  WEEKDAYS,
  BS_MONTHS,
  GREGORIAN_MONTHS,
} from '../utils/nepaliCalendar';

const pad = (n) => String(n).padStart(2, '0');

/* Festival / holiday + panchanga data (Hamro Patro style public calendar API) */
const PATRO_API = 'https://www.usemiti.com/api/calendar';

const CALENDARS = [
  { id: 'bs', labelKey: 'bsCalendar' },
  { id: 'ad', labelKey: 'gregorianCalendar' },
];

/* Nepali and Hindi readers get the Bikram Sambat patro */
const PREFERS_BS = ['ne', 'hi'];

const INK = '#201F23';
const LINE = '#E7E7EB';
const PANEL = '#F7F7F8';

const adKey = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/* Month cache so paging back and forth does not refetch */
const monthCache = new Map();
const inflight = new Map();

const fetchPatroMonth = (bsYear, bsMonth) => {
  const key = `${bsYear}-${bsMonth}`;
  if (monthCache.has(key)) return Promise.resolve(monthCache.get(key));
  if (inflight.has(key)) return inflight.get(key);

  const req = fetch(`${PATRO_API}/${bsYear}/${bsMonth}`)
    .then((res) => {
      if (!res.ok) throw new Error(`patro ${key} -> ${res.status}`);
      return res.json();
    })
    .then((json) => {
      const days = Array.isArray(json?.days) ? json.days : [];
      const byAd = {};
      days.forEach((day) => {
        if (!day?.ad) return;
        byAd[adKey(day.ad.year, day.ad.month, day.ad.day)] = day;
      });
      const entry = { byAd, days, raw: json };
      monthCache.set(key, entry);
      inflight.delete(key);
      return entry;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, req);
  return req;
};

/* Build a calendar grid from a start weekday (0=Sunday) and total days */
function buildGrid(startWeekday, totalDays, labelFn, subFn, decorate) {
  const rows = [];
  let row = [];
  for (let i = 0; i < startWeekday; i++) row.push(null);
  for (let d = 1; d <= totalDays; d++) {
    row.push({
      label: labelFn(d),
      sub: subFn ? subFn(d) : null,
      ...(decorate ? decorate(d) : {}),
    });
    if (row.length === 7) {
      rows.push(row);
      row = [];
    }
  }
  if (row.length) rows.push(row);
  return rows;
}

const MonthGrid = ({ weekdayHeaders, cells }) => (
  <div
    className="rounded-3xl border bg-white overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-[#7A1F2B]/15"
    style={{ borderColor: LINE, boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}
  >
    <div
      className="grid grid-cols-7 border-b"
      style={{ background: 'linear-gradient(180deg,#FBF7F5 0%,#FFFFFF 100%)', borderColor: LINE }}
    >
      {weekdayHeaders.map((d, i) => (
        <div
          key={i}
          className={`text-center py-3.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
            i === 0 ? 'text-vermilion' : 'text-ink-soft'
          }`}
        >
          {d}
        </div>
      ))}
    </div>
    <div>
      {cells.map((row, r) => (
        <div key={r} className="grid grid-cols-7 border-b border-[#F1F1F3] last:border-0">
          {row.map((cell, c) => {
            if (!cell) {
              return <div key={c} className="h-[72px] sm:h-24 border-r border-[#F4F4F6] last:border-r-0 bg-[#FBFBFC]" />;
            }
            const bg = cell.isHoliday
              ? 'rgba(193,68,14,0.05)'
              : cell.isToday
                ? 'rgba(232,169,61,0.10)'
                : 'transparent';
            return (
              <div
                key={c}
                className={`group/cell relative h-[72px] sm:h-24 border-r border-[#F4F4F6] last:border-r-0 flex flex-col items-center justify-center cursor-default transition-all duration-250 hover:z-10 hover:-translate-y-0.5 hover:bg-[#FDF6F4] hover:shadow-lg hover:shadow-[#7A1F2B]/15 ${
                  cell.festival ? 'bg-[#FCF8F6]' : ''
                }`}
                style={{ background: bg }}
              >
                <span className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-vermilion opacity-0 group-hover/cell:opacity-100 transition-opacity duration-250" />
                <span
                  className={`text-sm sm:text-base font-bold leading-none flex items-center justify-center transition-transform duration-250 group-hover/cell:scale-110 ${
                    cell.isToday
                      ? 'bg-vermilion text-white rounded-full w-8 h-8 shadow-md shadow-vermilion/30'
                      : cell.isHoliday
                        ? 'text-vermilion'
                        : 'group-hover/cell:text-[#7A1F2B]'
                  }`}
                  style={!cell.isToday && !cell.isHoliday ? { color: INK } : undefined}
                >
                  {cell.label}
                </span>
                {cell.sub && (
                  <span className="text-[10px] leading-none text-ink-soft/80 mt-0.5">{cell.sub}</span>
                )}
                {cell.festival && (
                  <span
                    className="absolute bottom-1 left-1 right-1 text-center text-[9px] sm:text-[10px] leading-tight font-bold text-maroon/85 truncate px-0.5 rounded group-hover/cell:bg-vermilion group-hover/cell:text-white transition-colors duration-250"
                    title={cell.festival}
                  >
                    {cell.festival}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  </div>
);

const FestivalSidebar = ({
  t, lang, groups, loading, error, todayInfo, monthLabel, daysLeft, nextFestival, slideKey,
}) => (
  <motion.aside
    key={slideKey}
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    className="w-full shrink-0 space-y-5"
  >
    <div
      className="rounded-2xl text-white p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#7A1F2B]/35"
      style={{ background: 'linear-gradient(150deg, #7A1F2B 0%, #5B1420 100%)' }}
    >
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
        <CalendarDays size={13} /> {t.todayDetails || "Today's Details"}
      </div>
      <div className="mt-3 font-serif text-2xl leading-tight">{todayInfo.bsLabel || '—'}</div>
      <div className="text-sm text-white/75 mt-1">{todayInfo.adLabel}</div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-2">
          <div className="text-white/60 uppercase tracking-wider text-[9px]">
            {t.tithi || 'Tithi'}
          </div>
          <div className="font-semibold mt-0.5 truncate">{todayInfo.tithi || '—'}</div>
        </div>
        <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-2">
          <div className="flex items-center gap-1 text-white/60 text-[9px]">
            <Sunrise size={11} /> {t.sunrise || 'Sunrise'}
            <Sunset size={11} className="ml-1" /> {t.sunset || 'Sunset'}
          </div>
          <div className="font-semibold mt-0.5">{todayInfo.sunrise} · {todayInfo.sunset}</div>
        </div>
      </div>

      {todayInfo.isHoliday && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-marigold/25 border border-marigold/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-marigold">
          <Sparkles size={11} /> {t.holiday || 'Holiday'}
        </div>
      )}
    </div>

    {/* Remaining days + next festival */}
    <div className="grid grid-cols-2 gap-3">
      <div
        className="rounded-2xl border bg-white p-5 cursor-default transition-all duration-300 hover:-translate-y-1 hover:border-vermilion/30 hover:shadow-xl hover:shadow-[#7A1F2B]/15"
        style={{ borderColor: LINE, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
      >
        <div className="text-[9px] uppercase tracking-[0.15em] text-ink-soft font-bold">
          {t.daysLeft || 'Days Left'}
        </div>
        <div className="font-serif text-4xl leading-none mt-2.5" style={{ color: '#7A1F2B' }}>
          {daysLeft === null ? '—' : daysLeft}
        </div>
        <div className="text-[10px] text-ink-soft mt-2">{monthLabel}</div>
      </div>

      <div
        className="rounded-2xl border bg-white p-5 flex flex-col cursor-default transition-all duration-300 hover:-translate-y-1 hover:border-vermilion/30 hover:shadow-xl hover:shadow-[#7A1F2B]/15"
        style={{ borderColor: LINE, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
      >
        <div className="text-[9px] uppercase tracking-[0.15em] text-ink-soft font-bold">
          {t.nextFestival || 'Next Festival'}
        </div>
        <div className="text-[13px] font-bold leading-snug mt-2.5 line-clamp-2 transition-colors duration-300" style={{ color: INK }}>
          {nextFestival ? nextFestival.name : '—'}
        </div>
        {nextFestival && (
          <div className="mt-auto pt-2 text-[10px] text-ink-soft">
            {nextFestival.adLabel}
            {typeof nextFestival.inDays === 'number' && (
              <span className="font-bold text-vermilion">
                {' · '}
                {nextFestival.inDays} {t.daysLeftShort || 'days'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>

    <div
      className="rounded-2xl border bg-white overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-[#7A1F2B]/10"
      style={{ borderColor: LINE, boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}
    >
      <div
        className="flex items-center justify-between gap-2 px-5 py-3.5 border-b"
        style={{ background: '#FCFBFA', borderColor: '#EFEFF1' }}
      >
        <div
          className="flex items-center gap-2 font-serif text-base font-bold"
          style={{ color: '#7A0000' }}
        >
          <PartyPopper size={16} className="text-vermilion" />
          {t.festivalsHolidays || 'Festivals & Holidays'}
        </div>
        <span
          className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft rounded-full px-2.5 py-1"
          style={{ background: PANEL }}
        >
          {monthLabel}
        </span>
      </div>

      <div className="max-h-[440px] overflow-y-auto">
        {loading && (
          <div className="p-5 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-11 h-11 rounded-xl shrink-0" style={{ background: PANEL }} />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-3/4 rounded" style={{ background: PANEL }} />
                  <div className="h-2.5 w-1/2 rounded" style={{ background: PANEL }} />
                </div>
              </div>
            ))}
            <p className="text-center text-xs text-ink-soft pt-1">
              {t.loadingFestivals || 'Loading festivals...'}
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="p-6 text-center">
            <AlertCircle size={20} className="mx-auto text-vermilion mb-2" />
            <p className="text-xs text-ink-soft">
              {t.festivalsError || 'Festival list is unavailable right now.'}
            </p>
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="p-8 text-center">
            <PartyPopper size={20} className="mx-auto text-ink-soft/50 mb-2" />
            <p className="text-xs text-ink-soft">
              {t.noFestivals || 'No festivals or holidays in this month.'}
            </p>
          </div>
        )}

        {!loading && !error && groups.length > 0 && (
          <div>
            {groups.map((group, gi) => (
              <section key={group.key}>
                {gi > 0 && <div className="h-px" style={{ background: '#EFEFF1' }} />}
                <div
                  className="sticky top-0 z-10 px-4 py-2 flex items-center justify-between"
                  style={{ background: '#FBFAF9' }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-maroon">
                    {group.label}
                  </span>
                  <span className="text-[10px] text-ink-soft">
                    {group.events.length} {t.festival || 'Festival'}
                  </span>
                </div>
                <ul className="divide-y divide-[#F4F4F6]">
                  {group.events.map((ev) => (
                    <li
                      key={`${group.key}-${ev.key}-${ev.name}`}
                      className="px-4 py-3 flex gap-3 items-start cursor-default transition-all duration-250 hover:bg-[#FDF6F4] hover:pl-5 group/fev"
                    >
                      <div
                        className={`shrink-0 w-11 rounded-xl py-1.5 text-center transition-all duration-300 ${
                          ev.isHoliday
                            ? 'bg-vermilion text-white shadow-md shadow-vermilion/25'
                            : 'bg-[#F5F1EE] text-maroon group-hover/fev:bg-[#7A1F2B] group-hover/fev:text-white'
                        }`}
                      >
                        <div className="text-[9px] uppercase tracking-wider opacity-80">
                          {ev.bsMonthShort}
                        </div>
                        <div className="text-base font-bold leading-none mt-0.5">{ev.bsDay}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold leading-snug break-words transition-colors duration-300 group-hover/fev:text-[#7A1F2B]" style={{ color: INK }}>
                          {ev.name}
                        </p>
                        <p className="text-[11px] text-ink-soft mt-0.5">
                          {ev.adLabel}
                          {ev.tithi ? ` · ${ev.tithi}` : ''}
                        </p>
                      </div>
                      {ev.isHoliday ? (
                        <span className="shrink-0 mt-0.5 text-[9px] font-bold uppercase tracking-wider text-vermilion bg-vermilion/10 rounded-full px-2 py-0.5">
                          {t.holiday || 'Holiday'}
                        </span>
                      ) : typeof ev.inDays === 'number' ? (
                        <span className="shrink-0 mt-0.5 text-[9px] font-semibold text-ink-soft bg-panel rounded-full px-2 py-0.5">
                          {ev.inDays} {t.daysLeftShort || 'days'}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>

    <p className="text-[10px] leading-relaxed text-ink-soft/70 px-1">
      {PREFERS_BS.includes(lang)
        ? 'पर्व, बिदा र पञ्चाङ्कको जानकारी हाम्रो पात्रो API बाट।'
        : 'Festivals, holidays and panchanga details are served by the Hamro Patro public calendar API.'}
    </p>
  </motion.aside>
);

const CalendarPage = () => {
  const { t, lang } = useLanguage();
  const today = useMemo(() => new Date(), []);

  const [calendar, setCalendar] = useState(() => (PREFERS_BS.includes(lang) ? 'bs' : 'ad'));
  const [cursor, setCursor] = useState(() => new Date());
  const [patro, setPatro] = useState({ status: 'idle', byAd: {}, months: {} });

  useEffect(() => {
    setCalendar(PREFERS_BS.includes(lang) ? 'bs' : 'ad');
  }, [lang]);

  /* Step one month in the calendar that is currently on screen */
  const changeMonth = (delta) => {
    setCursor((prev) => {
      if (calendar === 'bs') {
        const bs = adToBs(prev);
        if (!bs) return prev;
        let y = bs.year;
        let m = bs.month + delta;
        while (m > 12) { m -= 12; y += 1; }
        while (m < 1) { m += 12; y -= 1; }
        const first = bsToAd(y, m, 1);
        return first ? new Date(first.getUTCFullYear(), first.getUTCMonth(), 1) : prev;
      }
      return new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
    });
  };

  /* Always land on the patro of today */
  const goToday = () => setCursor(new Date());

  const switchCalendar = (id) => {
    setCalendar(id);
    setCursor(new Date());
  };

  const weekdayShort = WEEKDAYS_SHORT[lang] || WEEKDAYS_SHORT.en;
  const weekdayFull = WEEKDAYS[lang] || WEEKDAYS.en;

  /*
   * The mini sidebar always starts at the month on screen (the current month
   * when the page opens) and then continues month after month, in order.
   */
  const SIDEBAR_MONTHS = 4;

  const sidebarMonths = useMemo(() => {
    const base = adToBs(cursor) || adToBs(today);
    if (!base) return [];
    const out = [];
    let y = base.year;
    let m = base.month;
    for (let i = 0; i < SIDEBAR_MONTHS; i++) {
      out.push({ year: y, month: m });
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }
    return out;
  }, [cursor, today]);

  const neededKey = sidebarMonths.map((m) => `${m.year}-${m.month}`).join('|');

  useEffect(() => {
    if (!sidebarMonths.length) {
      setPatro({ status: 'idle', byAd: {}, months: {} });
      return undefined;
    }
    let alive = true;
    setPatro((prev) => ({ ...prev, status: 'loading' }));

    Promise.all(
      sidebarMonths.map((m) =>
        fetchPatroMonth(m.year, m.month).catch(() => ({ byAd: {}, days: [] }))
      )
    )
      .then((entries) => {
        if (!alive) return;
        const byAd = {};
        const months = {};
        entries.forEach((e, i) => {
          Object.assign(byAd, e.byAd || {});
          const { year, month } = sidebarMonths[i];
          months[`${year}-${month}`] = e;
        });
        const got = entries.some((e) => e.days && e.days.length > 0);
        setPatro({ status: got ? 'ready' : 'error', byAd, months });
      })
      .catch(() => {
        if (alive) setPatro({ status: 'error', byAd: {}, months: {} });
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [neededKey]);

  const byAd = useMemo(() => patro.byAd || {}, [patro.byAd]);

  const lookup = useCallback((y, m, d) => byAd[adKey(y, m + 1, d)] || null, [byAd]);

  const eventName = useCallback(
    (event) => (lang === 'en' ? event?.en : event?.np) || event?.en || event?.np || '',
    [lang]
  );

  const monthNames = BS_MONTHS[lang] || BS_MONTHS.en;
  const gregNames = GREGORIAN_MONTHS[lang] || GREGORIAN_MONTHS.en;

  const todayInfo = useMemo(() => {
    const bs = adToBs(today);
    const rec = lookup(today.getFullYear(), today.getMonth(), today.getDate());
    return {
      bsLabel: bs ? `${toNepaliDigits(bs.day)} ${monthNames[bs.month - 1]} ${toNepaliDigits(bs.year)}` : '',
      adLabel: today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      tithi: (lang === 'en' ? rec?.tithiEn : rec?.tithiNp) || '—',
      sunrise: rec?.sunrise || '—',
      sunset: rec?.sunset || '—',
      isHoliday: !!rec?.isHoliday,
    };
  }, [lang, monthNames, lookup, today]);

  const data = useMemo(() => {
    if (calendar === 'bs') {
      const bs = adToBs(cursor);
      if (!bs) return null;
      const { year, month } = bs;
      const cells = buildGrid(
        getBsMonthStartWeekday(year, month),
        getBsMonthDays(year, month),
        (d) => toNepaliDigits(d),
        (d) => {
          const ad = bsToAd(year, month, d);
          return ad ? pad(ad.getUTCDate()) : null;
        },
        (d) => {
          const ad = bsToAd(year, month, d);
          if (!ad) return {};
          const rec = lookup(ad.getUTCFullYear(), ad.getUTCMonth(), ad.getUTCDate());
          const event = (rec?.events || [])[0];
          return {
            isToday: isSameDay(ad, today),
            isHoliday: !!rec?.isHoliday || !!event?.isHoliday,
            festival: eventName(event),
          };
        }
      );
      return {
        title: `${toNepaliDigits(year)} ${monthNames[month - 1]}`,
        subtitle: t.bsCalendar || 'Bikram Sambat',
        cells,
        bsYear: year,
        bsMonth: month,
      };
    }

    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const cells = buildGrid(
      new Date(y, m, 1).getDay(),
      new Date(y, m + 1, 0).getDate(),
      (d) => String(d),
      (d) => {
        const rec = lookup(y, m, d);
        return rec?.bsDay ? toNepaliDigits(rec.bsDay) : null;
      },
      (d) => {
        const rec = lookup(y, m, d);
        const event = (rec?.events || [])[0];
        return {
          isToday: isSameDay(new Date(y, m, d), today),
          isHoliday: !!rec?.isHoliday || !!event?.isHoliday,
          festival: eventName(event),
        };
      }
    );
    return {
      title: `${gregNames[m]} ${y}`,
      subtitle: t.gregorianCalendar || 'Gregorian Calendar',
      cells,
      bsYear: null,
      bsMonth: null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendar, cursor, lang, byAd, monthNames, gregNames]);

  /*
   * Festival + holiday groups, month after month, in date order.
   * The day list comes straight from the patro API so nothing is dropped even
   * where the local BS month-length table disagrees with the published patro.
   */
  const festivalGroups = useMemo(() => {
    const short = monthNames.map((m) => m.slice(0, 4));
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const months = patro.months || {};

    return sidebarMonths.map(({ year, month }) => {
      const entry = months[`${year}-${month}`];
      const source =
        entry?.days?.length
          ? entry.days
          : Array.from({ length: getBsMonthDays(year, month) }, (_, i) => {
              const d = i + 1;
              const ad = bsToAd(year, month, d);
              return ad
                ? {
                    bsDay: d,
                    ad: {
                      year: ad.getUTCFullYear(),
                      month: ad.getUTCMonth() + 1,
                      day: ad.getUTCDate(),
                    },
                    events: [],
                  }
                : null;
            }).filter(Boolean);

      const events = [];
      source.forEach((rec) => {
        (rec?.events || []).forEach((event) => {
          const name = eventName(event);
          if (!name || !rec.ad) return;
          const adDate = new Date(rec.ad.year, rec.ad.month - 1, rec.ad.day);
          events.push({
            key: `${year}-${month}-${rec.bsDay}-${name}`,
            bsDay: toNepaliDigits(rec.bsDay),
            bsMonthShort: short[month - 1] || '',
            name,
            adLabel: adDate.toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            tithi: (lang === 'en' ? rec.tithiEn : rec.tithiNp) || '',
            isHoliday: !!event.isHoliday || !!rec.isHoliday,
            inDays: Math.round((adDate.getTime() - startOfToday) / 86400000),
            sort: adDate.getTime(),
          });
        });
      });

      return {
        key: `${year}-${month}`,
        label: `${monthNames[month - 1]} ${toNepaliDigits(year)}`,
        days: source.length,
        events: events.sort((a, b) => a.sort - b.sort),
      };
    });
  }, [sidebarMonths, patro.months, lang, monthNames, eventName, today]);

  /* Total days in the month on screen (published patro wins over the local table) */
  const monthDayCount = useMemo(() => {
    if (calendar === 'bs' && data?.bsYear) {
      const key = `${data.bsYear}-${data.bsMonth}`;
      const entry = patro.months?.[key];
      if (entry?.days?.length) return entry.days.length;
      return getBsMonthDays(data.bsYear, data.bsMonth);
    }
    return new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  }, [calendar, data, cursor, patro.months]);

  /* Days left in the month that is currently on screen */
  const daysLeft = useMemo(() => {
    if (!data) return null;
    if (calendar === 'bs') {
      const bs = adToBs(today);
      if (!bs) return null;
      if (bs.year !== data.bsYear || bs.month !== data.bsMonth) return 0;
      return monthDayCount - bs.day;
    }
    if (today.getFullYear() !== cursor.getFullYear() || today.getMonth() !== cursor.getMonth()) {
      return 0;
    }
    return monthDayCount - today.getDate();
  }, [data, calendar, cursor, today, monthDayCount]);

  /* The next festival or holiday that is still ahead of today */
  const nextFestival = useMemo(() => {
    for (const g of festivalGroups) {
      const hit = g.events.find((e) => e.inDays >= 0);
      if (hit) return hit;
    }
    return null;
  }, [festivalGroups]);

  return (
    <div className="min-h-screen bg-slate-50 pt-28 sm:pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight" style={{ color: '#7A1F2B' }}>
            {t.calendarTitle || 'Shree Ramchandra Mandir Calendar'}
          </h1>
          <div className="w-24 h-1 mx-auto mt-5 rounded-full" style={{ background: 'linear-gradient(90deg,#7A1F2B,#C1440E)' }} />
          <p className="mt-5 text-ink-soft text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {t.calendarSubtitle ||
              'Nepali Bikram Sambat calendar with festivals and public holidays, in your language.'}
          </p>
        </div>

        {/* Toolbar */}
        <div
          className="rounded-3xl p-4 sm:p-5 mb-8 flex flex-col lg:flex-row lg:items-center gap-4 transition-all duration-300 hover:shadow-2xl hover:shadow-[#7A1F2B]/20 hover:-translate-y-1"
          style={{
            background: 'linear-gradient(135deg, #7A1F2B 0%, #6B0F1E 55%, #4A0000 100%)',
            boxShadow: '0 18px 40px -18px rgba(122,31,43,0.55)',
          }}
        >
          <div className="flex items-center justify-center lg:justify-start gap-2.5">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label={t.prevMonth || 'Previous'}
              className="w-11 h-11 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white hover:text-[#7A1F2B] active:scale-90 transition-all flex items-center justify-center"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={goToday}
              className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-white text-[#7A1F2B] font-bold text-sm hover:bg-marigold hover:shadow-lg hover:shadow-black/20 active:scale-95 transition-all"
            >
              <RotateCcw size={14} /> {t.today || 'Today'}
            </button>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label={t.nextMonth || 'Next'}
              className="w-11 h-11 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white hover:text-[#7A1F2B] active:scale-90 transition-all flex items-center justify-center"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex-1 text-center lg:text-left min-w-0">
            <div className="font-serif text-2xl sm:text-3xl font-bold truncate text-white">
              {data?.title || '—'}
            </div>
            <div className="text-sm text-white/70 mt-0.5">{data?.subtitle}</div>
          </div>

          <div className="inline-flex self-center p-1.5 rounded-full bg-black/25 border border-white/15">
            {CALENDARS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => switchCalendar(c.id)}
                className={`relative px-5 h-9 rounded-full text-sm font-bold transition-all duration-300 ${
                  calendar === c.id ? 'text-[#7A1F2B]' : 'text-white/70 hover:text-white'
                }`}
              >
                {calendar === c.id && (
                  <motion.span
                    layoutId="cal-switch"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-white shadow-md"
                  />
                )}
                <span className="relative z-10">{t[c.labelKey] || c.labelKey}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Grid (70%) + right mini sidebar (30%) */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="w-full min-w-0 lg:basis-[70%] lg:flex-1">
            {data ? (
              <>
                <MonthGrid weekdayHeaders={weekdayShort} cells={data.cells} />
                <p className="text-xs text-ink-soft/70 text-center mt-5">
                  {t.todayIs || 'Today:'} {todayInfo.adLabel} — {weekdayFull[today.getDay()]}
                </p>
              </>
            ) : (
              <div className="text-center text-ink-soft py-16">
                {t.noData || 'No data available for the selected month.'}
              </div>
            )}
          </div>

          <div className="w-full lg:basis-[30%] lg:max-w-[360px]">
            <div className="lg:sticky lg:top-28">
              <FestivalSidebar
                t={t}
                lang={lang}
                groups={festivalGroups}
                loading={patro.status === 'loading'}
                error={patro.status === 'error'}
                todayInfo={todayInfo}
                monthLabel={t.thisMonth || 'This Month'}
                daysLeft={daysLeft}
                nextFestival={nextFestival}
                slideKey={`${calendar}-${neededKey}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
