import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { Facebook, Plus, Trash2, Save, Eye, EyeOff, Video, ExternalLink, Clapperboard } from 'lucide-react';
import OmLoader from '../common/OmLoader';

const AdminFacebookVideos = ({ settings, updateSettings, t }) => {
  const { showToast } = useToast();
  const [activeList, setActiveList] = useState('videos');
  const [fbVideos, setFbVideos] = useState([]);
  const [fbReels, setFbReels] = useState([]);
  const [newFbVideo, setNewFbVideo] = useState({ url: '', enabled: true });
  const [newFbReel, setNewFbReel] = useState({ url: '', enabled: true });
  const [fbSectionEnabled, setFbSectionEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  // Accepts a plain video URL, a share link, or a full Facebook embed <iframe>
  // code and always returns a clean, embeddable Facebook video URL.
  const extractFacebookVideoUrl = (input) => {
    if (!input || typeof input !== 'string') return '';
    let value = input.trim();
    if (/<iframe/i.test(value)) {
      const srcMatch = value.match(/src=["']([^"']+)["']/i);
      const src = srcMatch ? srcMatch[1] : value;
      const hrefMatch = src.match(/[?&]href=([^&]+)/i);
      if (hrefMatch) {
        try { value = decodeURIComponent(hrefMatch[1]); }
        catch (e) { value = hrefMatch[1]; }
      } else if (!src.includes('plugins/video.php')) {
        value = src;
      }
    }
    return value;
  };

  useEffect(() => {
    if (settings?.facebookVideos) {
      setFbVideos(settings.facebookVideos);
    } else {
      setFbVideos([]);
    }
    if (settings?.facebookReels) {
      setFbReels(settings.facebookReels);
    } else {
      setFbReels([]);
    }
    setFbSectionEnabled(settings?.facebookVideo?.enabled !== false);
  }, [settings]);

  const saveFacebookVideos = async () => {
    setLoading(true);
    try {
      const updatedSettings = {
        ...settings,
        facebookVideos: fbVideos.map(v => ({ ...v, url: extractFacebookVideoUrl(v.url) })).filter(v => v.url),
        facebookReels: fbReels.map(v => ({ ...v, url: extractFacebookVideoUrl(v.url) })).filter(v => v.url),
        facebookVideo: { enabled: fbSectionEnabled }
      };
      await updateSettings(updatedSettings);
      showToast('Facebook videos and reels saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving facebook videos:', error);
      showToast(error.response?.data?.message || 'Error saving facebook videos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addItem = (list, setList, newItem, setNewItem, label) => {
    const url = extractFacebookVideoUrl(newItem.url);
    if (!url) {
      showToast(`Please enter a valid Facebook ${label} URL or embed code`, 'warning');
      return;
    }
    setList([...list, { url, enabled: newItem.enabled }]);
    setNewItem({ url: '', enabled: true });
    showToast(`Facebook ${label} added!`, 'success');
  };

  const removeItem = (list, setList, index, label) => {
    setList(list.filter((_, i) => i !== index));
    showToast(`Facebook ${label} removed`, 'info');
  };

  const toggleItem = (list, setList, index) => {
    const updated = [...list];
    updated[index].enabled = !updated[index].enabled;
    setList(updated);
  };

  const updateItem = (list, setList, index, value) => {
    const updated = [...list];
    updated[index].url = value;
    setList(updated);
  };

  const renderItem = (video, index, list, setList, label) => (
    <div
      key={index}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        video.enabled
          ? 'border-gray-200 bg-white hover:border-gray-300'
          : 'border-gray-100 bg-gray-50 opacity-60'
      }`}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#1877F2]/10">
        <Facebook size={16} className="text-[#1877F2]" />
      </div>
      <input
        type="url"
        value={video.url}
        onChange={(e) => updateItem(list, setList, index, e.target.value)}
        placeholder="https://www.facebook.com/.../videos/... or https://www.facebook.com/share/v/..."
        className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/20"
      />
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
        title="Open video"
      >
        <ExternalLink size={15} />
      </a>
      {!video.enabled && (
        <span className="text-[10px] text-ink-soft/60 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
          Disabled
        </span>
      )}
      <button
        onClick={() => toggleItem(list, setList, index)}
        className={`p-2 rounded-lg transition-colors ${
          video.enabled
            ? 'hover:bg-green-50 text-green-600'
            : 'hover:bg-gray-100 text-ink-soft'
        }`}
        title={video.enabled ? `Hide ${label}` : `Show ${label}`}
      >
        {video.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>
      <button
        onClick={() => removeItem(list, setList, index, label)}
        className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
        title="Delete"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );

  const renderAddRow = (newItem, setNewItem, onAdd, placeholder, label) => (
    <div className="flex flex-wrap gap-3 mt-4">
      <input
        type="url"
        value={newItem.url}
        onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
        placeholder={placeholder}
        className="flex-1 min-w-[220px] px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/20"
      />
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2 bg-[#1877F2] text-white rounded-xl font-medium hover:bg-[#1877F2]/80 transition-all"
      >
        <Plus size={16} />
        Add {label}
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-ink flex items-center gap-2">
              <Video size={20} className="text-[#1877F2]" />
              Facebook Videos &amp; Reels
            </h2>
            <p className="text-sm text-ink-soft mt-1">
              Manage videos and reels separately. Videos show in the top section (rectangle
              shape), reels in the bottom section (vertical 9:16 shape). On the home page up to 12
              reels are shown, then a &quot;View More Reels&quot; button opens the Gallery Videos tab.
              Facebook links AND YouTube links (including Shorts) are supported.
            </p>
          </div>
          <button
            onClick={saveFacebookVideos}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-vermilion text-white rounded-full font-medium hover:bg-vermilion/80 transition-all disabled:opacity-50 shadow-lg shadow-vermilion/20"
          >
            {loading ? (
              <OmLoader size="sm" color="white" />
            ) : (
              <Save size={16} />
            )}
            {t.saveChanges || 'Save Changes'}
          </button>
        </div>

        {/* Section enable toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50 mb-6">
          <div>
            <p className="text-sm font-semibold text-ink">Show videos &amp; reels section</p>
            <p className="text-xs text-ink-soft mt-0.5">
              Turn off to hide the whole Facebook video/reels section from the Gallery and Home page.
            </p>
          </div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={fbSectionEnabled}
              onChange={(e) => setFbSectionEnabled(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-vermilion focus:ring-vermilion"
            />
          </label>
        </div>

        {/* Tabs: Videos / Reels */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveList('videos')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              activeList === 'videos'
                ? 'bg-[#1877F2] text-white shadow-md'
                : 'bg-gray-100 text-ink-soft hover:bg-gray-200'
            }`}
          >
            <Video size={16} />
            Videos ({fbVideos.length})
          </button>
          <button
            onClick={() => setActiveList('reels')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              activeList === 'reels'
                ? 'bg-vermilion text-white shadow-md'
                : 'bg-gray-100 text-ink-soft hover:bg-gray-200'
            }`}
          >
            <Clapperboard size={16} />
            Reels ({fbReels.length})
          </button>
        </div>

        {activeList === 'videos' ? (
          <>
            <div className="space-y-2">
              {fbVideos.length === 0 && (
                <div className="text-center py-10">
                  <Video size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-ink-soft">No Facebook videos added yet. Add video URLs below.</p>
                  <p className="text-xs text-ink-soft/60 mt-1">
                    If no videos are added, a default list is shown.
                  </p>
                </div>
              )}
              {fbVideos.map((video, index) =>
                renderItem(video, index, fbVideos, setFbVideos, 'video')
              )}
            </div>
            {renderAddRow(
              newFbVideo,
              setNewFbVideo,
              () => addItem(fbVideos, setFbVideos, newFbVideo, setNewFbVideo, 'video'),
              'Paste Facebook video URL (video link or share link like https://www.facebook.com/share/v/xxxx/)',
              'Video'
            )}
          </>
        ) : (
          <>
            <div className="space-y-2">
              {fbReels.length === 0 && (
                <div className="text-center py-10">
                  <Clapperboard size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-ink-soft">No Facebook reels added yet. Add reel URLs below.</p>
                  <p className="text-xs text-ink-soft/60 mt-1">
                    Reels are shown vertically below the videos. Use share links like
                    https://www.facebook.com/share/r/xxxx/ or reel links.
                  </p>
                </div>
              )}
              {fbReels.map((video, index) =>
                renderItem(video, index, fbReels, setFbReels, 'reel')
              )}
            </div>
            {renderAddRow(
              newFbReel,
              setNewFbReel,
              () => addItem(fbReels, setFbReels, newFbReel, setNewFbReel, 'reel'),
              'Paste Facebook reel URL (share link like https://www.facebook.com/share/r/xxxx/)',
              'Reel'
            )}
          </>
        )}

        <p className="text-[11px] text-ink-soft/60 mt-2">
          Tip: you can add regular video links, share links, or the full Facebook embed code — it is
          cleaned automatically. Videos appear in the top rectangle section, reels in the bottom
          vertical slider.
        </p>
      </div>
    </div>
  );
};

export default AdminFacebookVideos;