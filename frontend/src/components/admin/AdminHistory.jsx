import React, { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Save, X, Image as ImageIcon, Upload, MoveUp, MoveDown, Eye, EyeOff, Crop, CheckCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import api from '../../services/api';
import ImageCropper from '../common/ImageCropper';
import OmLoader from '../../components/common/OmLoader';

const AdminHistory = ({ history, setHistory, t, settings, updateSettings }) => {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(null);
  const [activeLang, setActiveLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropTarget, setCropTarget] = useState(null);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [founderIntroLoading, setFounderIntroLoading] = useState(false);
  const [founderIntroSaved, setFounderIntroSaved] = useState(false);
  const [localFounderIntro, setLocalFounderIntro] = useState(null);
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // Get founder intro from settings or default
  const getFounderIntro = () => {
    if (localFounderIntro !== null) return localFounderIntro;
    return settings?.founder?.intro || {
      en: 'The temple\'s rich history is woven with stories of devotion, community service, and unwavering faith. Generation after generation, this sacred place has been a beacon of hope and spiritual solace for countless devotees.',
      ne: 'मन्दिरको समृद्ध इतिहास भक्ति, समुदाय सेवा र अटल विश्वासका कथाहरूले बुनेको छ। पुस्ता पछि पुस्ता, यो पवित्र स्थान अनगिन्ती भक्तहरूको लागि आशा र आध्यात्मिक सान्त्वनाको प्रकाशस्तम्भ भएको छ।',
      hi: 'मंदिर का समृद्ध इतिहास भक्ति, सामुदायिक सेवा और अटूट विश्वास की कहानियों से बुना गया है। पीढ़ी दर पीढ़ी, यह पवित्र स्थान अनगिनत भक्तों के लिए आशा और आध्यात्मिक सांत्वना का प्रकाशस्तंभ रहा है।',
      zh: '寺庙丰富的历史由奉献、社区服务和坚定信仰的故事编织而成。一代又一代，这个神圣的地方一直是无数信徒希望和精神慰藉的灯塔。',
      ta: 'கோயிலின் வளமான வரலாறு பக்தி, சமூக சேவை மற்றும் உறுதியான நம்பிக்கையின் கதைகளால் பின்னப்பட்டுள்ளது. தலைமுறை தலைமுறையாக, இந்த புனித இடம் எண்ணற்ற பக்தர்களுக்கு நம்பிக்கை மற்றும் ஆன்மீக ஆறுதலின் ஒளிவிளக்காக இருந்து வருகிறது.'
    };
  };

  const founderIntro = getFounderIntro();

  // ========== BANNER MANAGEMENT ==========
  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be less than 10MB', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setCropImage(event.target.result);
      setCropTarget('banner');
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBannerCropSave = async (croppedImage) => {
    setBannerLoading(true);
    try {
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('image', blob, 'banner.jpg');
      
      const uploadRes = await api.post('/admin/upload/history-banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (updateSettings) {
        await updateSettings({ historyBanner: uploadRes.data.url });
      }
      
      showToast('Banner updated successfully', 'success');
    } catch (error) {
      console.error('Banner upload error:', error);
      showToast(error.response?.data?.message || 'Failed to upload banner', 'error');
    } finally {
      setBannerLoading(false);
      setShowCropModal(false);
      setCropImage(null);
      setCropTarget(null);
    }
  };

  // ========== FOUNDER INTRO MANAGEMENT ==========
  const handleFounderIntroChange = (lang, value) => {
    setLocalFounderIntro({
      ...founderIntro,
      [lang]: value
    });
    setFounderIntroSaved(false);
  };

  const handleFounderIntroSave = async () => {
    setFounderIntroLoading(true);
    try {
      const introToSave = localFounderIntro || founderIntro;
      
      // Get current settings from API to ensure we have the latest data
      const settingsRes = await api.get('/admin/settings');
      const currentSettings = settingsRes.data;
      
      // Deep merge the founder intro
      const updatedSettings = {
        ...currentSettings,
        founder: {
          ...currentSettings?.founder,
          intro: introToSave
        }
      };
      
      // Save to API
      const saveResponse = await api.put('/admin/settings', updatedSettings);
      
      // Verify the save was successful
      if (saveResponse.data && saveResponse.data.founder?.intro) {
        setFounderIntroSaved(true);
        showToast('Founder intro saved successfully', 'success');
        
        // Update the local settings state
        if (updateSettings) {
          await updateSettings({ 
            founder: {
              ...saveResponse.data.founder,
              intro: saveResponse.data.founder.intro
            }
          });
        }
        
        // Update local state to match saved data
        setLocalFounderIntro(saveResponse.data.founder.intro);
        
        // Reset saved indicator after 3 seconds
        setTimeout(() => setFounderIntroSaved(false), 3000);
      } else {
        showToast('Failed to save founder intro - please try again', 'error');
      }
    } catch (error) {
      console.error('Save founder intro error:', error);
      showToast(error.response?.data?.message || 'Failed to save founder intro', 'error');
    } finally {
      setFounderIntroLoading(false);
    }
  };

  // ========== HISTORY ENTRY MANAGEMENT ==========
  const blank = () => ({
    photo: null,
    period: { en: '', ne: '', hi: '', zh: '', ta: '' },
    title: { en: '', ne: '', hi: '', zh: '', ta: '' },
    desc: { en: '', ne: '', hi: '', zh: '', ta: '' },
    year: '',
    order: history.length,
    enabled: true,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editing._id) {
        const response = await api.put(`/admin/history/${editing._id}`, editing);
        setHistory(history.map(h => h._id === editing._id ? response.data : h));
        showToast('History entry updated successfully', 'success');
      } else {
        const response = await api.post('/admin/history', editing);
        setHistory([...history, response.data]);
        showToast('History entry added successfully', 'success');
      }
      setEditing(null);
    } catch (error) {
      console.error('Save history error:', error);
      showToast(error.response?.data?.message || 'Failed to save history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this history entry?')) return;
    setLoading(true);
    try {
      await api.delete(`/admin/history/${id}`);
      setHistory(history.filter(h => h._id !== id));
      showToast('History entry deleted successfully', 'success');
    } catch (error) {
      console.error('Delete history error:', error);
      showToast(error.response?.data?.message || 'Failed to delete history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be less than 10MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCropImage(event.target.result);
      setCropTarget('entry');
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleEntryCropSave = async (croppedImage) => {
    setUploading(true);
    try {
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('image', blob, 'history.jpg');
      formData.append('historyId', editing._id || 'new');

      const uploadRes = await api.post('/admin/upload/history', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditing({ ...editing, photo: uploadRes.data.url });
      showToast('Photo uploaded successfully', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      showToast(error.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
      setShowCropModal(false);
      setCropImage(null);
      setCropTarget(null);
    }
  };

  const handleMove = (id, direction) => {
    const index = history.findIndex(h => h._id === id);
    if (direction === 'up' && index > 0) {
      const newHistory = [...history];
      [newHistory[index], newHistory[index - 1]] = [newHistory[index - 1], newHistory[index]];
      setHistory(newHistory);
    } else if (direction === 'down' && index < history.length - 1) {
      const newHistory = [...history];
      [newHistory[index], newHistory[index + 1]] = [newHistory[index + 1], newHistory[index]];
      setHistory(newHistory);
    }
  };

  const handleToggle = (id) => {
    setHistory(history.map(h => 
      h._id === id ? { ...h, enabled: !h.enabled } : h
    ));
  };

  const getLocalizedValue = (obj, lang) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj.en || '';
  };

  const bannerUrl = settings?.historyBanner || '/aboutusherosection.jpeg';

  return (
    <>
      {/* ===== BANNER SECTION ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-serif font-semibold text-ink">History Banner</h4>
            <p className="text-xs text-ink-soft">Upload a banner image for the History page hero section</p>
          </div>
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={bannerLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-vermilion text-white text-sm font-semibold hover:bg-[#a83a0c] transition-all disabled:opacity-50"
          >
            {bannerLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Crop size={16} />
                Upload & Crop Banner
              </>
            )}
          </button>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerUpload}
            className="hidden"
          />
        </div>

        <div className="relative rounded-xl overflow-hidden h-48 bg-gray-100">
          <img 
            src={bannerUrl} 
            alt="History Banner" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/aboutusherosection.jpeg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <p className="text-sm font-medium">Current Banner</p>
            <p className="text-xs text-white/70">Recommended: 1920 x 600px</p>
          </div>
        </div>
      </div>

      {/* ===== FOUNDER INTRO SECTION ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-serif font-semibold text-ink">Founder Intro Text</h4>
            <p className="text-xs text-ink-soft">This text appears above the founder section on the History page</p>
          </div>
          <button
            onClick={handleFounderIntroSave}
            disabled={founderIntroLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-all disabled:opacity-50"
          >
            {founderIntroLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : founderIntroSaved ? (
              <>
                <CheckCircle size={16} />
                Saved!
              </>
            ) : (
              <>
                <Save size={16} />
                Save Intro
              </>
            )}
          </button>
        </div>

        {/* Language Switcher for Founder Intro */}
        <div className="mb-4">
          <LanguageSwitcher active={activeLang} onChange={setActiveLang} />
        </div>

        <div>
          <label className="text-xs font-bold text-ink block mb-1.5">Intro Text ({activeLang.toUpperCase()})</label>
          <textarea
            rows={4}
            value={getLocalizedValue(founderIntro, activeLang)}
            onChange={(e) => handleFounderIntroChange(activeLang, e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm resize-none"
            placeholder="Enter founder intro text..."
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-ink-soft/60">
              This text will appear above the founder card on the History page
            </p>
            {founderIntroSaved && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle size={14} />
                Saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ===== HISTORY ENTRIES ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h4 className="text-lg font-serif font-semibold text-ink">History Entries</h4>
            <p className="text-xs text-ink-soft">Manage the history timeline entries</p>
          </div>
          <button
            onClick={() => setEditing(blank())}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-vermilion text-white text-sm font-semibold hover:bg-[#a83a0c] transition-all"
          >
            <Plus size={16} /> Add Entry
          </button>
        </div>

        {history?.length === 0 ? (
          <div className="text-center py-12 text-ink-soft">
            <ImageIcon size={48} className="mx-auto text-ink-soft/30 mb-3" />
            <p>No history entries yet</p>
            <p className="text-sm mt-1">Click "Add Entry" to create your first history entry</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-ink-soft uppercase tracking-wider w-16">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-ink-soft uppercase tracking-wider w-20">Photo</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-ink-soft uppercase tracking-wider">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-ink-soft uppercase tracking-wider hidden md:table-cell">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-ink-soft uppercase tracking-wider hidden lg:table-cell">Year</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-ink-soft uppercase tracking-wider w-24">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-ink-soft uppercase tracking-wider w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((item, index) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-ink-soft">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                        {item.photo ? (
                          <img src={item.photo} alt={item.period?.en} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ink-soft/30">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{item.period?.en || 'Untitled'}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-ink-soft">{item.title?.en || ''}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-ink-soft">{item.year || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        item.enabled !== false ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.enabled !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                        {item.enabled !== false ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMove(item._id, 'up')}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-30"
                          title="Move Up"
                        >
                          <MoveUp size={16} />
                        </button>
                        <button
                          onClick={() => handleMove(item._id, 'down')}
                          disabled={index === history.length - 1}
                          className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-30"
                          title="Move Down"
                        >
                          <MoveDown size={16} />
                        </button>
                        <button
                          onClick={() => handleToggle(item._id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            item.enabled !== false ? 'hover:bg-gray-200' : 'hover:bg-green-50'
                          }`}
                          title={item.enabled !== false ? 'Hide' : 'Show'}
                        >
                          {item.enabled !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button
                          onClick={() => setEditing(item)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== MODAL FOR EDITING ===== */}
      {editing && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="text-lg font-serif font-semibold text-ink">
                {editing._id ? 'Edit History Entry' : 'Add New History Entry'}
              </h3>
              <button 
                onClick={() => setEditing(null)} 
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Photo Upload */}
              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">Photo</label>
                <div
                  className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden h-48 flex items-center justify-center cursor-pointer bg-gray-50 hover:border-vermilion transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                    className="hidden" 
                  />
                  {editing.photo ? (
                    <img src={editing.photo} alt="History" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-ink-soft">
                      <ImageIcon size={40} />
                      <span className="text-sm font-medium">Click to upload photo</span>
                      <span className="text-xs text-ink-soft/60">JPG, PNG, WEBP • Max 10MB</span>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <OmLoader size="lg" color="white" />
                    </div>
                  )}
                  {editing.photo && !uploading && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs font-bold py-2 flex items-center justify-center gap-1.5">
                      <Upload size={14} /> Click to change photo
                    </div>
                  )}
                </div>
                {editing.photo && (
                  <p className="text-xs text-green-600 mt-1">✅ Photo uploaded</p>
                )}
              </div>

              {/* Year */}
              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">Year (Optional)</label>
                <input
                  type="text"
                  value={editing.year || ''}
                  onChange={(e) => setEditing({ ...editing, year: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                  placeholder="e.g., 1800, 1950, Present"
                />
              </div>

              {/* Language Switcher */}
              <LanguageSwitcher active={activeLang} onChange={setActiveLang} />

              {/* Period */}
              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">Period / Era</label>
                <input
                  type="text"
                  value={getLocalizedValue(editing.period, activeLang)}
                  onChange={(e) => setEditing({ 
                    ...editing, 
                    period: { ...editing.period, [activeLang]: e.target.value } 
                  })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                  placeholder="Enter period name..."
                />
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">Title</label>
                <input
                  type="text"
                  value={getLocalizedValue(editing.title, activeLang)}
                  onChange={(e) => setEditing({ 
                    ...editing, 
                    title: { ...editing.title, [activeLang]: e.target.value } 
                  })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                  placeholder="Enter title..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">Description</label>
                <textarea
                  rows={4}
                  value={getLocalizedValue(editing.desc, activeLang)}
                  onChange={(e) => setEditing({ 
                    ...editing, 
                    desc: { ...editing.desc, [activeLang]: e.target.value } 
                  })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm resize-none"
                  placeholder="Enter description..."
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-2 text-sm font-medium text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.enabled !== false}
                    onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-vermilion focus:ring-vermilion"
                  />
                  <span>Show on website</span>
                </label>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  editing.enabled !== false ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
                }`}>
                  {editing.enabled !== false ? 'Visible' : 'Hidden'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-ink-soft font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || uploading}
                  className="flex-1 py-2.5 rounded-xl bg-vermilion text-white font-semibold hover:bg-[#a83a0c] transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editing._id ? 'Update Entry' : 'Add Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CROP MODAL ===== */}
      {showCropModal && cropImage && (
        <ImageCropper
          image={cropImage}
          onSave={cropTarget === 'banner' ? handleBannerCropSave : handleEntryCropSave}
          onCancel={() => {
            setShowCropModal(false);
            setCropImage(null);
            setCropTarget(null);
          }}
          aspectRatio={cropTarget === 'banner' ? 16/5 : 4/3}
          title={cropTarget === 'banner' ? 'Crop Banner Image' : 'Crop Entry Image'}
        />
      )}
    </>
  );
};

export default AdminHistory;