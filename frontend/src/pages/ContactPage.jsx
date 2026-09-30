import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { MapPin, Phone, Mail, Send, User, AtSign, MessageSquare, Clock, Sun } from 'lucide-react';
import api from '../services/api';

const ContactPage = () => {
  const { t, lang } = useLanguage();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
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
      showToast(error.response?.data?.message || t.contactError || 'Failed to send message', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const contactItems = [
    {
      label: t.contactAddress || 'Address',
      value: t.templeAddressLine || 'Battisputali, Gaushala, Kathmandu 44600, Nepal',
      icon: MapPin,
      href: 'https://www.google.com/maps?q=Battisputali,Kathmandu,Nepal',
      external: true,
      color: '#7A0000',
      tint: 'rgba(122,0,0,0.08)',
      glow: 'rgba(122,0,0,0.25)',
    },
    {
      label: t.contactPhone || 'Phone',
      value: '+977-1-4598526',
      icon: Phone,
      href: 'tel:+97714598526',
      color: '#9A3412',
      tint: 'rgba(154,52,18,0.08)',
      glow: 'rgba(154,52,18,0.25)',
    },
    {
      label: t.contactEmail || 'Email',
      value: 'shreramchandra@gmail.com',
      icon: Mail,
      href: 'mailto:shreramchandra@gmail.com',
      color: '#8A1D2B',
      tint: 'rgba(138,29,43,0.08)',
      glow: 'rgba(138,29,43,0.25)',
    },
  ];

  const contactHeading = {
    en: 'Contact Information',
    ne: 'सम्पर्क जानकारी',
    hi: 'संपर्क जानकारी',
    zh: '联系信息',
    ta: 'தொடர்பு தகவல்',
  }[lang] || 'Contact Information';

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#ffffff' }}>
      {/* Red-brown soft gradient blobs */}
      <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(122,0,0,0.12), transparent 70%)' }} />
      <div className="absolute top-1/3 -right-40 w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(154,52,18,0.10), transparent 70%)' }} />
      <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(138,29,43,0.10), transparent 70%)' }} />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[560px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(122,0,0,0.07), transparent 70%)' }} />

      <div className="relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-24">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-5"
          >
            <h1
              className="font-serif text-4xl sm:text-5xl font-light leading-tight inline-block"
              style={{
                background: 'linear-gradient(120deg, #7A0000 0%, #A23A2E 50%, #5B1420 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {t.contactTitle || 'Get in Touch'}
            </h1>
            <p className="text-sm text-gray-400 mt-3">
              {t.contactSubtitle || 'We would love to hear from you.'}
            </p>
          </motion.div>

          {/* Red-brown gradient divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7 }}
            className="mx-auto mb-12 h-1 rounded-full"
            style={{
              width: 140,
              background: 'linear-gradient(90deg, #7A0000, #A23A2E, #5B1420, #9A3412)',
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
            {/* LEFT - Message Form */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="rounded-[28px] border border-gray-100 bg-white p-6 sm:p-10 h-full flex flex-col transition-all duration-300 hover:shadow-[0_24px_70px_-24px_rgba(122,0,0,0.22)]"
              style={{ boxShadow: '0 10px 44px -18px rgba(0,0,0,0.1)' }}
            >
              {/* Red-brown top accent strip */}
              <div className="h-[5px] -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 mb-7 rounded-t-[28px]"
                style={{ background: 'linear-gradient(90deg, #7A0000, #A23A2E 35%, #9A3412 70%, #5B1420)' }} />

              <div className="flex items-center gap-3 mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.35, type: 'spring', stiffness: 200 }}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7A0000, #A23A2E)', boxShadow: '0 8px 20px -6px rgba(122,0,0,0.5)' }}
                >
                  <Send size={18} className="text-white" />
                </motion.div>
                <div>
                  <h2 className="font-serif text-2xl sm:text-[1.7rem] leading-tight" style={{ color: '#111827' }}>
                    {t.contactMessage || 'Send us a Message'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.contactSubtitle || 'We usually reply within a day.'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 flex flex-col flex-1">
                {/* Name Field */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-[0.14em]">
                    {t.contactYourName || 'Your Name'}
                  </label>
                  <div className="relative">
                    <User size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t.contactNamePlaceholder || 'Enter your name'}
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm transition-all duration-200 focus:outline-none bg-[#FAF4F0] placeholder:text-gray-400 focus:bg-white ${
                        errors.name
                          ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100'
                          : 'border-[#F0E2DC] hover:border-[#E8D3CB] focus:border-[#7A0000] focus:ring-4 focus:ring-[#7A0000]/10 focus:shadow-[0_6px_18px_-6px_rgba(122,0,0,0.2)]'
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <span className="text-xs mt-1.5 block text-red-600">{errors.name}</span>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-[0.14em]">
                    {t.contactYourEmail || 'Your Email'}
                  </label>
                  <div className="relative">
                    <AtSign size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t.contactEmailPlaceholder || 'Enter your email'}
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm transition-all duration-200 focus:outline-none bg-[#FAF4F0] placeholder:text-gray-400 focus:bg-white ${
                        errors.email
                          ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100'
                          : 'border-[#F0E2DC] hover:border-[#E8D3CB] focus:border-[#7A0000] focus:ring-4 focus:ring-[#7A0000]/10 focus:shadow-[0_6px_18px_-6px_rgba(122,0,0,0.2)]'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <span className="text-xs mt-1.5 block text-red-600">{errors.email}</span>
                  )}
                </div>

                {/* Message Field */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-[0.14em]">
                    {t.contactYourMessage || 'Your Message'}
                  </label>
                  <div className="relative">
                    <MessageSquare size={17} className="absolute left-4 top-3.5 text-gray-300 pointer-events-none" />
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder={t.contactMsgPlaceholder || 'Write your message here...'}
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm transition-all duration-200 focus:outline-none resize-none bg-[#FAF4F0] placeholder:text-gray-400 focus:bg-white ${
                        errors.message
                          ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100'
                          : 'border-[#F0E2DC] hover:border-[#E8D3CB] focus:border-[#7A0000] focus:ring-4 focus:ring-[#7A0000]/10 focus:shadow-[0_6px_18px_-6px_rgba(122,0,0,0.2)]'
                      }`}
                    />
                  </div>
                  {errors.message && (
                    <span className="text-xs mt-1.5 block text-red-600">{errors.message}</span>
                  )}
                </div>

                <div className="flex-1" />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group w-full px-8 py-4 text-sm font-semibold text-white rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-10px_rgba(122,0,0,0.55)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  style={{
                    background: 'linear-gradient(120deg, #7A0000 0%, #8A1D2B 45%, #5B1420 100%)',
                    boxShadow: '0 8px 26px -8px rgba(122,0,0,0.5)',
                  }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t.contactSending || 'Sending...'}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {t.contactSend || 'Send Message'}
                      <Send size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  )}
                </button>
              </form>
            </motion.div>

            {/* RIGHT - Contact Info + Map */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="rounded-[28px] border border-gray-100 bg-white p-6 sm:p-8 h-full flex flex-col transition-all duration-300 hover:shadow-[0_24px_70px_-24px_rgba(122,0,0,0.20)]"
              style={{ boxShadow: '0 10px 44px -18px rgba(0,0,0,0.1)' }}
            >
              {/* Red-brown top accent strip */}
              <div className="h-[5px] -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-7 rounded-t-[28px]"
                style={{ background: 'linear-gradient(90deg, #5B1420, #9A3412 40%, #7A0000 75%, #A23A2E)' }} />

              <div className="flex items-center gap-3 mb-7">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.45, type: 'spring', stiffness: 200 }}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #5B1420, #7A0000)', boxShadow: '0 8px 20px -6px rgba(91,20,32,0.5)' }}
                >
                  <Sun size={18} className="text-white" />
                </motion.div>
                <div>
                  <h2 className="font-serif text-2xl sm:text-[1.7rem] leading-tight" style={{ color: '#111827' }}>
                    {contactHeading}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.contactSubtitle || 'Find us easily.'}
                  </p>
                </div>
              </div>

              {/* Contact items - red-brown tiles */}
              <div className="space-y-3">
                {contactItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.45, delay: 0.5 + index * 0.1 }}
                    >
                      <a
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noopener noreferrer' : undefined}
                        className="group flex items-center gap-4 p-4 rounded-2xl bg-[#FAFAFA] border border-gray-100 transition-all duration-300 hover:bg-white hover:-translate-y-0.5"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = item.color + '33';
                          e.currentTarget.style.boxShadow = `0 8px 24px -8px ${item.glow}`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#f3f4f6';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                          style={{ background: item.tint }}
                        >
                          <Icon size={18} style={{ color: item.color }} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.16em] mb-0.5 transition-colors" style={{ color: item.color }}>
                            {item.label}
                          </h3>
                          <p className="text-[13px] font-medium text-gray-600 group-hover:text-gray-900 transition-colors break-words leading-snug">
                            {item.value}
                          </p>
                        </div>
                        <span className="ml-auto font-bold transition-all duration-300 text-sm" style={{ color: item.color + '55' }}>
                          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                        </span>
                      </a>
                    </motion.div>
                  );
                })}
              </div>

              {/* Response note */}
              <div className="mt-5 flex items-center gap-2.5 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(122,0,0,0.06)', border: '1px solid rgba(122,0,0,0.15)' }}>
                <Clock size={14} className="flex-shrink-0" style={{ color: '#7A0000' }} />
                <span className="text-[11px] font-medium text-gray-500">
                  We typically respond within 24 hours
                </span>
              </div>

              <div className="flex-1" />

              {/* Map */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="mt-6 h-52 rounded-2xl overflow-hidden border border-gray-100"
                style={{ boxShadow: '0 6px 20px -10px rgba(0,0,0,0.08)' }}
              >
                <iframe
                  title="Shree Ramchandra Mandir Location"
                  className="w-full h-full"
                  src="https://www.google.com/maps?q=Battisputali,Kathmandu,Nepal&output=embed"
                  loading="lazy"
                  style={{ border: 0 }}
                  allowFullScreen
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;