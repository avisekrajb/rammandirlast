import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Send, Loader2, MapPin } from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';

// ── Map configuration ────────────────────────────────────────────────
// Temple coordinates (Battisputali, Kathmandu, Nepal)
const TEMPLE_LAT = 27.70426855;
const TEMPLE_LNG = 85.342925;

// Canonical Google Maps short link (opens app on mobile, web on desktop)
const DIRECTIONS_URL = 'https://maps.app.goo.gl/h3c1HpR4vQpCxGLD8';

// Real embed — Google Maps (primary)
const GOOGLE_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7064.843056298416!2d85.342925!3d27.70426855!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb199d17032265%3A0xc7e605b267b03e75!2sBattisputali%2C%20Kathmandu%2C%20Bagmati%20Province%2044600!5e0!3m2!1sen!2snp!4v1791003263092!5m2!1sen!2snp';

// Fallback embed — OpenStreetMap (used if Google iframe fails)
const MAP_BBOX = [
  (TEMPLE_LNG - 0.005).toFixed(4),
  (TEMPLE_LAT - 0.003).toFixed(4),
  (TEMPLE_LNG + 0.005).toFixed(4),
  (TEMPLE_LAT + 0.003).toFixed(4),
].join('%2C');

const FALLBACK_EMBED = `https://www.openstreetmap.org/export/embed.html?bbox=${MAP_BBOX}&layer=mapnik&marker=${TEMPLE_LAT},${TEMPLE_LNG}`;

const MAX_MESSAGE = 1000;

const ContactPage = () => {
  const { t, lang } = useLanguage();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Which map is currently shown: 'primary' (Google) or 'fallback' (OSM)
  const [mapSource, setMapSource] = useState('primary');

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = t.contactNameError || 'Name must be at least 2 characters';
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.contactEmailError || 'Please enter a valid email';
    }
    if (!formData.message.trim() || formData.message.trim().length < 5) {
      newErrors.message = t.contactMsgError || 'Message must be at least 5 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await api.post('/contact', formData);
      showToast(t.contactSent || 'Message sent successfully!', 'success');
      setFormData({ name: '', email: '', message: '' });
      setErrors({});
    } catch (error) {
      console.error('Contact error:', error);
      showToast(
        error.response?.data?.message || t.contactError || 'Failed to send message',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'message' ? value.slice(0, MAX_MESSAGE) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Details list — Office and Religious Programs & Puja removed.
  const details = [
    {
      key: 'location',
      label: t.contactLocationLabel || 'Location',
      value: t.contactLocationValue || 'Battisputali, Kathmandu, Nepal',
      href: DIRECTIONS_URL,
      external: true,
    },
    {
      key: 'donate',
      label: t.contactDonateLabel || 'Donation & Support',
      value: t.contactDonateValue || 'Get details through the temple office.',
      href: '/donate',
    },
    {
      key: 'phone',
      label: t.contactPhone || 'Phone',
      value: '+977-1-4598526',
      href: 'tel:+97714598526',
    },
    {
      key: 'email',
      label: t.contactEmail || 'Email',
      value: 'shreramchandra@gmail.com',
      href: 'mailto:shreramchandra@gmail.com',
    },
  ];

  const contactHeading = {
    en: 'Contact Information',
    ne: 'सम्पर्क जानकारी',
    hi: 'संपर्क जानकारी',
    zh: '联系信息',
    ta: 'தொடர்பு தகவல்',
  }[lang] || 'Contact Information';

  const remaining = MAX_MESSAGE - formData.message.length;

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Ambient background */}
      <div
        aria-hidden
        className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(122,0,0,0.10), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="absolute top-1/4 -right-48 w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(232,169,61,0.10), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="absolute -bottom-52 left-1/4 w-[540px] h-[540px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(154,52,18,0.08), transparent 70%)' }}
      />

      <div className="relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-24">
          {/* Page heading — bold */}
          <div className="mb-12 [&_h1]:font-bold [&_h1]:tracking-tight">
            <PageHeader sub={t.contactSubtitle || 'We would love to hear from you.'}>
              {t.contactTitle || 'Get in Touch'}
            </PageHeader>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* ================= FORM ================= */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="lg:col-span-7 relative overflow-hidden rounded-3xl bg-white border border-[#F1E4DE] transition-shadow duration-500 hover:shadow-[0_28px_70px_-28px_rgba(122,0,0,0.28)]"
              style={{ boxShadow: '0 12px 40px -20px rgba(0,0,0,0.12)' }}
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-[5px]"
                style={{
                  background:
                    'linear-gradient(90deg, #7A0000, #C1440E 30%, #E8A93D 55%, #7A1F2B 100%)',
                }}
              />

              <div className="p-6 sm:p-9">
                <div className="mb-8">
                  <h2 className="font-serif text-2xl sm:text-[1.75rem] font-bold leading-tight text-ink">
                    {t.contactMessage || 'Send us a Message'}
                  </h2>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {t.contactSubtitle || 'We usually reply within a day.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-[11px] font-semibold text-ink-soft mb-2 uppercase tracking-[0.14em]"
                    >
                      {t.contactYourName || 'Your Name'}
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onFocus={() => setFocused('name')}
                      onBlur={() => setFocused('')}
                      placeholder={t.contactNamePlaceholder || 'Enter your name'}
                      aria-invalid={!!errors.name}
                      className={fieldClass(!!errors.name, focused === 'name')}
                    />
                    {errors.name && (
                      <p className="text-xs mt-1.5 text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-[11px] font-semibold text-ink-soft mb-2 uppercase tracking-[0.14em]"
                    >
                      {t.contactYourEmail || 'Your Email'}
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused('')}
                      placeholder={t.contactEmailPlaceholder || 'Enter your email'}
                      aria-invalid={!!errors.email}
                      className={fieldClass(!!errors.email, focused === 'email')}
                    />
                    {errors.email && (
                      <p className="text-xs mt-1.5 text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <label
                        htmlFor="contact-message"
                        className="block text-[11px] font-semibold text-ink-soft uppercase tracking-[0.14em]"
                      >
                        {t.contactYourMessage || 'Your Message'}
                      </label>
                      <span
                        className="text-[11px] tabular-nums transition-colors duration-200"
                        style={{
                          color:
                            remaining === 0
                              ? '#dc2626'
                              : remaining < 120
                              ? '#d97706'
                              : '#a8a29e',
                        }}
                      >
                        {formData.message.length}/{MAX_MESSAGE}
                      </span>
                    </div>
                    <textarea
                      id="contact-message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      onFocus={() => setFocused('message')}
                      onBlur={() => setFocused('')}
                      rows={5}
                      placeholder={t.contactMsgPlaceholder || 'Write your message here...'}
                      aria-invalid={!!errors.message}
                      className={`${fieldClass(!!errors.message, focused === 'message')} resize-none min-h-[130px]`}
                    />
                    {errors.message && (
                      <p className="text-xs mt-1.5 text-red-600">{errors.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative w-full overflow-hidden rounded-2xl px-8 py-4 text-sm font-semibold text-white
                               transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0
                               disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    style={{
                      background: 'linear-gradient(120deg, #7A0000 0%, #8A1D2B 45%, #C1440E 100%)',
                      boxShadow: '0 10px 28px -10px rgba(122,0,0,0.6)',
                    }}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)',
                      }}
                    />
                    <span className="relative flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          {t.contactSending || 'Sending...'}
                        </>
                      ) : (
                        <>
                          {t.contactSend || 'Send Message'}
                          <Send
                            size={15}
                            className="transition-transform duration-300 group-hover:translate-x-1"
                          />
                        </>
                      )}
                    </span>
                  </button>
                </form>
              </div>
            </motion.section>

            {/* ================= DETAILS + MAP ================= */}
            <div className="lg:col-span-5 space-y-6">
              {/* सम्पर्कका लागि */}
              <motion.section
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.12 }}
                className="relative overflow-hidden rounded-3xl bg-white border border-[#F1E4DE] transition-shadow duration-500 hover:shadow-[0_28px_70px_-28px_rgba(122,0,0,0.24)]"
                style={{ boxShadow: '0 12px 40px -20px rgba(0,0,0,0.12)' }}
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[5px]"
                  style={{
                    background:
                      'linear-gradient(90deg, #5B1420, #C1440E 35%, #E8A93D 65%, #7A0000)',
                  }}
                />

                <div className="p-6 sm:p-8">
                  <div className="mb-6">
                    <h2 className="font-serif text-2xl sm:text-[1.75rem] font-bold leading-tight text-ink">
                      {t.contactForTitle || 'For Contact'}
                    </h2>
                    <p className="text-xs font-bold text-ink-soft mt-0.5">{contactHeading}</p>
                  </div>

                  <ul className="space-y-2">
                    {details.map((item, index) => {
                      const isExternal = !!item.external;
                      return (
                        <motion.li
                          key={item.key}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.2 + index * 0.05 }}
                        >
                          <a
                            href={item.href}
                            {...(isExternal
                              ? { target: '_blank', rel: 'noopener noreferrer' }
                              : {})}
                            className="group flex items-start gap-3.5 p-3.5 rounded-2xl border border-transparent
                                       bg-[#FBF8F7] transition-all duration-300
                                       hover:bg-white hover:border-[#E8D3CB] hover:shadow-[0_10px_26px_-12px_rgba(122,0,0,0.35)]
                                       hover:-translate-y-0.5"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A3412]">
                                {item.label}
                              </span>
                              <span className="block text-[13px] font-medium text-gray-700 group-hover:text-ink transition-colors break-words leading-snug mt-0.5">
                                {item.value}
                              </span>
                            </span>
                          </a>
                        </motion.li>
                      );
                    })}
                  </ul>

                  <div
                    className="mt-5 flex items-center px-4 py-3 rounded-2xl"
                    style={{
                      background: 'rgba(122,0,0,0.05)',
                      border: '1px solid rgba(122,0,0,0.12)',
                    }}
                  >
                    <span className="text-[11px] font-medium text-gray-600">
                      We typically respond within 24 hours
                    </span>
                  </div>
                </div>
              </motion.section>

              {/* ============= MAP (primary + fallback) ============= */}
              <motion.section
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2 }}
                className="relative overflow-hidden rounded-3xl border border-[#F1E4DE] bg-white"
                style={{ boxShadow: '0 20px 50px -22px rgba(122,0,0,0.30)' }}
              >
                <div className="relative h-72 overflow-hidden group">
                  {/* Soft brand tint */}
                  <div
                    aria-hidden
                    className="absolute inset-0 z-10 pointer-events-none mix-blend-multiply"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(122,0,0,0.06) 0%, transparent 30%, transparent 70%, rgba(122,0,0,0.10) 100%)',
                    }}
                  />

                  {/* iframe — Google (primary) or OSM (fallback) */}
                  <div className="absolute inset-0 transition-transform duration-[1200ms] ease-out group-hover:scale-110">
                    <iframe
                      key={mapSource}
                      title="Shree Ramchandra Mandir Location — Battisputali, Kathmandu, Nepal"
                      className="w-full h-full border-0 saturate-[0.9] group-hover:saturate-100 transition-all duration-700"
                      src={mapSource === 'primary' ? GOOGLE_EMBED : FALLBACK_EMBED}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      onError={() => setMapSource('fallback')}
                    />
                  </div>

                  {/* Floating pill */}
                  <div className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-md px-3.5 py-1.5 shadow-md border border-white">
                    <span className="w-2 h-2 rounded-full bg-[#C1440E] animate-pulse" />
                    <span className="text-[11px] font-semibold text-[#7A0000] tracking-wide">
                      Battisputali · Kathmandu
                    </span>
                  </div>

                  {/* Directions CTA → opens the shared short link */}
                  <a
                    href={DIRECTIONS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-4 right-4 z-20 inline-flex items-center gap-1.5
                               rounded-full px-4 py-2.5 text-xs font-semibold text-white
                               transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      background: 'linear-gradient(120deg, #7A0000, #C1440E)',
                      boxShadow: '0 10px 24px -8px rgba(122,0,0,0.55)',
                    }}
                  >
                    <MapPin size={13} />
                    {t.contactDirections || 'Get Directions'}
                  </a>
                </div>

                {/* Address strip */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-[#F1E4DE] bg-[#FBF8F7]">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A3412]">
                      {t.contactLocationLabel || 'Location'}
                    </p>
                    <p className="text-[13px] font-medium text-gray-700 truncate">
                      Battisputali, Kathmandu, Nepal
                    </p>
                  </div>
                  <a
                    href={DIRECTIONS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-[#7A0000] hover:underline whitespace-nowrap"
                  >
                    Open in Maps →
                  </a>
                </div>
              </motion.section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Shared input styling. */
const fieldClass = (hasError, isFocused) =>
  [
    'w-full px-4 py-3.5 rounded-2xl border text-sm transition-all duration-200',
    'placeholder:text-gray-400 outline-none',
    hasError
      ? 'border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-4 focus:ring-red-100'
      : isFocused
      ? 'border-[#7A0000] bg-white ring-4 ring-[#7A0000]/10'
      : 'border-[#F0E2DC] bg-[#FBF8F7] hover:border-[#E8D3CB] hover:bg-white',
  ].join(' ');

export default ContactPage;