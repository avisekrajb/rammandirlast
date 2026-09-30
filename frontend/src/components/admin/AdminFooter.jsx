import React, { useState, useRef } from 'react';
import { 
  Save, Upload, X, Image, Trash2, Eye, EyeOff, Edit, RefreshCw, 
  Link2, Globe, Phone, Mail, MapPin, Heart, Settings, 
  LayoutDashboard, Home, Users, Calendar, Clock, Quote, Info, 
  ScrollText, Gift, Bell, Cloud, FolderOpen, BookOpen, 
  Shield, CreditCard, Menu, ChevronDown, User, Video, Languages,
  Map
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import api from '../../services/api';
import OmLoader from '../../components/common/OmLoader';

const AdminFooter = ({ settings, updateSettings, t }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeLang, setActiveLang] = useState('en');
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Footer settings state
  const [footerSettings, setFooterSettings] = useState(settings?.footer || {
    enabled: true,
    bgType: 'color',
    bgColor: '#ffffff',
    bgImage: null,
    bgVideo: null,
    logoShape: 'circle',
    logoSize: 'md',
    showSocial: true,
    showQuickLinks: true,
    showContact: true,
    showSupport: true,
    showMap: true,
    showSubscribe: true,
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3532.245849736379!2d85.3221176!3d27.7170489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb190c9f5c8d7b%3A0x4f8b3f8b3f8b3f8b!2sGaushala%2C%20Kathmandu%2044600!5e0!3m2!1sen!2snp!4v1700000000000',
    socialLinks: {
      facebook: { enabled: true, url: 'https://facebook.com' },
      youtube: { enabled: true, url: 'https://youtube.com' },
      instagram: { enabled: true, url: 'https://instagram.com' },
      twitter: { enabled: true, url: 'https://twitter.com' },
    },
    contactInfo: {
      phone: '+977-1-4XXXXXX',
      email: 'info@ramchandratemple.org.np',
      address: { 
        en: 'Battisputali, Gaushala, Kathmandu, Nepal',
        ne: 'बत्तिसपुतली, गौशाला, काठमाडौं, नेपाल',
        hi: 'बत्तीसपुतली, गौशाला, काठमाडौं, नेपाल',
        zh: '尼泊尔加德满都巴提斯普塔利',
        ta: 'பட்டீஸ்புதாலி, கௌஷாலா, காத்மாண்டு, நேபாளம்'
      },
    },
    footerText: {
      rights: { 
        en: 'All rights reserved.',
        ne: 'सबै अधिकार सुरक्षित।',
        hi: 'सभी अधिकार सुरक्षित।',
        zh: '版权所有。',
        ta: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.'
      },
      blessing: { 
        en: 'Jai Shree Ram',
        ne: 'जय श्री राम',
        hi: 'जय श्री राम',
        zh: '斋·什里·拉姆',
        ta: 'ஜெய் ஸ்ரீ ராம்'
      },
    },
    // Navigation buttons without icons - Fixed with proper initialization
    navButtons: [
      { label: { en: 'Home', ne: 'गृह', hi: 'होम', zh: '首页', ta: 'முகப்பு' }, path: '/' },
      { label: { en: 'About', ne: 'बारे', hi: 'के बारे में', zh: '关于', ta: 'பற்றி' }, path: '/about' },
      { label: { en: 'History', ne: 'इतिहास', hi: 'इतिहास', zh: '历史', ta: 'வரலாறு' }, path: '/history' },
      { label: { en: 'Events', ne: 'कार्यक्रम', hi: 'आयोजन', zh: '活动', ta: 'நிகழ்வுகள்' }, path: '/events' },
      { label: { en: 'Gallery', ne: 'ग्यालरी', hi: 'गैलरी', zh: '画廊', ta: 'கேலரி' }, path: '/gallery' },
      { label: { en: 'Contact', ne: 'सम्पर्क', hi: 'संपर्क', zh: '联系', ta: 'தொடர்பு' }, path: '/contact' },
      { label: { en: 'Donate', ne: 'दान', hi: 'दान', zh: '捐赠', ta: 'நன்கொடை' }, path: '/donate' },
      { label: { en: 'Team', ne: 'टोली', hi: 'टीम', zh: '团队', ta: 'குழு' }, path: '/templeteams' },
    ],
  });

  const getLocalizedText = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[activeLang] || obj.en || '';
  };

  // Handle Image Upload
  const handleBgImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      showToast('Please select an image file', 'warning');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (JPG, PNG, WEBP)', 'error');
      e.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be less than 10MB', 'error');
      e.target.value = '';
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/admin/upload/footer', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      
      if (response.data && response.data.url) {
        setFooterSettings({ 
          ...footerSettings, 
          bgImage: response.data.url, 
          bgType: 'image' 
        });
        showToast('Background image uploaded successfully', 'success');
      } else {
        showToast(response.data?.message || 'Upload failed', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      let errorMsg = 'Upload failed. Please try again.';
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMsg = 'Upload timed out. Please try with a smaller file.';
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message === 'Network Error') {
        errorMsg = 'Network error. Please check your connection and try again.';
      }
      showToast(errorMsg, 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Handle Video Upload - For footer top banner only
  const handleBgVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      showToast('Please select a video file', 'warning');
      return;
    }

    if (!file.type.startsWith('video/')) {
      showToast('Please upload a video file (MP4, MOV)', 'error');
      e.target.value = '';
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      showToast('Video must be less than 100MB', 'error');
      e.target.value = '';
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await api.post('/admin/upload/footer/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });
      
      if (response.data && response.data.url) {
        setFooterSettings({ 
          ...footerSettings, 
          bgVideo: response.data.url, 
          bgType: 'video' 
        });
        showToast('Background video uploaded successfully', 'success');
      } else {
        showToast(response.data?.message || 'Upload failed', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      let errorMsg = 'Upload failed. Please try again.';
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMsg = 'Upload timed out. Please try with a smaller video file.';
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message === 'Network Error') {
        errorMsg = 'Network error. Please check your connection and try again.';
      }
      showToast(errorMsg, 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSettings({ footer: footerSettings });
      showToast('Footer settings saved successfully', 'success');
    } catch (error) {
      console.error('Save error:', error);
      let errorMsg = 'Failed to save settings. Please try again.';
      if (error.message === 'Network Error') {
        errorMsg = 'Network error. Please check your connection and try again.';
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBg = () => {
    setFooterSettings({ 
      ...footerSettings, 
      bgImage: null, 
      bgVideo: null, 
      bgType: 'color' 
    });
    showToast('Background removed', 'success');
  };

  // Trigger file input for image
  const triggerImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Trigger file input for video
  const triggerVideoUpload = () => {
    if (videoInputRef.current) {
      videoInputRef.current.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Enable/Disable */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-serif font-semibold text-ink">Footer Settings</h4>
            <p className="text-sm text-ink-soft">Enable or disable the footer globally</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={footerSettings.enabled}
              onChange={(e) => setFooterSettings({ ...footerSettings, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-vermilion/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vermilion"></div>
            <span className="ml-3 text-sm font-medium text-ink-soft">
              {footerSettings.enabled ? 'Active' : 'Disabled'}
            </span>
          </label>
        </div>
      </div>

      {/* Background Settings - Video only for footer top banner */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
        <h4 className="text-lg font-serif font-semibold text-ink mb-4">Footer Top Banner Background</h4>
        <p className="text-sm text-ink-soft mb-4">Video will play only at the top of footer (Jai Shree Ram banner area)</p>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['color', 'image', 'video'].map((type) => (
            <button
              key={type}
              onClick={() => setFooterSettings({ ...footerSettings, bgType: type })}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                footerSettings.bgType === type 
                  ? 'border-vermilion bg-vermilion/5 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`text-sm font-medium ${footerSettings.bgType === type ? 'text-vermilion' : 'text-ink'}`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </div>
              <div className="text-xs text-ink-soft mt-1">
                {type === 'color' ? 'Solid color' : type === 'image' ? 'Upload image' : 'Upload video'}
              </div>
            </button>
          ))}
        </div>

        {footerSettings.bgType === 'color' && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <label className="text-sm font-medium text-ink">Color</label>
            <input
              type="color"
              value={footerSettings.bgColor}
              onChange={(e) => setFooterSettings({ ...footerSettings, bgColor: e.target.value })}
              className="w-14 h-14 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-vermilion transition-colors"
            />
            <span className="text-sm text-ink-soft">{footerSettings.bgColor}</span>
          </div>
        )}

        {(footerSettings.bgType === 'image' || footerSettings.bgType === 'video') && (
          <div className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 hover:border-vermilion transition-colors">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleBgImageUpload}
              className="hidden"
            />
            <input
              type="file"
              ref={videoInputRef}
              accept="video/*"
              onChange={handleBgVideoUpload}
              className="hidden"
            />
            
            <div className="relative">
              {footerSettings.bgType === 'image' && footerSettings.bgImage ? (
                <div className="relative">
                  <div className="w-full max-h-48 overflow-hidden bg-gray-100">
                    <img 
                      src={footerSettings.bgImage} 
                      alt="Background" 
                      className="w-full h-auto max-h-48 object-cover object-center"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 flex flex-wrap items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity p-4">
                    <button
                      onClick={triggerImageUpload}
                      className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2"
                    >
                      <Upload size={16} /> Change
                    </button>
                    <button
                      onClick={handleRemoveBg}
                      className="px-3 py-2 bg-red-500/70 hover:bg-red-500 text-white rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2"
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    Preview
                  </div>
                </div>
              ) : footerSettings.bgType === 'video' && footerSettings.bgVideo ? (
                <div className="relative">
                  <div className="w-full max-h-48 overflow-hidden bg-gray-900">
                    <video 
                      src={footerSettings.bgVideo} 
                      className="w-full h-auto max-h-48 object-cover object-center"
                      muted 
                      playsInline
                      loop
                      autoPlay
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 flex flex-wrap items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity p-4">
                    <button
                      onClick={triggerVideoUpload}
                      className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2"
                    >
                      <Upload size={16} /> Change
                    </button>
                    <button
                      onClick={handleRemoveBg}
                      className="px-3 py-2 bg-red-500/70 hover:bg-red-500 text-white rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2"
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Video size={12} /> Preview
                  </div>
                </div>
              ) : (
                <div 
                  className="flex flex-col items-center justify-center h-48 cursor-pointer p-4"
                  onClick={footerSettings.bgType === 'image' ? triggerImageUpload : triggerVideoUpload}
                >
                  <div className="flex flex-col items-center gap-2 text-ink-soft text-center">
                    {footerSettings.bgType === 'image' ? <Image size={40} className="opacity-50" /> : <Video size={40} className="opacity-50" />}
                    <span className="text-sm font-medium">
                      Click to upload {footerSettings.bgType}
                    </span>
                    <span className="text-xs text-ink-soft/60">
                      {footerSettings.bgType === 'image' ? 'JPG, PNG, WEBP • Max 10MB' : 'MP4, MOV • Max 100MB'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        footerSettings.bgType === 'image' ? triggerImageUpload() : triggerVideoUpload();
                      }}
                      className="mt-2 px-4 py-2 bg-vermilion text-white rounded-lg text-sm font-medium hover:bg-[#a83a0c] transition-all flex items-center gap-2"
                    >
                      <Upload size={16} /> Choose File
                    </button>
                  </div>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <OmLoader size="lg" color="white" className="mx-auto mb-2" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logo Settings */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
        <h4 className="text-lg font-serif font-semibold text-ink mb-4">Logo Settings</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Shape</label>
            <select
              value={footerSettings.logoShape}
              onChange={(e) => setFooterSettings({ ...footerSettings, logoShape: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
            >
              <option value="circle">Circle</option>
              <option value="square">Square</option>
              <option value="rectangle">Rectangle</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Size</label>
            <select
              value={footerSettings.logoSize}
              onChange={(e) => setFooterSettings({ ...footerSettings, logoSize: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Buttons - No Icons, Clean Design */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
        <h4 className="text-lg font-serif font-semibold text-ink mb-4 flex items-center gap-2">
          <Link2 size={20} className="text-vermilion" />
          Navigation Buttons
        </h4>
        <p className="text-sm text-ink-soft mb-4">Customize navigation buttons without icons</p>
        
        {footerSettings.navButtons && footerSettings.navButtons.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {footerSettings.navButtons.map((btn, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-vermilion/30 transition-all">
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1">Label ({activeLang})</label>
                    <input
                      type="text"
                      value={getLocalizedText(btn.label)}
                      onChange={(e) => {
                        const newNavButtons = [...footerSettings.navButtons];
                        newNavButtons[index].label[activeLang] = e.target.value;
                        setFooterSettings({ ...footerSettings, navButtons: newNavButtons });
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-white"
                      placeholder="Button label"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1">Path</label>
                    <input
                      type="text"
                      value={btn.path}
                      onChange={(e) => {
                        const newNavButtons = [...footerSettings.navButtons];
                        newNavButtons[index].path = e.target.value;
                        setFooterSettings({ ...footerSettings, navButtons: newNavButtons });
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-white"
                      placeholder="/path"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const newNavButtons = footerSettings.navButtons.filter((_, i) => i !== index);
                      setFooterSettings({ ...footerSettings, navButtons: newNavButtons });
                      showToast('Navigation button removed', 'success');
                    }}
                    className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors text-left flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-ink-soft">
            <p>No navigation buttons added yet.</p>
          </div>
        )}
        
        <button
          onClick={() => {
            const newNavButtons = [...(footerSettings.navButtons || [])];
            newNavButtons.push({ 
              label: { en: 'New Page', ne: 'नयाँ पृष्ठ', hi: 'नया पेज', zh: '新页面', ta: 'புதிய பக்கம்' }, 
              path: '/new-page' 
            });
            setFooterSettings({ ...footerSettings, navButtons: newNavButtons });
            showToast('New navigation button added', 'success');
          }}
          className="mt-4 px-4 py-2 bg-vermilion/10 text-vermilion rounded-lg text-sm font-medium hover:bg-vermilion/20 transition-all flex items-center gap-2"
        >
          + Add Navigation Button
        </button>
      </div>

      {/* Multi-language Footer Text */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
        <h4 className="text-lg font-serif font-semibold text-ink mb-4 flex items-center gap-2">
          <Languages size={20} className="text-vermilion" />
          Footer Text (Multi-language)
        </h4>
        
        <LanguageSwitcher active={activeLang} onChange={setActiveLang} t={t} />

        <div className="space-y-4 mt-4">
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Rights Text</label>
            <input
              type="text"
              value={footerSettings.footerText?.rights?.[activeLang] || ''}
              onChange={(e) => setFooterSettings({
                ...footerSettings,
                footerText: {
                  ...footerSettings.footerText,
                  rights: { ...footerSettings.footerText?.rights, [activeLang]: e.target.value }
                }
              })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
              placeholder="All rights reserved."
            />
          </div>
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Blessing Text</label>
            <input
              type="text"
              value={footerSettings.footerText?.blessing?.[activeLang] || ''}
              onChange={(e) => setFooterSettings({
                ...footerSettings,
                footerText: {
                  ...footerSettings.footerText,
                  blessing: { ...footerSettings.footerText?.blessing, [activeLang]: e.target.value }
                }
              })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
              placeholder="Jai Shree Ram"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Address</label>
            <input
              type="text"
              value={footerSettings.contactInfo?.address?.[activeLang] || ''}
              onChange={(e) => setFooterSettings({
                ...footerSettings,
                contactInfo: {
                  ...footerSettings.contactInfo,
                  address: { ...footerSettings.contactInfo?.address, [activeLang]: e.target.value }
                }
              })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
              placeholder="Battisputali, Gaushala, Kathmandu, Nepal"
            />
          </div>
        </div>
      </div>

      {/* Sections Toggle */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
        <h4 className="text-lg font-serif font-semibold text-ink mb-4">Sections</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { key: 'showSocial', label: 'Social Links', icon: <Globe size={16} /> },
            { key: 'showQuickLinks', label: 'Quick Links', icon: <Link2 size={16} /> },
            { key: 'showContact', label: 'Contact Info', icon: <Phone size={16} /> },
            { key: 'showSupport', label: 'Support', icon: <Heart size={16} /> },
            { key: 'showMap', label: 'Map', icon: <Map size={16} /> },
            { key: 'showSubscribe', label: 'Subscribe', icon: <Mail size={16} /> },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={footerSettings[item.key] !== false}
                onChange={(e) => setFooterSettings({ ...footerSettings, [item.key]: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-vermilion focus:ring-vermilion"
              />
              <span className="flex items-center gap-1.5 text-sm text-ink-soft">
                {item.icon} {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
        <h4 className="text-lg font-serif font-semibold text-ink mb-4 flex items-center gap-2">
          <Phone size={20} className="text-vermilion" />
          Contact Information
        </h4>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5 flex items-center gap-1">
              <Phone size={14} className="text-ink-soft" /> Phone
            </label>
            <input
              type="text"
              value={footerSettings.contactInfo?.phone || ''}
              onChange={(e) => setFooterSettings({ 
                ...footerSettings, 
                contactInfo: { ...footerSettings.contactInfo, phone: e.target.value } 
              })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
              placeholder="+977-1-4XXXXXX"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5 flex items-center gap-1">
              <Mail size={14} className="text-ink-soft" /> Email
            </label>
            <input
              type="text"
              value={footerSettings.contactInfo?.email || ''}
              onChange={(e) => setFooterSettings({ 
                ...footerSettings, 
                contactInfo: { ...footerSettings.contactInfo, email: e.target.value } 
              })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
              placeholder="info@ramchandratemple.org.np"
            />
          </div>
        </div>
      </div>

      {/* Map Settings - Fixed to show in footer */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
        <h4 className="text-lg font-serif font-semibold text-ink mb-4 flex items-center gap-2">
          <Map size={20} className="text-vermilion" />
          Map Settings
        </h4>
        <p className="text-sm text-ink-soft mb-4">Map will display in footer if enabled</p>
        <div>
          <label className="text-xs font-bold text-ink block mb-1.5 flex items-center gap-1">
            <MapPin size={14} className="text-ink-soft" /> Google Maps Embed URL
          </label>
          <input
            type="text"
            value={footerSettings.mapUrl || ''}
            onChange={(e) => setFooterSettings({ ...footerSettings, mapUrl: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
            placeholder="https://www.google.com/maps/embed?pb=..."
          />
          <p className="text-xs text-ink-soft/60 mt-2">
            Get embed URL from Google Maps → Share → Embed a map
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-vermilion to-maroon-deep text-white font-semibold text-sm hover:shadow-lg hover:shadow-vermilion/20 transition-all disabled:opacity-50 hover:-translate-y-0.5"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Footer Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminFooter;