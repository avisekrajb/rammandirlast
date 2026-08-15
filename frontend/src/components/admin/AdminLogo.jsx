import React, { useState, useRef, useEffect } from 'react';
import { Save, Image, Upload, Trash2, Eye, EyeOff, Settings, Layout, Type, Palette, MapPin } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import api from '../../services/api';

const AdminLogo = ({ settings, updateSettings, t }) => {
  const { showToast } = useToast();
  const [activeLang, setActiveLang] = useState('en');
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Logo settings
  const [logoPhoto, setLogoPhoto] = useState(settings?.logo?.photo || null);
  const [logoText, setLogoText] = useState({});
  
  // Logo size settings - MODERN approach with max constraints
  const [logoSize, setLogoSize] = useState(settings?.logo?.size || 'w-12 h-12');
  const [logoShape, setLogoShape] = useState(settings?.logo?.shape || 'rounded-xl');
  const [logoBgColor, setLogoBgColor] = useState(settings?.logo?.bgColor || 'from-vermilion to-maroon-deep');
  const [showText, setShowText] = useState(settings?.logo?.showText !== false);
  const [textColor, setTextColor] = useState(settings?.logo?.textColor || 'text-maroon');
  const [textSize, setTextSize] = useState(settings?.logo?.textSize || 'text-sm md:text-base');
  const [fontWeight, setFontWeight] = useState(settings?.logo?.fontWeight || 'font-bold');
  const [showLocation, setShowLocation] = useState(settings?.logo?.showLocation !== false);
  const [logoMaxWidth, setLogoMaxWidth] = useState(settings?.logo?.maxWidth || 'max-w-[40px] sm:max-w-[50px]');

  // Initialize logo text from settings
  useEffect(() => {
    if (settings?.logo?.text) {
      setLogoText(settings.logo.text);
    } else {
      setLogoText({ 
        en: 'Shree Ramchandra', 
        ne: 'श्री रामचन्द्र', 
        hi: 'श्री रामचन्द्र', 
        zh: '室利罗摩钱德拉', 
        ta: 'ஸ்ரீ ராமச்சந்திர' 
      });
    }
  }, [settings]);

  const handleLangChange = (lang) => {
    setActiveLang(lang);
  };

  const getLocalizedText = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[activeLang] || obj.en || '';
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be less than 5MB', 'error');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/admin/upload/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLogoPhoto(response.data.url);
      await updateSettings({ 
        logo: { 
          ...settings?.logo, 
          photo: response.data.url,
          text: logoText,
          size: logoSize,
          shape: logoShape,
          bgColor: logoBgColor,
          showText: showText,
          textColor: textColor,
          textSize: textSize,
          fontWeight: fontWeight,
          showLocation: showLocation,
          maxWidth: logoMaxWidth,
        } 
      });
      showToast(t.photoUploaded || 'Logo uploaded successfully', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      showToast(error.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setLoading(false);
    }
    e.target.value = '';
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Remove logo image?')) return;
    setLogoPhoto(null);
    await updateSettings({ 
      logo: { 
        ...settings?.logo, 
        photo: null,
        text: logoText,
        size: logoSize,
        shape: logoShape,
        bgColor: logoBgColor,
        showText: showText,
        textColor: textColor,
        textSize: textSize,
        fontWeight: fontWeight,
        showLocation: showLocation,
        maxWidth: logoMaxWidth,
      } 
    });
    showToast('Logo removed', 'success');
  };

  const handleSave = async () => {
    try {
      const newLogo = {
        ...settings?.logo,
        text: logoText,
        photo: logoPhoto,
        size: logoSize,
        shape: logoShape,
        bgColor: logoBgColor,
        showText: showText,
        textColor: textColor,
        textSize: textSize,
        fontWeight: fontWeight,
        showLocation: showLocation,
        maxWidth: logoMaxWidth,
      };
      await updateSettings({ logo: newLogo });
      showToast(t.savedSuccess || 'Logo settings saved successfully', 'success');
    } catch (error) {
      console.error('Save logo error:', error);
      showToast(error.response?.data?.message || 'Failed to save logo', 'error');
    }
  };

  // Shape options
  const shapeOptions = [
    { value: 'rounded', label: 'Soft Round' },
    { value: 'rounded-xl', label: 'Rounded' },
    { value: 'rounded-2xl', label: 'Extra Round' },
    { value: 'rounded-full', label: 'Circle' },
    { value: 'rounded-none', label: 'Square' },
  ];

  // Size options - MODERN sizes with max width constraints
  const sizeOptions = [
    { value: 'w-8 h-8', label: 'XS (32px)', maxW: 'max-w-[32px]' },
    { value: 'w-10 h-10', label: 'Small (40px)', maxW: 'max-w-[40px]' },
    { value: 'w-12 h-12', label: 'Medium (48px)', maxW: 'max-w-[48px]' },
    { value: 'w-14 h-14', label: 'Large (56px)', maxW: 'max-w-[56px]' },
    { value: 'w-16 h-16', label: 'XL (64px)', maxW: 'max-w-[64px]' },
    { value: 'w-20 h-20', label: '2XL (80px)', maxW: 'max-w-[80px]' },
  ];

  // Text size options
  const textSizeOptions = [
    { value: 'text-[8px] sm:text-[10px]', label: 'XS' },
    { value: 'text-[10px] sm:text-xs', label: 'Small' },
    { value: 'text-xs sm:text-sm', label: 'Medium' },
    { value: 'text-sm sm:text-base', label: 'Large' },
    { value: 'text-base sm:text-lg', label: 'XL' },
    { value: 'text-lg sm:text-xl', label: '2XL' },
  ];

  // Font weight options
  const fontWeightOptions = [
    { value: 'font-medium', label: 'Medium' },
    { value: 'font-semibold', label: 'Semi Bold' },
    { value: 'font-bold', label: 'Bold' },
    { value: 'font-extrabold', label: 'Extra Bold' },
  ];

  // Color options
  const colorOptions = [
    { value: 'text-maroon', label: 'Maroon' },
    { value: 'text-ink', label: 'Dark' },
    { value: 'text-white', label: 'White' },
    { value: 'text-vermilion', label: 'Vermilion' },
    { value: 'text-ink-soft', label: 'Gray' },
  ];

  // BG color options
  const bgColorOptions = [
    { value: 'from-vermilion to-maroon-deep', label: 'Default' },
    { value: 'from-red-600 to-red-800', label: 'Red' },
    { value: 'from-amber-500 to-orange-600', label: 'Amber' },
    { value: 'from-emerald-500 to-teal-600', label: 'Emerald' },
    { value: 'from-blue-500 to-indigo-600', label: 'Blue' },
    { value: 'from-purple-500 to-pink-500', label: 'Purple' },
  ];

  const currentText = getLocalizedText(logoText);
  const templeSub = t.templeSub || 'Gaushala, Kathmandu';

  // Get max width for selected size
  const getMaxWidth = (size) => {
    const option = sizeOptions.find(opt => opt.value === size);
    return option ? option.maxW : 'max-w-[48px]';
  };

  return (
    <div className="space-y-6">
      {/* Live Preview */}
      <div className="bg-white border border-line rounded-rt p-4 shadow-rt">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-serif font-semibold">Live Preview</h4>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="text-xs text-ink-soft hover:text-vermilion transition-colors flex items-center gap-1"
          >
            {previewMode ? <EyeOff size={14} /> : <Eye size={14} />}
            {previewMode ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
        
        {previewMode && (
          <div className="bg-gray-50 rounded-xl p-6 flex items-center justify-center border border-gray-200">
            <div className="flex items-center gap-3 max-w-full overflow-hidden">
              <div className={`${logoSize} ${logoShape} bg-gradient-to-br ${logoBgColor} text-white flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg shadow-vermilion/20 ${getMaxWidth(logoSize)}`}>
                {logoPhoto ? (
                  <img src={logoPhoto} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">🕉</span>
                )}
              </div>
              {showText && (
                <div className="flex flex-col leading-tight min-w-0 flex-1">
                  <span className={`font-serif ${textSize} ${fontWeight} ${textColor} truncate max-w-[150px] sm:max-w-[200px]`}>
                    {currentText || 'Shree Ramchandra'}
                  </span>
                  {showLocation && (
                    <span className="text-[8px] sm:text-[10px] text-ink-soft flex items-center gap-1 truncate max-w-[150px] sm:max-w-[200px]">
                      <MapPin size={10} className="text-vermilion flex-shrink-0" />
                      {templeSub}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logo Upload */}
      <div className="bg-white border border-line rounded-rt p-4 shadow-rt">
        <h4 className="text-sm font-serif font-semibold mb-1">Logo Image</h4>
        <p className="text-xs text-ink-soft mb-4">Upload or manage your logo image</p>

        <div className="flex flex-col sm:flex-row gap-4">
          <div
            className="relative border-2 border-dashed border-line rounded-xl overflow-hidden h-32 flex-1 flex items-center justify-center cursor-pointer bg-panel hover:border-vermilion transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            {logoPhoto ? (
              <img src={logoPhoto} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-ink-soft">
                <Image size={28} />
                <span className="text-xs font-semibold">Click to upload</span>
                <span className="text-[10px] text-ink-soft/60">PNG, JPG, WEBP • Max 5MB</span>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white rounded-full animate-spin border-t-transparent" />
              </div>
            )}
          </div>

          {logoPhoto && (
            <button
              onClick={handleRemoveLogo}
              className="px-4 py-2 rounded-xl bg-red-50 text-red-500 font-medium text-sm hover:bg-red-100 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Trash2 size={16} /> Remove
            </button>
          )}
        </div>
      </div>

      {/* Logo Text - Multi-language */}
      <div className="bg-white border border-line rounded-rt p-4 shadow-rt">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-serif font-semibold">Logo Text</h4>
          <LanguageSwitcher active={activeLang} onChange={handleLangChange} t={t} />
        </div>

        <div className="mb-3">
          <label className="text-xs font-bold text-ink block mb-1.5">
            Text in {activeLang.toUpperCase()}
          </label>
          <input
            type="text"
            value={logoText[activeLang] || ''}
            onChange={(e) => setLogoText({ ...logoText, [activeLang]: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none transition-colors text-sm bg-gray-50 hover:bg-white"
            placeholder={`Enter logo text in ${activeLang}`}
          />
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={showText}
              onChange={(e) => setShowText(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-vermilion focus:ring-vermilion"
            />
            Show Text
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={showLocation}
              onChange={(e) => setShowLocation(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-vermilion focus:ring-vermilion"
            />
            Show Location
          </label>
        </div>
      </div>

      {/* Styling Settings */}
      <div className="bg-white border border-line rounded-rt p-4 shadow-rt">
        <h4 className="text-sm font-serif font-semibold mb-3 flex items-center gap-2">
          <Palette size={16} className="text-vermilion" />
          Styling Settings
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Logo Size */}
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Logo Size</label>
            <select
              value={logoSize}
              onChange={(e) => setLogoSize(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white"
            >
              {sizeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-ink-soft/60 mt-1">Logo will be constrained to prevent stretching</p>
          </div>

          {/* Logo Shape */}
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Logo Shape</label>
            <select
              value={logoShape}
              onChange={(e) => setLogoShape(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white"
            >
              {shapeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* BG Color */}
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Background Color</label>
            <select
              value={logoBgColor}
              onChange={(e) => setLogoBgColor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white"
            >
              {bgColorOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Text Size */}
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Text Size</label>
            <select
              value={textSize}
              onChange={(e) => setTextSize(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white"
            >
              {textSizeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Font Weight */}
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Font Weight</label>
            <select
              value={fontWeight}
              onChange={(e) => setFontWeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white"
            >
              {fontWeightOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Text Color */}
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Text Color</label>
            <select
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white"
            >
              {colorOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-vermilion text-white font-semibold text-sm hover:bg-[#a83a0c] transition-all shadow-lg shadow-vermilion/20 hover:shadow-xl"
        >
          <Save size={16} /> {t.save || 'Save All Settings'}
        </button>
      </div>
    </div>
  );
};

export default AdminLogo;