import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import {
  MapPin, Phone, Mail, Send, User, AtSign, MessageSquare,
  Clock, Building2, Sparkles, HeartHandshake, Compass, ArrowUpRight, Loader2,
} from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';

// Battisputali, Kathmandu. Used for the map marker and the directions link.
const TEMPLE_LAT = 27.7036;
const TEMPLE_LNG = 85.3099;
const MAPS_QUERY = 'Shree+Ramchandra+Mandir,+Battisputali,+Kathmandu,+Nepal';
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${TEMPLE_LAT},${TEMPLE_LNG}`;

// Bounding box for the embedded map, padded around the marker.
const MAP_BBOX = [
  (TEMPLE_LNG - 0.006).toFixed(4),
  (TEMPLE_LAT - 0.004).toFixed(4),
  (TEMPLE_LNG + 0.006).toFixed(4),
  (TEMPLE_LAT + 0.004).toFixed(4),
].join('%2C');

const OSM_EMBED = `https://www.openstreetmap.org/export/embed.html?bbox=${MAP_BBOX}&layer=mapnik&marker=${TEMPLE_LAT},${TEMPLE_LNG}`;

const MAX_MESSAGE = 1000;

const ContactPage = () => {
  const { t, lang } = useLanguage();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    // Cap the textarea so the counter and the stored value agree.
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'message' ? value.slice(0, MAX_MESSAGE) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /*
   * "सम्पर्कका लागि" details block.
   *
   * The location row replaces the old "Address" tile rather than sitting
   * beside it — both name the same place, so keeping both would just print the
   * address twice on one page. Phone and email are the only direct channels
   * that are not repeated here.
   */
  const details = [
    {
      key: 'location',
      label: t.contactLocationLabel || 'Location',
      value: t.contactLocationValue || 'Battisputali, Kathmandu, Nepal',
      Icon: MapPin,
      href: DIRECTIONS_URL,
      external: true,
    },
    {
      key: 'office',
      label: t.contactOfficeLabel || 'Office',
      value: t.contactOfficeValue || 'Shree Ramchandra Temple Office',
      Icon: Building2,
      href: DIRECTIONS_URL,
      external: true,
    },
    {
      key: 'puja',
      label: t.contactPujaLabel || 'Religious Programs & Puja',
      value: t.contactPujaValue || 'Please contact at the temple office.',
      Icon: Sparkles,
      href: '/booking',
    },
    {
      key: 'donate',
      label: t.contactDonateLabel || 'Donation & Support',
      value: t.contactDonateValue || 'Get details through the temple office.',
      Icon: HeartHandshake,
      href: '/donate',
    },
    {
      key: 'phone',
      label: t.contactPhone || 'Phone',
      value: '+977-1-4598526',
      Icon: Phone,
      href: 'tel:+97714598526',
    },
    {
      key: 'email',
      label: t.contactEmail || 'Email',
      value: 'shreramchandra@gmail.com',
      Icon: Mail,
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
          {/* Page heading */}
          <div className="mb-12">
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
              {/* Gradient top rule, brightens on hover */}
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-[5px] origin-left scale-x-75 transition-transform duration-500 group-hover:scale-x-100"
                style={{
                  background:
                    'linear-gradient(90deg, #7A0000, #C1440E 30%, #E8A93D 55%, #7A1F2B 100%)',
                }}
              />

              <div className="p-6 sm:p-9">
                <div className="flex items-center gap-3.5 mb-8">
                  <span
                    className="w-12 h-12 rounded-2xl grid place-items-center flex-shrink-0 text-white"
                    style={{
                      background: 'linear-gradient(135deg, #7A0000, #C1440E)',
                      boxShadow: '0 10px 22px -8px rgba(122,0,0,0.6)',
                    }}
                  >
                    <Send size={19} />
                  </span>
                  <div>
                    <h2 className="font-serif text-2xl sm:text-[1.75rem] leading-tight text-ink">
                      {t.contactMessage || 'Send us a Message'}
                    </h2>
                    <p className="text-xs text-ink-soft mt-0.5">
                      {t.contactSubtitle || 'We usually reply within a day.'}
                    </p>
                  </div>
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
                    <div className="relative">
                      <User
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
                        style={{ color: focused === 'name' ? '#7A0000' : '#c9c2bd' }}
                      />
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
                    </div>
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
                    <div className="relative">
                      <AtSign
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
                        style={{ color: focused === 'email' ? '#7A0000' : '#c9c2bd' }}
                      />
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
                    </div>
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
                      {/* Turns amber as the limit approaches, red at the cap */}
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
                    <div className="relative">
                      <MessageSquare
                        size={17}
                        className="absolute left-4 top-4 pointer-events-none transition-colors duration-200"
                        style={{ color: focused === 'message' ? '#7A0000' : '#c9c2bd' }}
                      />
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
                    </div>
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
                    {/* Sheen that sweeps across on hover */}
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
                  <div className="flex items-center gap-3.5 mb-6">
                    <span
                      className="w-12 h-12 rounded-2xl grid place-items-center flex-shrink-0 text-white"
                      style={{
                        background: 'linear-gradient(135deg, #5B1420, #C1440E)',
                        boxShadow: '0 10px 22px -8px rgba(91,20,32,0.6)',
                      }}
                    >
                      <Compass size={19} />
                    </span>
                    <div>
                      <h2 className="font-serif text-2xl sm:text-[1.75rem] leading-tight text-ink">
                        {t.contactForTitle || 'For Contact'}
                      </h2>
                      <p className="text-xs text-ink-soft mt-0.5">{contactHeading}</p>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {details.map((item, index) => {
                      const { Icon } = item;
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
                            <span
                              className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0
                                         transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6"
                              style={{
                                background:
                                  'linear-gradient(135deg, rgba(122,0,0,0.10), rgba(193,68,14,0.10))',
                              }}
                            >
                              <Icon size={17} className="text-[#7A0000]" />
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A3412]">
                                {item.label}
                              </span>
                              <span className="block text-[13px] font-medium text-gray-700 group-hover:text-ink transition-colors break-words leading-snug mt-0.5">
                                {item.value}
                              </span>
                            </span>

                            <ArrowUpRight
                              size={15}
                              className="mt-1 flex-shrink-0 text-[#C1440E]/40
                                         transition-all duration-300 group-hover:text-[#7A0000]
                                         group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            />
                          </a>
                        </motion.li>
                      );
                    })}
                  </ul>

                  <div
                    className="mt-5 flex items-center gap-2.5 px-4 py-3 rounded-2xl"
                    style={{
                      background: 'rgba(122,0,0,0.05)',
                      border: '1px solid rgba(122,0,0,0.12)',
                    }}
                  >
                    <Clock size={14} className="flex-shrink-0 text-[#7A0000]" />
                    <span className="text-[11px] font-medium text-gray-600">
                      We typically respond within 24 hours
                    </span>
                  </div>
                </div>
              </motion.section>

              {/* Map */}
              <motion.section
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2 }}
                className="relative overflow-hidden rounded-3xl border border-[#F1E4DE] bg-white transition-shadow duration-500 hover:shadow-[0_28px_70px_-28px_rgba(122,0,0,0.24)]"
                style={{ boxShadow: '0 12px 40px -20px rgba(0,0,0,0.12)' }}
              >
                {/* Map viewport. The inner pane scales slightly on hover, which
                    reads as "zoom in" without needing map controls. */}
                <div className="relative h-64 overflow-hidden">
                  <div className="absolute inset-0 transition-transform duration-700 ease-out hover:scale-105">
                    <iframe
                      title="Shree Ramchandra Mandir Location"
                      className="w-full h-full border-0 grayscale-[35%] hover:grayscale-0 transition-all duration-700"
                      src={OSM_EMBED}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  {/* Direction CTA, bottom-right */}
                  <a
                    href={DIRECTIONS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-4 right-4 inline-flex items-center gap-1.5
                               rounded-full bg-white/95 backdrop-blur px-4 py-2.5 text-xs font-semibold
                               text-[#7A0000] shadow-lg border border-white
                               transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
                  >
                    <MapPin size={13} />
                    {t.contactDirections || 'Get Directions'}
                  </a>
                </div>

                {/* Address strip */}
                <div className="flex items-center gap-3 px-5 py-4 border-t border-[#F1E4DE] bg-[#FBF8F7]">
                  <span
                    className="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0 text-white"
                    style={{ background: 'linear-gradient(135deg, #7A0000, #C1440E)' }}
                  >
                    <MapPin size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A3412]">
                      {t.contactLocationLabel || 'Location'}
                    </p>
                    <p className="text-[13px] font-medium text-gray-700 truncate">
                      {t.contactLocationValue || 'Battisputali, Kathmandu, Nepal'}
                    </p>
                  </div>
                </div>
              </motion.section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Shared input styling, so all three fields focus and error identically. */
const fieldClass = (hasError, isFocused) =>
  [
    'w-full pl-11 pr-4 py-3.5 rounded-2xl border text-sm transition-all duration-200',
    'placeholder:text-gray-400 outline-none',
    hasError
      ? 'border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-4 focus:ring-red-100'
      : isFocused
      ? 'border-[#7A0000] bg-white ring-4 ring-[#7A0000]/10'
      : 'border-[#F0E2DC] bg-[#FBF8F7] hover:border-[#E8D3CB] hover:bg-white',
  ].join(' ');

export default ContactPage;