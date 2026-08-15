import React, { useRef, useState } from 'react';
import { Video, Upload, X, Play, Pause, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import OmLoader from '../../components/common/OmLoader';

const AdminHero = ({ settings, updateSettings, t }) => {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      showToast('Please upload a video file', 'error');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showToast('Video file must be less than 50MB', 'error');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await api.post('/admin/upload/hero', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await updateSettings({ heroVideo: response.data.url });
      showToast(t.videoUploaded || 'Video uploaded successfully', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      showToast(error.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setLoading(false);
    }
    e.target.value = '';
  };

  const handleRemove = async () => {
    if (!window.confirm('Remove the hero video?')) return;
    setLoading(true);
    try {
      await updateSettings({ heroVideo: null });
      showToast('Video removed successfully', 'success');
    } catch (error) {
      console.error('Remove error:', error);
      showToast(error.response?.data?.message || 'Failed to remove video', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeVideo = () => {
    fileInputRef.current?.click();
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const heroVideo = settings?.heroVideo;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-serif font-semibold text-ink">{t.heroBanner || 'Hero Banner'}</h4>
          <p className="text-xs text-ink-soft mt-0.5">{t.uploadVideo || 'Upload a video for the hero section'}</p>
        </div>
        {heroVideo && (
          <div className="flex gap-2">
            <button
              onClick={handleChangeVideo}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-vermilion bg-vermilion/10 hover:bg-vermilion/20 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} /> Change Video
            </button>
            <button
              onClick={handleRemove}
              disabled={loading}
              className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {heroVideo ? (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video group">
          <video
            ref={videoRef}
            src={heroVideo}
            className="w-full h-full object-cover"
            muted
            loop
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-white/90 text-ink hover:bg-white transition-all flex items-center justify-center shadow-lg"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
            </button>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white/70 text-xs">
            <span>Hero Video</span>
            <span className="bg-black/50 px-2 py-0.5 rounded">Click to play</span>
          </div>
        </div>
      ) : (
        <div
          className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden h-48 flex items-center justify-center cursor-pointer bg-gray-50 hover:border-vermilion transition-colors group"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="video/*"
            onChange={handleUpload}
            className="hidden"
          />
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <OmLoader size="md" color="vermilion" />
              <span className="text-xs text-ink-soft font-medium">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-ink-soft">
              <div className="w-16 h-16 rounded-full bg-vermilion/10 text-vermilion flex items-center justify-center group-hover:scale-110 transition-transform">
                <Video size={28} />
              </div>
              <span className="text-sm font-medium">Click to upload video</span>
              <span className="text-xs text-ink-soft/60">MP4, MOV, AVI • Max 50MB</span>
            </div>
          )}
        </div>
      )}

      {!heroVideo ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="mt-4 w-full py-2.5 rounded-xl bg-vermilion text-white font-semibold text-sm hover:bg-[#a83a0c] transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          <Upload size={16} />
          {loading ? 'Uploading...' : 'Upload Video'}
        </button>
      ) : (
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleChangeVideo}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border-2 border-vermilion text-vermilion font-semibold text-sm hover:bg-vermilion hover:text-white transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            {loading ? 'Processing...' : 'Change Video'}
          </button>
          <button
            onClick={handleRemove}
            disabled={loading}
            className="py-2.5 px-4 rounded-xl border-2 border-red-300 text-red-500 font-semibold text-sm hover:bg-red-50 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            <X size={16} />
            Remove
          </button>
        </div>
      )}

      <p className="text-xs text-ink-soft/60 mt-3">
        {heroVideo ? (
          <span className="text-green-600">✅ Video uploaded to Cloudinary</span>
        ) : (
          <span>📹 Upload a video to display in the hero section</span>
        )}
      </p>
    </div>
  );
};

export default AdminHero;