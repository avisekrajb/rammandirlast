import React, { useState } from 'react';
import { Save, Plus, Trash2, Clock, MapPin, Bell } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import LanguageSwitcher from '../common/LanguageSwitcher';

const AdminDailyAarti = ({ settings, updateSettings, t }) => {
  const { showToast } = useToast();
  const [activeLang, setActiveLang] = useState('en');
  const [saving, setSaving] = useState(false);

  const dailyAarti = settings?.dailyAarti || {};
  const templeInfo = dailyAarti.templeInfo || {};

  const [form, setForm] = useState({
    enabled: dailyAarti.enabled !== false,
    title: dailyAarti.title || {},
    subtitle: dailyAarti.subtitle || {},
    aartis: dailyAarti.aartis?.length ? dailyAarti.aartis : [
      { name: { en: 'Mangala Aarti', ne: 'मङ्गला आरती', hi: 'मंगला आरती', zh: '曼加拉法会', ta: 'மங்கள ஆரத்தி' }, time: '05:30 AM' },
      { name: { en: 'Sandhya Aarti', ne: 'सन्ध्या आरती', hi: 'संध्या आरती', zh: '黄昏法会', ta: 'சந்த்யா ஆரத்தி' }, time: '06:30 PM' },
    ],
    templeInfo: {
      enabled: templeInfo.enabled !== false,
      title: templeInfo.title || {},
      openingHours: templeInfo.openingHours || {},
      location: templeInfo.location || {},
      specialAartis: templeInfo.specialAartis || {},
    },
  });

  const getVal = (obj) => obj?.[activeLang] || obj?.en || '';
  const setVal = (path, value) => {
    setForm(prev => {
      const next = { ...prev };
      const parts = path.split('.');
      let node = next;
      for (let i = 0; i < parts.length - 1; i++) {
        node = node[parts[i]] = { ...node[parts[i]] };
      }
      const last = parts[parts.length - 1];
      const current = node[last];
      if (current && typeof current === 'object' && !Array.isArray(current)) {
        node[last] = { ...current, [activeLang]: value };
      } else {
        node[last] = value;
      }
      return next;
    });
  };

  const setAarti = (index, field, value) => {
    setForm(prev => {
      const aartis = prev.aartis.map((a, i) => {
        if (i !== index) return a;
        if (field === 'time') return { ...a, time: value };
        return { ...a, name: { ...(a.name || {}), [activeLang]: value } };
      });
      return { ...prev, aartis };
    });
  };

  const addAarti = () => {
    setForm(prev => ({
      ...prev,
      aartis: [...prev.aartis, { name: {}, time: '' }],
    }));
  };

  const removeAarti = (index) => {
    setForm(prev => ({
      ...prev,
      aartis: prev.aartis.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({ dailyAarti: form });
      showToast('Daily Aarti & Temple Info saved successfully', 'success');
    } catch (error) {
      console.error('Save daily aarti error:', error);
      showToast(error.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors";

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-vermilion/10 flex items-center justify-center">
              <Bell size={20} className="text-vermilion" />
            </div>
            <div>
              <h4 className="text-base font-serif font-semibold text-ink">Daily Aarti & Temple Info</h4>
              <p className="text-xs text-ink-soft mt-0.5">Shown on the Events page</p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm(prev => ({ ...prev, enabled: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-vermilion focus:ring-vermilion"
            />
            Enable Aarti Section
          </label>
        </div>

        {form.enabled && (
          <div className="space-y-5">
            <LanguageSwitcher active={activeLang} onChange={setActiveLang} t={t} />

            {/* Title */}
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">Section Title</label>
              <input
                type="text"
                value={getVal(form.title)}
                onChange={(e) => setVal('title', e.target.value)}
                className={inputCls}
                placeholder="Daily Aarti & Temple Information"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">Subtitle</label>
              <input
                type="text"
                value={getVal(form.subtitle)}
                onChange={(e) => setVal('subtitle', e.target.value)}
                className={inputCls}
                placeholder="Join us for the daily divine aarti"
              />
            </div>

            {/* Aartis */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-ink">Aarti Timings</label>
                <button
                  onClick={addAarti}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-vermilion/10 text-vermilion text-xs font-semibold hover:bg-vermilion/20 transition-all"
                >
                  <Plus size={13} /> Add Aarti
                </button>
              </div>
              <div className="space-y-2">
                {form.aartis.map((aarti, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={getVal(aarti.name)}
                        onChange={(e) => setAarti(index, 'name', e.target.value)}
                        className={inputCls}
                        placeholder="Aarti name"
                      />
                    </div>
                    <div className="w-40 flex-shrink-0">
                      <div className="relative">
                        <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                        <input
                          type="text"
                          value={aarti.time || ''}
                          onChange={(e) => setAarti(index, 'time', e.target.value)}
                          className={`${inputCls} pl-9`}
                          placeholder="06:00 PM"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeAarti(index)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {form.aartis.length === 0 && (
                  <p className="text-xs text-ink-soft">No aartis added yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 pt-5 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-vermilion text-white font-semibold text-sm hover:bg-[#a83a0c] transition-all disabled:opacity-50"
          >
            <Save size={15} /> {saving ? 'Saving...' : 'Save Aarti Settings'}
          </button>
        </div>
      </div>

      {/* Temple Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-vermilion/10 flex items-center justify-center">
              <MapPin size={20} className="text-vermilion" />
            </div>
            <div>
              <h4 className="text-base font-serif font-semibold text-ink">Temple Information</h4>
              <p className="text-xs text-ink-soft mt-0.5">Opening hours, location & special aartis</p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={form.templeInfo.enabled}
              onChange={(e) => setForm(prev => ({ ...prev, templeInfo: { ...prev.templeInfo, enabled: e.target.checked } }))}
              className="w-4 h-4 rounded border-gray-300 text-vermilion focus:ring-vermilion"
            />
            Enable Info Section
          </label>
        </div>

        {form.templeInfo.enabled && (
          <div className="space-y-4">
            <LanguageSwitcher active={activeLang} onChange={setActiveLang} t={t} />

            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">Section Title</label>
              <input
                type="text"
                value={getVal(form.templeInfo.title)}
                onChange={(e) => setVal('templeInfo.title', e.target.value)}
                className={inputCls}
                placeholder="Temple Information"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">Opening Hours</label>
              <input
                type="text"
                value={getVal(form.templeInfo.openingHours)}
                onChange={(e) => setVal('templeInfo.openingHours', e.target.value)}
                className={inputCls}
                placeholder="5:00 AM – 8:00 PM"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">Location</label>
              <input
                type="text"
                value={getVal(form.templeInfo.location)}
                onChange={(e) => setVal('templeInfo.location', e.target.value)}
                className={inputCls}
                placeholder="Battisputali, Gaushala, Kathmandu, Nepal"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">Special Aartis</label>
              <input
                type="text"
                value={getVal(form.templeInfo.specialAartis)}
                onChange={(e) => setVal('templeInfo.specialAartis', e.target.value)}
                className={inputCls}
                placeholder="Special aartis on festivals and Ekadashi"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-vermilion text-white font-semibold text-sm hover:bg-[#a83a0c] transition-all disabled:opacity-50"
            >
              <Save size={15} /> {saving ? 'Saving...' : 'Save Temple Info'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDailyAarti;
