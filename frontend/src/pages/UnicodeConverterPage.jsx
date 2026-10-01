import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import {
  NEPALI_MONTH_ORDER,
  BS_MONTH_DAYS,
  getBsMonthDays,
  isValidBsDate,
  bsToAd,
  adToBs,
  toNepaliDigits,
  WEEKDAYS,
  BS_MONTHS,
} from '../utils/nepaliCalendar';
import {
  preetiToUnicode,
  unicodeToPreeti,
  romanToDevanagari,
  romanToTamil,
  englishToChinese,
} from '../utils/unicodeConvert';
import PageHeader from '../components/common/PageHeader';

const BS_YEARS = Object.keys(BS_MONTH_DAYS).map(Number);

const ACCENT = '#7A0000';
const ACCENT_2 = '#C1440E';

const TEXT_MODES = [
  { id: 'en-ne', label: 'English → नेपाली', from: 'en', to: 'ne' },
  { id: 'en-preeti', label: 'English → Preeti', from: 'en', to: 'preeti' },
  { id: 'preeti-ne', label: 'Preeti → Unicode', from: 'preeti', to: 'ne' },
  { id: 'ne-preeti', label: 'Unicode → Preeti', from: 'ne', to: 'preeti' },
  { id: 'en-hi', label: 'English → हिन्दी', from: 'en', to: 'hi' },
  { id: 'en-ta', label: 'English → தமிழ்', from: 'en', to: 'ta' },
  { id: 'en-zh', label: 'English → 中文', from: 'en', to: 'zh' },
];

const CURRENCIES = [
  { code: 'NPR', name: 'Nepalese Rupee', nameNe: 'नेपाली रुपैयाँ', country: 'NP', flag: '🇳🇵' },
  { code: 'USD', name: 'US Dollar', nameNe: 'अमेरिकी डलर', country: 'US', flag: '🇺🇸' },
  { code: 'INR', name: 'Indian Rupee', nameNe: 'भारतीय रुपैयाँ', country: 'IN', flag: '🇮🇳' },
  { code: 'CNY', name: 'Chinese Yuan', nameNe: 'चिनियाँ युयान', country: 'CN', flag: '🇨🇳' },
  { code: 'EUR', name: 'Euro', nameNe: 'युरो', country: 'EU', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', nameNe: 'ब्रिटिश पाउन्ड', country: 'GB', flag: '🇬🇧' },
  { code: 'AUD', name: 'Australian Dollar', nameNe: 'अस्ट्रेलियन डलर', country: 'AU', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', nameNe: 'क्यानेडियन डलर', country: 'CA', flag: '🇨🇦' },
  { code: 'JPY', name: 'Japanese Yen', nameNe: 'जापानी येन', country: 'JP', flag: '🇯🇵' },
  { code: 'KRW', name: 'South Korean Won', nameNe: 'दक्षिण कोरियन वोन', country: 'KR', flag: '🇰🇷' },
  { code: 'SGD', name: 'Singapore Dollar', nameNe: 'सिङ्गापुर डलर', country: 'SG', flag: '🇸🇬' },
  { code: 'MYR', name: 'Malaysian Ringgit', nameNe: 'मलेशियन रिङ्गिट', country: 'MY', flag: '🇲🇾' },
  { code: 'THB', name: 'Thai Baht', nameNe: 'थाई बाहत', country: 'TH', flag: '🇹🇭' },
  { code: 'PKR', name: 'Pakistani Rupee', nameNe: 'पाकिस्तानी रुपैयाँ', country: 'PK', flag: '🇵🇰' },
  { code: 'BDT', name: 'Bangladeshi Taka', nameNe: 'बङ्गाली टका', country: 'BD', flag: '🇧🇩' },
  { code: 'LKR', name: 'Sri Lankan Rupee', nameNe: 'श्रीलङ्काली रुपैयाँ', country: 'LK', flag: '🇱🇰' },
  { code: 'AED', name: 'UAE Dirham', nameNe: 'युएई दिरहम', country: 'AE', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', nameNe: 'सऊदी रियाल', country: 'SA', flag: '🇸🇦' },
  { code: 'QAR', name: 'Qatari Riyal', nameNe: 'कतार रियाल', country: 'QA', flag: '🇶🇦' },
  { code: 'MMK', name: 'Myanmar Kyat', nameNe: 'म्यानमार क्याट', country: 'MM', flag: '🇲🇲' },
];

const RATE_CACHE_KEY = 'cc_rates_npr';
const RATE_TTL = 30 * 60 * 1000;
const AUTO_REFRESH = 10 * 60 * 1000;

const pad = (n) => String(n).padStart(2, '0');

const loadStored = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};
const storeValue = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
};

async function fetchRates() {
  const res = await fetch('https://open.er-api.com/v6/latest/NPR');
  if (!res.ok) throw new Error('Rate provider unavailable');
  const data = await res.json();
  if (data.result !== 'success' || !data.rates) throw new Error('Rate provider returned no data');
  return { rates: data.rates, updated: Date.now() };
}

const fmtNum = (value, max = 4) => {
  if (value == null || !isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 0.0001 || abs >= 1e9)) return value.toExponential(2);
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: max });
};

const fmtAmount = (value) => {
  if (value == null || !isFinite(value)) return '—';
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs < 0.01) return value.toFixed(6).replace(/0+$/, '');
  if (abs < 1) return value.toFixed(4);
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const daysInAdMonth = (year, month) => new Date(year, month, 0).getDate();
const adMonthName = (month) => [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
][month - 1] || '';

/* ═══ div · date ══════════════════════════════════════════════════════════ */
function DateDiv({ t, lang }) {
  const { showToast } = useToast();
  const today = useMemo(() => new Date(), []);
  const todayBs = useMemo(() => adToBs(today), [today]);

  const storedAd = loadStored('uc_date_ad', null);
  const storedBs = loadStored('uc_date_bs', null);

  // Inputs are the single source of truth. Both start from the same saved pair
  // so the two panels never disagree on first paint.
  const startBs = storedBs ?? (todayBs ? { year: todayBs.year, month: todayBs.month, day: todayBs.day } : null);
  const startAd = storedAd ?? (startBs
    ? (() => {
        const d = bsToAd(startBs.year, startBs.month, startBs.day);
        return d ? { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() } : null;
      })()
    : { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() });

  const [adYear, setAdYear] = useState(startAd.year);
  const [adMonth, setAdMonth] = useState(startAd.month);
  const [adDay, setAdDay] = useState(Math.min(startAd.day, daysInAdMonth(startAd.year, startAd.month)));

  const [bsYear, setBsYear] = useState(startBs?.year ?? 2080);
  const [bsMonth, setBsMonth] = useState(startBs?.month ?? 1);
  const [bsDay, setBsDay] = useState(startBs?.day ?? 1);

  const bsDayCount = getBsMonthDays(bsYear, bsMonth);

  // Clamp the AD day whenever the month or year changes so 31 Feb can never appear.
  const changeAdMonth = (m) => {
    const next = Number(m);
    setAdMonth(next);
    setAdDay((d) => Math.min(d, daysInAdMonth(adYear, next)));
  };
  const changeAdYear = (y) => {
    const next = Number(y);
    setAdYear(next);
    setAdDay((d) => Math.min(d, daysInAdMonth(next, adMonth)));
  };

  // Results are derived from the inputs, never stored, so a result can never
  // drift away from the date shown in the fields above it.
  const adOut = useMemo(() => {
    const day = Math.min(adDay, daysInAdMonth(adYear, adMonth));
    const date = new Date(adYear, adMonth - 1, day);
    if (isNaN(date.getTime())) return { error: true };
    const r = adToBs(date);
    if (!r) return { error: true };
    return r;
  }, [adYear, adMonth, adDay]);

  const bsOut = useMemo(() => {
    if (!isValidBsDate(bsYear, bsMonth, bsDay)) return { error: true };
    const d = bsToAd(bsYear, bsMonth, bsDay);
    if (!d) return { error: true };
    return { weekday: d.getUTCDay(), year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
  }, [bsYear, bsMonth, bsDay]);

  const persist = () => {
    const day = Math.min(adDay, daysInAdMonth(adYear, adMonth));
    storeValue('uc_date_ad', { year: adYear, month: adMonth, day });
    storeValue('uc_date_bs', { year: bsYear, month: bsMonth, day: bsDay });
    showToast(t.converted || 'Date saved', 'success');
  };

  const setToday = () => {
    setAdYear(today.getFullYear());
    setAdMonth(today.getMonth() + 1);
    setAdDay(today.getDate());
    if (todayBs) { setBsYear(todayBs.year); setBsMonth(todayBs.month); setBsDay(todayBs.day); }
    const d = bsToAd(todayBs.year, todayBs.month, todayBs.day);
    if (d) storeValue('uc_date_ad', { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() });
    if (todayBs) storeValue('uc_date_bs', { year: todayBs.year, month: todayBs.month, day: todayBs.day });
  };

  const field = 'w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-sm text-slate-700 focus:outline-none focus:ring-4 focus:bg-white transition-all [&>option]:text-slate-800';
  const lbl = 'block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-2';
  const isNe = lang === 'ne';

  const ResultCard = ({ source, out, outSub, outExtra }) => (
    <div className="mt-4 p-5 rounded-2xl bg-white border border-slate-200">
      {out.error ? (
        <p className="text-sm font-medium text-red-600">
          {t.dateOutOfRange || 'Date is out of the supported range (BS 2000–2090).'}
        </p>
      ) : (
        <>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1.5">{source}</p>
          <div className="text-2xl font-serif font-bold text-slate-800">{outSub}</div>
          <div className="text-xs text-slate-500 mt-1.5">{outExtra}</div>
        </>
      )}
    </div>
  );

  const Panel = ({ tag, note, children, result, onToday }) => (
    <div className="rounded-2xl border p-7" style={{ borderColor: `${ACCENT}22`, background: `${ACCENT}08` }}>
      <div className="flex items-center justify-between mb-6">
        <span
          className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] text-white"
          style={{ background: ACCENT }}
        >
          {tag}
        </span>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-500">{note}</span>
      </div>
      {children}
      <div className="mt-5 flex items-center gap-2.5">
        <button
          onClick={persist}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-300 hover:brightness-110 active:scale-[0.98]"
          style={{ background: ACCENT, boxShadow: `0 10px 26px -12px ${ACCENT}` }}
        >
          {t.convert || 'Convert'}
        </button>
        {onToday && (
          <button
            onClick={onToday}
            className="px-4 py-3.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-600 transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
          >
            {t.today || 'Today'}
          </button>
        )}
      </div>
      {result}
    </div>
  );

  const bsMonthLabel = (m) => BS_MONTHS[lang]?.[m - 1] || NEPALI_MONTH_ORDER[m - 1];

  return (
    <div className="px-7 sm:px-10 pb-10">
      <div className="grid md:grid-cols-2 gap-5">
        {/* AD → BS */}
        <Panel
          tag={isNe ? 'AD → वि.सं.' : 'AD → BS'}
          note="Gregorian"
          result={
            <ResultCard
              source={isNe ? 'वि.सं. (Bikram Sambat)' : 'Bikram Sambat (BS)'}
              out={adOut}
              outSub={`${toNepaliDigits(adOut.year)} ${bsMonthLabel(adOut.month)} ${toNepaliDigits(adOut.day)}`}
              outExtra={`${adOut.year} ${bsMonthLabel(adOut.month)} ${adOut.day} — ${WEEKDAYS[lang]?.[adOut.weekday] || WEEKDAYS.en[adOut.weekday]}`}
            />
          }
        >
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={lbl}>{t.year || 'Year'}</label>
              <input
                type="number" value={adYear}
                onChange={(e) => changeAdYear(e.target.value)}
                className={field}
                style={{ '--tw-ring-color': `${ACCENT}33` }}
              />
            </div>
            <div>
              <label className={lbl}>{t.month || 'Month'}</label>
              <select value={adMonth} onChange={(e) => changeAdMonth(e.target.value)} className={field}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m} — {isNe ? bsMonthLabel(m) : adMonthName(m)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>{t.day || 'Day'}</label>
              <select value={Math.min(adDay, daysInAdMonth(adYear, adMonth))} onChange={(e) => setAdDay(Number(e.target.value))} className={field}>
                {Array.from({ length: daysInAdMonth(adYear, adMonth) }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </Panel>

        {/* BS → AD */}
        <Panel
          tag={isNe ? 'वि.सं. → AD' : 'BS → AD'}
          note="Bikram Sambat"
          onToday={setToday}
          result={
            <ResultCard
              source={isNe ? 'AD (ग्रेगोरियन)' : 'Gregorian (AD)'}
              out={bsOut}
              outSub={`${bsOut.error ? '' : bsOut.year} ${bsOut.error ? '' : adMonthName(bsOut.month)} ${bsOut.error ? '' : pad(bsOut.day)}`}
              outExtra={
                bsOut.error ? '' :
                `${WEEKDAYS[lang]?.[bsOut.weekday] || WEEKDAYS.en[bsOut.weekday]} · BS ${bsYear}-${pad(bsMonth)}-${pad(bsDay)}`
              }
            />
          }
        >
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={lbl}>{t.year || 'Year'}</label>
              <select value={bsYear} onChange={(e) => { setBsYear(Number(e.target.value)); setBsDay(1); }} className={field}>
                {BS_YEARS.map((y) => <option key={y} value={y}>{toNepaliDigits(y)} ({y})</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>{t.month || 'Month'}</label>
              <select value={bsMonth} onChange={(e) => { setBsMonth(Number(e.target.value)); setBsDay(1); }} className={field}>
                {NEPALI_MONTH_ORDER.map((m, i) => (
                  <option key={m} value={i + 1}>{bsMonthLabel(i + 1)} ({i + 1})</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>{t.day || 'Day'}</label>
              <select value={Math.min(bsDay, bsDayCount)} onChange={(e) => setBsDay(Number(e.target.value))} className={field}>
                {Array.from({ length: bsDayCount }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{toNepaliDigits(d)}</option>
                ))}
              </select>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ═══ div · text ══════════════════════════════════════════════════════════ */
function TextDiv({ t }) {
  const { showToast } = useToast();
  const [mode, setMode] = useState(loadStored('uc_text_mode', 'en-ne'));
  const [input, setInput] = useState(loadStored('uc_text_input', ''));
  const [copied, setCopied] = useState(false);

  const changeMode = (m) => { setMode(m); storeValue('uc_text_mode', m); };
  const changeInput = (v) => { setInput(v); storeValue('uc_text_input', v); };

  const output = useMemo(() => {
    const text = input || '';
    switch (mode) {
      case 'en-ne': return romanToDevanagari(text);
      case 'en-preeti': return unicodeToPreeti(romanToDevanagari(text));
      case 'preeti-ne': return preetiToUnicode(text);
      case 'ne-preeti': return unicodeToPreeti(text);
      case 'en-hi': return romanToDevanagari(text);
      case 'en-ta': return romanToTamil(text);
      case 'en-zh': return englishToChinese(text);
      default: return text;
    }
  }, [input, mode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      showToast(t.copied || 'Copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 1600);
    } catch {
      showToast(t.converterCopyFailed || 'Copy failed', 'error');
    }
  };

  const activeMode = TEXT_MODES.find((m) => m.id === mode);

  return (
    <div className="px-7 sm:px-10 pb-10">
      <div className="flex flex-wrap gap-2 mb-6">
        {TEXT_MODES.map((m) => (
          <button
            key={m.id} onClick={() => changeMode(m.id)}
            className="px-4 py-2.5 rounded-full text-[11px] font-semibold border transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
            style={mode === m.id
              ? { background: ACCENT, borderColor: ACCENT, color: '#fff', boxShadow: `0 8px 20px -10px ${ACCENT}` }
              : { background: '#fff', borderColor: `${ACCENT}33`, color: '#64748B' }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{t.inputText || 'Input'}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">{activeMode?.from}</span>
          </div>
          <textarea
            value={input} onChange={(e) => changeInput(e.target.value)}
            placeholder={t.typeHere || 'Type or paste text here...'}
            className="w-full p-5 rounded-2xl border border-slate-200 bg-slate-50/70 text-[15px] leading-relaxed text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 transition-all resize-y min-h-[200px]"
            style={{ '--tw-ring-color': `${ACCENT}33` }}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{t.outputText || 'Output'}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md text-white" style={{ background: ACCENT }}>{activeMode?.to}</span>
          </div>
          <textarea
            readOnly value={output} placeholder={t.outputHere || 'Converted text appears here...'}
            className="w-full p-5 rounded-2xl border text-[15px] leading-relaxed resize-y min-h-[200px] focus:outline-none focus:ring-4 transition-all"
            style={{ background: `${ACCENT}07`, borderColor: `${ACCENT}30`, color: '#1E293B', '--tw-ring-color': `${ACCENT}26` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
        <button
          onClick={() => changeInput(output)}
          className="px-5 py-3 rounded-xl text-xs font-semibold bg-white text-slate-600 border border-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
        >
          {t.swap || 'Use as input'}
        </button>
        <button
          onClick={handleCopy}
          className="px-5 py-3 rounded-xl text-xs font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 active:scale-95"
          style={{ background: ACCENT, boxShadow: `0 10px 24px -10px ${ACCENT}` }}
        >
          {copied ? (t.copied || 'Copied') : (t.copy || 'Copy')}
        </button>
      </div>
    </div>
  );
}

/* ═══ div · currency ══════════════════════════════════════════════════════ */
function CurrencyDiv({ t, lang }) {
  const [amount, setAmount] = useState(() => loadStored('cc_amount', 1) || 1);
  const [rates, setRates] = useState(null);
  const [updated, setUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [openCode, setOpenCode] = useState(null);

  const isNe = lang === 'ne';

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { rates: fresh, updated: at } = await fetchRates();
      setRates(fresh);
      setUpdated(at);
      storeValue(RATE_CACHE_KEY, { rates: fresh, updated: at });
    } catch {
      const cached = loadStored(RATE_CACHE_KEY, null);
      if (cached?.rates) {
        setRates(cached.rates);
        setUpdated(cached.updated);
        setError('offline');
      } else {
        setError('failed');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = loadStored(RATE_CACHE_KEY, null);
    if (cached?.rates && Date.now() - cached.updated < RATE_TTL) {
      setRates(cached.rates); setUpdated(cached.updated); setLoading(false);
    } else {
      refresh();
    }
  }, [refresh]);

  useEffect(() => {
    const id = setInterval(() => refresh(true), AUTO_REFRESH);
    const onFocus = () => { if (Date.now() - (updated || 0) > RATE_TTL) refresh(true); };
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus); };
  }, [refresh, updated]);

  useEffect(() => { storeValue('cc_amount', amount); }, [amount]);

  const nprRate = useMemo(() => rates?.NPR ?? 1, [rates]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CURRENCIES
      .map((c) => {
        const per = rates ? rates[c.code] / nprRate : null;
        return { ...c, per, value: per == null ? null : per * Number(amount || 0) };
      })
      .filter((c) => !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.nameNe.includes(query.trim()));
  }, [rates, nprRate, amount, query]);

  const detail = openCode ? CURRENCIES.find((c) => c.code === openCode) : null;
  const detailRow = detail ? rows.find((r) => r.code === detail.code) : null;
  const usdPerNpr = rates ? 1 / (rates.USD / nprRate || 1) : null;

  const timeAgo = useMemo(() => {
    if (!updated) return null;
    const mins = Math.floor((Date.now() - updated) / 60000);
    if (mins < 1) return isNe ? 'अहिले' : 'just now';
    if (mins < 60) return isNe ? `${mins} मिनेट पहिले` : `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return isNe ? `${hrs} घण्टा पहिले` : `${hrs} hr ago`;
    return isNe ? `${Math.floor(hrs / 24)} दिन पहिले` : `${Math.floor(hrs / 24)} d ago`;
  }, [updated, isNe]);

  const quick = [1, 5, 10, 100, 500, 1000, 5000, 10000];

  return (
    <div className="px-7 sm:px-10 pb-10">
      <div className="grid lg:grid-cols-[minmax(0,360px)_1fr] gap-6">
        <div className="rounded-2xl border p-7" style={{ borderColor: `${ACCENT}22`, background: `${ACCENT}07` }}>
          <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-2.5">
            {isNe ? 'रकम (रू)' : 'Amount (NPR)'}
          </label>
          <div className="relative">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-serif font-bold select-none"
              style={{ color: ACCENT }}
            >रू</span>
            <input
              type="number" min="0" step="any" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full py-4 rounded-2xl border border-slate-200 bg-white text-2xl font-serif font-bold text-slate-800 focus:outline-none focus:ring-4 transition-all"
              style={{ paddingLeft: '3.25rem', '--tw-ring-color': `${ACCENT}33` }}
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {quick.map((q) => (
              <button
                key={q} onClick={() => setAmount(q)}
                className="px-3.5 py-2 rounded-full text-[11px] font-semibold border transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                style={Number(amount) === q
                  ? { background: ACCENT, borderColor: ACCENT, color: '#fff' }
                  : { background: '#fff', borderColor: `${ACCENT}33`, color: '#64748B' }}
              >
                {q.toLocaleString('en-US')}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {updated && (
              <span className="px-3 py-1.5 rounded-full text-[10px] font-semibold" style={{ background: `${ACCENT}0D`, color: ACCENT }}>
                {timeAgo}
              </span>
            )}
            <button
              onClick={() => refresh()} disabled={loading}
              className="px-3.5 py-1.5 rounded-full text-[10px] font-semibold bg-white text-slate-600 border border-slate-200 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? (isNe ? 'लोड हुँदैछ…' : 'Loading…') : (isNe ? 'नवीकरण' : 'Refresh')}
            </button>
          </div>

          {error === 'failed' && (
            <p className="mt-4 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {isNe ? 'विनिमय दर लोड गर्न सकिएन।' : 'Could not load exchange rates.'}
            </p>
          )}
          {error === 'offline' && (
            <p className="mt-4 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              {isNe ? 'सुरक्षित रेट देखाइँदैछ।' : 'Showing the last saved rates.'}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/80 overflow-hidden">
          <div
            className="px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-2"
            style={{ background: `${ACCENT}0A`, borderColor: `${ACCENT}22` }}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              {isNe ? '१ रु =' : '1 NPR ='} {usdPerNpr ? `${fmtNum(usdPerNpr, 4)} USD` : '—'}
            </span>
            <input
              type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder={isNe ? 'खोज्नुहोस्…' : 'Search…'}
              className="w-44 px-3 py-2 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-700 focus:outline-none focus:ring-4 transition-all"
              style={{ '--tw-ring-color': `${ACCENT}33` }}
            />
          </div>

          <div className="max-h-[460px] overflow-y-auto">
            {loading && !rates ? (
              <div className="py-20 text-center">
                <div className="mx-auto w-6 h-6 rounded-full border-2 border-slate-200 border-t-2 animate-spin" style={{ borderTopColor: ACCENT }} />
                <p className="mt-3 text-xs text-slate-400">{isNe ? 'दर लोड हुँदैछ…' : 'Loading rates…'}</p>
              </div>
            ) : rows.length === 0 ? (
              <p className="py-16 text-center text-xs text-slate-400">
                {isNe ? 'कुनै मुद्रा भेटिएन' : 'No currency found'}
              </p>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-white text-[9px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
                    <th className="text-left font-bold py-2.5 pl-5">{isNe ? 'मुद्रा' : 'Currency'}</th>
                    <th className="text-right font-bold py-2.5">{isNe ? 'दर' : 'Rate'}</th>
                    <th className="text-right font-bold py-2.5 pr-5">{isNe ? 'रकम' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <motion.tr
                      key={r.code}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.3) }}
                      onClick={() => setOpenCode(r.code)}
                      className="cursor-pointer border-b border-slate-100 transition-colors duration-200"
                      style={{ background: r.code === 'NPR' ? `${ACCENT}0D` : undefined }}
                      onMouseEnter={(e) => { if (r.code !== 'NPR') e.currentTarget.style.background = `${ACCENT}0A`; }}
                      onMouseLeave={(e) => { if (r.code !== 'NPR') e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td className="py-2.5 pl-5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base leading-none">{r.flag}</span>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              {r.code}
                              {r.code === 'NPR' && (
                                <span className="text-[8px] font-bold uppercase tracking-wider text-white rounded-full px-1.5 py-0.5" style={{ background: ACCENT }}>
                                  Base
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{isNe ? r.nameNe : r.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-600">
                        {r.code === 'NPR' ? '1.00' : fmtNum(r.per)}
                      </td>
                      <td className="py-2.5 pr-5 text-right font-serif font-bold text-slate-800">{fmtAmount(r.value)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {detail && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm"
          onClick={() => setOpenCode(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl overflow-hidden bg-white shadow-2xl"
          >
            <div className="relative px-7 pt-8 pb-7 text-white" style={{ background: ACCENT }}>
              <button
                onClick={() => setOpenCode(null)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-lg leading-none transition-colors"
              >
                ×
              </button>
              <div className="flex items-center gap-4">
                <span className="text-4xl leading-none">{detail.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif text-2xl font-bold">{detail.code}</h4>
                    {detail.code === 'NPR' && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-white/25 rounded-full px-1.5 py-0.5">Base</span>
                    )}
                  </div>
                  <p className="text-white/80 text-sm">{isNe ? detail.nameNe : detail.name}</p>
                </div>
              </div>
              <div className="mt-6 pt-5 border-t border-white/20">
                <p className="text-[10px] uppercase tracking-wider text-white/60 mb-1">{isNe ? 'रकम' : 'Amount'}</p>
                <p className="font-serif text-2xl font-bold break-words">{fmtAmount(detailRow?.value ?? 0)}</p>
              </div>
            </div>
            <div className="p-6 space-y-2.5">
              {detailRow?.per != null && (
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500">{isNe ? '१ रु =' : '1 NPR ='}</span>
                  <span className="font-mono text-sm font-bold text-slate-800">{fmtNum(detailRow.per, 6)} {detail.code}</span>
                </div>
              )}
              {detailRow?.per ? (
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500">1 {detail.code} =</span>
                  <span className="font-mono text-sm font-bold text-slate-800">{fmtNum(1 / detailRow.per, 6)} NPR</span>
                </div>
              ) : null}
              {updated && (
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500">{isNe ? 'अद्यावधिक' : 'Last updated'}</span>
                  <span className="text-xs font-semibold text-slate-700">{new Date(updated).toLocaleString()}</span>
                </div>
              )}
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1.5">
                {isNe ? 'दरहरू बजार सन्दर्भमा आधारित हुन्।' : 'Rates are indicative market references.'}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ═══ page ════════════════════════════════════════════════════════════════ */
const DIVS = [
  { id: 'date', num: '01', title: 'मिति रूपान्तरण', titleEn: 'Date Converter', sub: 'AD ⇄ BS', subNe: 'AD ⇄ BS' },
  { id: 'text', num: '02', title: 'पाठ रूपान्तरण', titleEn: 'Text Converter', sub: 'Preeti ⇄ Unicode', subNe: 'प्रीती ⇄ युनिकोड' },
  { id: 'currency', num: '03', title: 'विनिमय दर', titleEn: 'Currency Exchange', sub: 'NPR · 20 currencies', subNe: 'रु · २० मुद्रा' },
];

const UnicodeConverterPage = () => {
  const { t, lang } = useLanguage();
  const isNe = lang === 'ne';

  return (
    <div className="min-h-screen bg-slate-100 pt-28 sm:pt-32 px-4 sm:px-6 pb-24">
      <style>{`
        @keyframes snake-spin { to { transform: rotate(360deg); } }
        .snake {
          position: relative;
          isolation: isolate;
          background: transparent;
          transition: transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s ease;
        }
        .snake::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: inherit;
          background: conic-gradient(from 0deg,
            transparent 0deg, transparent 230deg,
            ${ACCENT} 275deg, ${ACCENT_2} 302deg, ${ACCENT} 328deg,
            transparent 360deg);
          z-index: -2;
          opacity: 0;
          transition: opacity .4s ease;
          animation: snake-spin 2.8s linear infinite;
          animation-play-state: paused;
        }
        .snake::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: #ffffff;
          z-index: -1;
        }
        .snake:hover::before { opacity: 1; animation-play-state: running; }
        .snake:hover { transform: translateY(-6px); box-shadow: 0 32px 64px -34px ${ACCENT}; }
        .snake:hover .card-num { transform: scale(1.1) rotate(-5deg); }
        .snake:hover .card-title { color: ${ACCENT}; }
        .snake:hover .card-bar { opacity: 1; }
        .card-num { transition: transform .4s cubic-bezier(.16,1,.3,1); }
        .card-title { transition: color .3s ease; }
        .card-bar { opacity: .55; transition: opacity .4s ease; }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <PageHeader sub={isNe ? 'विनिमय दर, मिति र पाठ — सबै एकै ठाउँमा।' : 'Currency, date and text — all in one place.'}>
            {isNe ? 'रूपान्तरण उपकरण' : 'Conversion Tools'}
          </PageHeader>
        </div>

        <div className="space-y-8">
          {DIVS.map((d, i) => (
            <motion.section
              key={d.id}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="snake rounded-[32px] border border-slate-200 overflow-hidden"
            >
              <div className="card-bar h-2 w-full" style={{ background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_2})` }} />
              <div className="flex items-center gap-5 px-7 sm:px-10 pt-8 pb-5">
                <span
                  className="card-num font-serif text-2xl font-bold text-white w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: ACCENT, boxShadow: `0 14px 30px -12px ${ACCENT}` }}
                >
                  {d.num}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="card-title font-serif text-2xl sm:text-3xl font-bold text-slate-800">
                    {isNe ? d.title : d.titleEn}
                  </h2>
                  <span
                    className="inline-block mt-2 text-[10px] font-mono px-2.5 py-1 rounded-md"
                    style={{ background: `${ACCENT}12`, color: ACCENT }}
                  >
                    {isNe ? d.subNe : d.sub}
                  </span>
                </div>
              </div>

              {d.id === 'date' && <DateDiv t={t} lang={lang} />}
              {d.id === 'text' && <TextDiv t={t} />}
              {d.id === 'currency' && <CurrencyDiv t={t} lang={lang} />}
            </motion.section>
          ))}
        </div>

        <p className="mt-12 text-center text-[11px] text-slate-400">
          {isNe ? 'तपाईंको इनपुट तपाईंको ब्राउजरमै मात्र रहन्छ।' : 'Your input stays entirely in your browser.'}
        </p>
      </div>
    </div>
  );
};

export default UnicodeConverterPage;
