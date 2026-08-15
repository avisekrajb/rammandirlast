import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import OmLoader from '../../components/common/OmLoader';
import {
  Image, Video, Plus, Trash2, Edit, X, Download, Share2,
  Calendar, Tag, Eye, EyeOff, Upload, Search, Filter,
  CheckSquare, Square, Loader2, RefreshCw,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const AdminGallery = ({ gallery, setGallery, galleryVideos, setGalleryVideos, t }) => {
  const { showToast } = useToast();
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('photos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [categories, setCategories] = useState(['all']);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const itemsPerPage = 20;

  // Fetch all gallery items
  useEffect(() => {
    fetchGalleryItems();
  }, []);

  const fetchGalleryItems = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/gallery/all');
      setAllItems(response.data.data || []);
      setItems(response.data.data || []);
      // Extract categories
      const cats = ['all', ...new Set((response.data.data || []).map(item => item.category).filter(Boolean))];
      setCategories(cats);
    } catch (error) {
      console.error('Fetch gallery items error:', error);
      showToast('Failed to fetch gallery items', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter items
  useEffect(() => {
    let filtered = allItems;
    
    // Filter by type
    if (activeTab === 'photos') {
      filtered = filtered.filter(item => item.type === 'photo');
    } else if (activeTab === 'videos') {
      filtered = filtered.filter(item => item.type === 'video');
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const caption = item.cap?.[lang] || item.cap?.en || '';
        return caption.toLowerCase().includes(term);
      });
    }
    
    setItems(filtered);
    setCurrentPage(1);
  }, [allItems, activeTab, selectedCategory, searchTerm, lang]);

  // Upload handlers
  const handlePhotoUpload = async (e) => {
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

    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('data', JSON.stringify({
      cap: { en: '' },
      category: 'general',
      hue: '#7A1F2B',
    }));

    try {
      const response = await api.post('/admin/gallery', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newItem = response.data.data;
      setAllItems([newItem, ...allItems]);
      showToast('Photo uploaded successfully', 'success');
      setShowAddModal(false);
    } catch (error) {
      console.error('Upload error:', error);
      showToast(error.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      showToast('Please upload a video file', 'error');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showToast('Video must be less than 50MB', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('video', file);
    formData.append('data', JSON.stringify({
      cap: { en: '' },
      category: 'general',
    }));

    try {
      const response = await api.post('/admin/gallery/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newItem = response.data.data;
      setAllItems([newItem, ...allItems]);
      showToast('Video uploaded successfully', 'success');
      setShowAddModal(false);
    } catch (error) {
      console.error('Upload error:', error);
      showToast(error.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  };

  // Delete handlers
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    setLoading(true);
    try {
      await api.delete(`/admin/gallery/${id}`);
      setAllItems(allItems.filter(item => item._id !== id));
      showToast('Item deleted successfully', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Failed to delete item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      showToast('Please select items to delete', 'warning');
      return;
    }
    if (!window.confirm(`Delete ${selectedItems.length} items?`)) return;
    
    setLoading(true);
    try {
      await api.delete('/admin/gallery/bulk', { data: { ids: selectedItems } });
      setAllItems(allItems.filter(item => !selectedItems.includes(item._id)));
      setSelectedItems([]);
      showToast('Items deleted successfully', 'success');
    } catch (error) {
      console.error('Bulk delete error:', error);
      showToast('Failed to delete items', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Selection handlers
  const toggleSelect = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === pageItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(pageItems.map(item => item._id));
    }
  };

  // Download handler
  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename || 'download';
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      window.open(url, '_blank');
    }
  };

  // Share handler
  const handleShare = (item) => {
    if (navigator.share) {
      navigator.share({
        title: item.cap?.[lang] || item.cap?.en || 'Temple Gallery',
        url: item.photo,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(item.photo);
      showToast('Link copied to clipboard', 'success');
    }
  };

  const handleShareAll = () => {
    const urls = pageItems.map(item => item.photo).join('\n');
    if (navigator.share) {
      navigator.share({
        title: 'Temple Gallery',
        text: 'Check out these temple photos!',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(urls);
      showToast('All links copied to clipboard', 'success');
    }
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Pagination
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const pageItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && allItems.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <OmLoader size="lg" color="vermilion" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h4 className="text-base font-serif font-semibold text-ink">Gallery Management</h4>
          <p className="text-xs text-ink-soft">Manage photos and videos in the gallery</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchGalleryItems}
            className="p-2 rounded-lg hover:bg-gray-100 transition-all"
            title="Refresh"
          >
            <RefreshCw size={18} className="text-ink-soft" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-vermilion text-white text-sm font-semibold hover:bg-[#a83a0c] transition-all"
          >
            <Plus size={16} /> Add New
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'photos' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
            }`}
          >
            <Image size={14} className="inline mr-1" /> Photos
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'videos' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
            }`}
          >
            <Video size={14} className="inline mr-1" /> Videos
          </button>
        </div>

        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by caption..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-white"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-vermilion/10 text-vermilion' : 'text-ink-soft'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-vermilion/10 text-vermilion' : 'text-ink-soft'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-vermilion/5 rounded-xl border border-vermilion/20">
          <span className="text-sm font-medium">{selectedItems.length} selected</span>
          <button
            onClick={toggleSelectAll}
            className="text-sm text-ink-soft hover:text-ink transition-colors"
          >
            {selectedItems.length === pageItems.length ? 'Deselect All' : 'Select All'}
          </button>
          <div className="flex-1" />
          <button
            onClick={handleBulkDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all text-sm font-semibold"
          >
            <Trash2 size={14} /> Delete Selected
          </button>
        </div>
      )}

      {/* Gallery Grid/List */}
      {pageItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Image size={48} className="mx-auto text-ink-soft/30 mb-4" />
          <p className="text-ink-soft">No {activeTab} found</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 text-sm text-vermilion hover:text-[#a83a0c] transition-colors"
          >
            Upload your first {activeTab === 'photos' ? 'photo' : 'video'}
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {pageItems.map((item) => (
            <div key={item._id} className="group relative bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all">
              <div className="aspect-square bg-gray-100 relative">
                {item.type === 'video' ? (
                  <video src={item.photo} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={item.photo} alt={item.cap?.[lang] || item.cap?.en} className="w-full h-full object-cover" />
                )}
                {item.type === 'video' && (
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                    <Video size={12} /> Video
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleShare(item)}
                    className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all"
                    title="Share"
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDownload(item.photo, item.cap?.[lang] || item.cap?.en || 'download')}
                    className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-2 rounded-lg bg-red-500/70 text-white hover:bg-red-500 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <button
                  onClick={() => toggleSelect(item._id)}
                  className="absolute top-2 left-2 p-1 rounded-lg bg-white/90 hover:bg-white transition-all shadow-sm"
                >
                  {selectedItems.includes(item._id) ? (
                    <CheckSquare size={16} className="text-vermilion" />
                  ) : (
                    <Square size={16} className="text-ink-soft/50" />
                  )}
                </button>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-ink truncate">
                  {item.cap?.[lang] || item.cap?.en || 'Untitled'}
                </p>
                <div className="flex items-center justify-between mt-1 text-[10px] text-ink-soft">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {formatDate(item.createdAt)}
                  </span>
                  <span>{formatSize(item.size)}</span>
                </div>
                {item.category && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 rounded-full text-[9px] text-ink-soft">
                    {item.category}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <button onClick={toggleSelectAll}>
                    {selectedItems.length === pageItems.length ? (
                      <CheckSquare size={18} className="text-vermilion" />
                    ) : (
                      <Square size={18} className="text-ink-soft/50" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-ink-soft uppercase tracking-wider">Preview</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-ink-soft uppercase tracking-wider">Caption</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-ink-soft uppercase tracking-wider hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-ink-soft uppercase tracking-wider hidden lg:table-cell">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-ink-soft uppercase tracking-wider hidden sm:table-cell">Size</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-ink-soft uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => toggleSelect(item._id)}>
                      {selectedItems.includes(item._id) ? (
                        <CheckSquare size={18} className="text-vermilion" />
                      ) : (
                        <Square size={18} className="text-ink-soft/50" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                      {item.type === 'video' ? (
                        <video src={item.photo} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={item.photo} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium max-w-[150px] truncate">
                    {item.cap?.[lang] || item.cap?.en || 'Untitled'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      {item.category || 'general'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-ink-soft text-xs">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-ink-soft text-xs">
                    {formatSize(item.size)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleShare(item)}
                        className="p-1.5 rounded-lg hover:bg-gray-200 transition-all"
                        title="Share"
                      >
                        <Share2 size={14} className="text-ink-soft" />
                      </button>
                      <button
                        onClick={() => handleDownload(item.photo, item.cap?.[lang] || item.cap?.en || 'download')}
                        className="p-1.5 rounded-lg hover:bg-gray-200 transition-all"
                        title="Download"
                      >
                        <Download size={14} className="text-ink-soft" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={14} className="text-red-400 hover:text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 hover:border-vermilion transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="px-2 text-ink-soft">…</span>
                  )}
                  <button
                    onClick={() => goToPage(page)}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                      page === currentPage
                        ? 'bg-vermilion text-white shadow-lg shadow-vermilion/20'
                        : 'hover:bg-gray-100 text-ink-soft'
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}
          </div>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:border-vermilion transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Share All Button */}
      {pageItems.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleShareAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-vermilion transition-all text-sm font-medium"
          >
            <Share2 size={16} className="text-vermilion" />
            Share All
          </button>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-serif font-semibold">Upload New</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-vermilion transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image size={40} className="mx-auto text-ink-soft/40 mb-2" />
                <p className="text-sm font-medium text-ink-soft">Click to upload photo</p>
                <p className="text-xs text-ink-soft/60">JPG, PNG, WEBP • Max 10MB</p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </div>
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-vermilion transition-colors"
                onClick={() => videoInputRef.current?.click()}
              >
                <Video size={40} className="mx-auto text-ink-soft/40 mb-2" />
                <p className="text-sm font-medium text-ink-soft">Click to upload video</p>
                <p className="text-xs text-ink-soft/60">MP4, MOV • Max 50MB</p>
                <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
              </div>
            </div>
            {uploading && (
              <div className="mt-4 text-center">
                <Loader2 size={24} className="animate-spin text-vermilion mx-auto" />
                <p className="text-sm text-ink-soft mt-2">Uploading...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGallery;