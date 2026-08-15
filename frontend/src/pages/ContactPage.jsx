import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { MapPin, Phone, Mail } from 'lucide-react';
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

  return (
    <div 
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #faf8f5 0%, #ffffff 50%, #faf8f5 100%)' }}
    >
      {/* Header */}
      <div className="pt-24 pb-6 text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
          className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light"
          style={{ color: '#7A0000' }}
        >
          {t.contactTitle || 'Get in Touch'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-4 text-base sm:text-lg text-mute max-w-xl mx-auto leading-relaxed"
        >
          {t.contactSubtitle || 'We would love to hear from you. Reach out to us for any inquiries or blessings.'}
        </motion.p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="space-y-10">
          {/* Two 50% frames - left side: form, right side: contact info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* LEFT - Message Form (heading inside) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="relative group transition-all duration-300 h-full"
              whileHover={{ y: -2 }}
            >
              <div
                className="absolute -top-0 left-0 right-0 h-1.5 rounded-t-xl z-10"
                style={{ background: '#7A0000' }}
              />
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-10 pt-8 h-full transition-all duration-300 group-hover:bg-[#f5f0eb] group-hover:shadow-xl">
                <h2 className="font-serif text-2xl sm:text-3xl mb-2" style={{ color: '#7A0000' }}>
                  {t.contactMessage || 'Send us a Message'}
                </h2>
                <p className="text-sm text-mute mb-8">
                  {t.contactSubtitle || 'We would love to hear from you. Reach out to us for any inquiries or blessings.'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name Field */}
                  <div>
                    <label className="block text-xs font-medium text-mute mb-1.5 uppercase tracking-wider">
                      {t.contactYourName || 'Your Name'}
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t.contactNamePlaceholder || 'Enter your name'}
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                        errors.name 
                          ? 'border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 focus:border-vermilion focus:ring-vermilion/20'
                      } group-hover:bg-white`}
                    />
                    {errors.name && (
                      <span className="text-xs mt-1 block text-red-600">{errors.name}</span>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-xs font-medium text-mute mb-1.5 uppercase tracking-wider">
                      {t.contactYourEmail || 'Your Email'}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t.contactEmailPlaceholder || 'Enter your email'}
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                        errors.email 
                          ? 'border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 focus:border-vermilion focus:ring-vermilion/20'
                      } group-hover:bg-white`}
                    />
                    {errors.email && (
                      <span className="text-xs mt-1 block text-red-600">{errors.email}</span>
                    )}
                  </div>

                  {/* Message Field */}
                  <div>
                    <label className="block text-xs font-medium text-mute mb-1.5 uppercase tracking-wider">
                      {t.contactYourMessage || 'Your Message'}
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder={t.contactMsgPlaceholder || 'Write your message here...'}
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 resize-none ${
                        errors.message 
                          ? 'border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 focus:border-vermilion focus:ring-vermilion/20'
                      } group-hover:bg-white`}
                    />
                    {errors.message && (
                      <span className="text-xs mt-1 block text-red-600">{errors.message}</span>
                    )}
                  </div>

                  {/* Submit Button - Red-Brown on Hover */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-8 py-3.5 text-sm font-semibold text-white rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: '#7A0000' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#5a0000'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#7A0000'; }}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t.contactSending || 'Sending...'}
                      </span>
                    ) : (
                      t.contactSend || 'Send Message'
                    )}
                  </button>
                </form>
              </div>
            </motion.div>

            {/* RIGHT - Address, Phone, Email + Map */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="snake-border rounded-xl"
            >
              <div className="rounded-xl overflow-hidden bg-white h-full flex flex-col">
                <div className="p-6 sm:p-8 space-y-8 flex-1">
                  {/* Address */}
                  <div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: '#7A0000' }}>
                      <MapPin size={18} className="text-white" />
                    </div>
                    <h3 className="font-serif text-lg mb-1.5" style={{ color: '#7A0000' }}>
                      {t.contactAddress || 'Address'}
                    </h3>
                    <a
                      href="https://www.google.com/maps?q=Battisputali,Kathmandu,Nepal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-mute hover:text-ink transition-colors leading-relaxed block"
                    >
                      {t.templeAddressLine || 'Battisputali, Gaushala, Kathmandu 44600, Nepal'}
                    </a>
                  </div>

                  {/* Phone */}
                  <div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: '#7A0000' }}>
                      <Phone size={18} className="text-white" />
                    </div>
                    <h3 className="font-serif text-lg mb-1.5" style={{ color: '#7A0000' }}>
                      {t.contactPhone || 'Phone'}
                    </h3>
                    <a
                      href="tel:+97714598526"
                      className="text-sm text-mute hover:text-ink transition-colors inline-block"
                    >
                      +977-1-4598526
                    </a>
                  </div>

                  {/* Email */}
                  <div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: '#7A0000' }}>
                      <Mail size={18} className="text-white" />
                    </div>
                    <h3 className="font-serif text-lg mb-1.5" style={{ color: '#7A0000' }}>
                      {t.contactEmail || 'Email'}
                    </h3>
                    <a
                      href="mailto:shreramchandra@gmail.com"
                      className="text-sm text-mute hover:text-ink transition-colors inline-block break-all"
                    >
                      shreramchandra@gmail.com
                    </a>
                  </div>
                </div>

                {/* Map */}
                <div className="h-52">
                  <iframe
                    title="Shree Ramchandra Mandir Location"
                    className="w-full h-full"
                    src="https://www.google.com/maps?q=Battisputali,Kathmandu,Nepal&output=embed"
                    loading="lazy"
                    style={{ border: 0 }}
                    allowFullScreen
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;