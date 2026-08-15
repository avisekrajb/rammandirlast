import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import OmLoader from '../components/common/OmLoader';
import {
  Image, Video, Search, X, Download, Trash2,
  FolderOpen, HardDrive, Calendar,
  ChevronLeft, ChevronRight, RefreshCw,
  CheckSquare, Square, Loader2,
  Grid, List, Eye, EyeOff, AlertCircle,
  File, Film, Camera, Music
} from 'lucide-react';

const CloudGalleryPage = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [error, setError] = useState(null);
  const [deletingIds, setDeletingIds] = useState([]);

  const fetched = useRef(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const fetchResources = useCallback(async (cursor = null, search = '', type = 'all') => {
    setLoading(true);
    setError(null);
    try {
      let url = `/admin/cloud/resources?maxResults=50`;
      if (cursor) url += `&nextCursor=${cursor}`;
      if (type !== 'all') url += `&type=${type}`;
      
      const response = await api.get(url);
      
      if (response.data) {
        setResources(response.data.resources || []);
        setNextCursor(response.data.nextCursor);
        setHasMore(response.data.hasMore || false);
        setTotalCount(response.data.total || 0);
        
        if (response.data.message) {
          showToast(response.data.message, 'warning');
        }
      } else {
        setResources([]);
        setTotalCount(0);
        setError('No data received from server');
      }
    } catch (error) {
      console.error('Fetch resources error:', error);
      setError(error.response?.data?.message || 'Failed to fetch resources');
      showToast(error.response?.data?.message || 'Failed to fetch resources', 'error');
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/admin/cloud/stats');
      if (response.data && response.data.success) {
        setStats(response.data.stats);
      } else {
        setStats({
          totalResources: 0,
          totalImages: 0,
          totalVideos: 0,
          totalSizeMB: 0,
          totalSizeGB: 0,
        });
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
      setStats({
        totalResources: 0,
        totalImages: 0,
        totalVideos: 0,
        totalSizeMB: 0,
        totalSizeGB: 0,
      });
    }
  }, []);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchResources();
    fetchStats();
  }, [fetchResources, fetchStats]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLoading(true);
      setError(null);
      api.get(`/admin/cloud/search?q=${encodeURIComponent(searchQuery)}&type=${filterType}`)
        .then(response => {
          if (response.data) {
            setResources(response.data.resources || []);
            setTotalCount(response.data.total || 0);
            setHasMore(false);
            setNextCursor(null);
            if (response.data.message) {
              showToast(response.data.message, 'warning');
            }
          }
        })
        .catch(error => {
          console.error('Search error:', error);
          showToast('Search failed', 'error');
          setResources([]);
        })
        .finally(() => setLoading(false));
    } else {
      fetchResources();
    }
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    setResources([]);
    setSelectedIds([]);
    fetchResources(null, '', type);
  };

  const handleLoadMore = () => {
    if (hasMore && nextCursor) {
      fetchResources(nextCursor);
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === resources.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(resources.map(r => r.id));
    }
  };

  // Helper function to extract public ID from resource
  const extractPublicId = (id) => {
    if (!id) return null;
    // Remove 'temple/' prefix if present
    if (id.startsWith('temple/')) {
      return id.substring(7);
    }
    return id;
  };

  const handleDeleteSingle = async (id) => {
    // Check if already deleting
    if (deletingIds.includes(id)) return;

    if (!window.confirm('Delete this resource? This action cannot be undone.')) {
      return;
    }

    setDeletingIds(prev => [...prev, id]);
    try {
      const resource = resources.find(r => r.id === id);
      const publicId = extractPublicId(id);
      const type = resource?.type || 'image';
      
      console.log(`🗑️ Deleting: ${publicId} (${type})`);
      
      try {
        const response = await api.delete(`/admin/cloud/resource/${encodeURIComponent(publicId)}?resourceType=${type}`);
        
        if (response.data.success) {
          if (response.data.alreadyDeleted) {
            showToast('Resource was already deleted', 'info');
          } else {
            showToast('Resource deleted successfully', 'success');
          }
          // Remove from local state
          setResources(resources.filter(r => r.id !== id));
          setSelectedIds(selectedIds.filter(i => i !== id));
          fetchStats();
        } else {
          showToast(response.data.message || 'Failed to delete resource', 'error');
        }
      } catch (deleteError) {
        console.error('Delete error:', deleteError);
        
        // If delete fails with 404, resource already gone
        if (deleteError.response?.status === 404 || deleteError.response?.status === 400) {
          showToast('Resource already deleted or not found', 'info');
          // Remove from local state anyway
          setResources(resources.filter(r => r.id !== id));
          setSelectedIds(selectedIds.filter(i => i !== id));
          fetchStats();
        } else {
          const errorMsg = deleteError.response?.data?.message || 'Failed to delete resource';
          showToast(errorMsg, 'error');
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Failed to delete resource', 'error');
    } finally {
      setDeletingIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      showToast('Please select resources to delete', 'warning');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} resources? This action cannot be undone.`)) {
      return;
    }

    setDeleteLoading(true);
    try {
      // Extract public IDs
      const cleanedIds = selectedIds.map(id => extractPublicId(id)).filter(Boolean);
      
      console.log(`🗑️ Bulk deleting: ${cleanedIds.length} resources`);
      
      const response = await api.post('/admin/cloud/resources/delete', {
        publicIds: cleanedIds,
        resourceType: 'all',
      });
      
      if (response.data.success) {
        const successCount = response.data.successCount || 0;
        const alreadyDeleted = response.data.alreadyDeletedCount || 0;
        let message = `Deleted ${successCount} resources successfully`;
        if (alreadyDeleted > 0) {
          message += ` (${alreadyDeleted} were already deleted)`;
        }
        showToast(message, 'success');
        
        // Remove deleted resources from state
        const deletedIds = response.data.results
          .filter(r => r.success)
          .map(r => {
            // Add back 'temple/' prefix if it was there originally
            const originalId = selectedIds.find(id => extractPublicId(id) === r.publicId);
            return originalId || r.publicId;
          });
        
        setResources(resources.filter(r => !deletedIds.includes(r.id)));
        setSelectedIds([]);
        fetchStats();
      } else {
        showToast(response.data.message || 'Failed to delete resources', 'error');
      }
    } catch (error) {
      console.error('Delete selected error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to delete resources';
      showToast(errorMsg, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownload = (url, filename) => {
    if (!url) {
      showToast('No URL available for download', 'error');
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewDetail = (resource) => {
    setSelectedResource(resource);
    setShowDetailModal(true);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const getFileType = (resource) => {
    if (!resource) return 'other';
    if (resource.type === 'video') return 'video';
    if (resource.format === 'svg') return 'svg';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(resource.format?.toLowerCase())) {
      return 'image';
    }
    return 'other';
  };

  const getFileIcon = (resource) => {
    const type = getFileType(resource);
    if (type === 'video') return <Video size={24} className="text-blue-500" />;
    if (type === 'svg') return <File size={24} className="text-orange-500" />;
    if (type === 'image') return <Image size={24} className="text-green-500" />;
    return <File size={24} className="text-gray-500" />;
  };

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-serif font-semibold text-ink">Access Denied</h2>
          <p className="text-ink-soft mt-2">You need admin privileges to view this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Cloud Storage Manager</h1>
          <p className="text-sm text-ink-soft">Manage all photos and videos stored in Cloudinary</p>
        </div>
        <button
          onClick={() => { fetchResources(); fetchStats(); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-vermilion text-white font-semibold text-sm hover:bg-[#a83a0c] transition-all"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <FolderOpen size={20} />
              </div>
              <div>
                <div className="text-xl font-bold">{stats.totalResources || 0}</div>
                <div className="text-xs text-ink-soft">Total Files</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
                <Camera size={20} />
              </div>
              <div>
                <div className="text-xl font-bold">{stats.totalImages || 0}</div>
                <div className="text-xs text-ink-soft">Images</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <Film size={20} />
              </div>
              <div>
                <div className="text-xl font-bold">{stats.totalVideos || 0}</div>
                <div className="text-xs text-ink-soft">Videos</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
                <HardDrive size={20} />
              </div>
              <div>
                <div className="text-xl font-bold">{stats.totalSizeGB || 0} GB</div>
                <div className="text-xs text-ink-soft">Total Size</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by filename..."
              className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl focus:border-vermilion focus:outline-none transition-colors text-sm"
            />
            <Search size={18} className="absolute left-3 top-3 text-ink-soft" />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 rounded-xl bg-vermilion text-white font-semibold text-sm hover:bg-[#a83a0c] transition-all"
          >
            Search
          </button>
        </div>

        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                filterType === 'all' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange('image')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                filterType === 'image' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
              }`}
            >
              Images
            </button>
            <button
              onClick={() => handleFilterChange('video')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                filterType === 'video' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
              }`}
            >
              Videos
            </button>
          </div>

          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Selection Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <button
            onClick={handleSelectAll}
            className="text-sm text-ink-soft hover:text-ink transition-colors"
          >
            {selectedIds.length === resources.length ? 'Deselect All' : 'Select All'}
          </button>
          <div className="flex-1" />
          <button
            onClick={handleDeleteSelected}
            disabled={deleteLoading}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all disabled:opacity-50 text-sm font-semibold"
          >
            {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Delete Selected
          </button>
        </div>
      )}

      {/* Resources Grid */}
      {loading && resources.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <OmLoader size="lg" color="vermilion" />
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen size={64} className="mx-auto text-ink-soft/30 mb-4" />
          <p className="text-ink-soft">No resources found</p>
          <p className="text-sm text-ink-soft/60 mt-2">Upload some files to get started</p>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {resources.map((resource) => {
            const isSelected = selectedIds.includes(resource.id);
            const isVideo = resource.type === 'video';
            const isDeleting = deletingIds.includes(resource.id);
            
            return (
              <div
                key={resource.id || Math.random()}
                className={`group relative bg-white rounded-xl overflow-hidden shadow-sm border-2 transition-all ${
                  isSelected ? 'border-vermilion shadow-md' : 'border-gray-100 hover:border-gray-200'
                } ${isDeleting ? 'opacity-50' : ''}`}
              >
                {/* Thumbnail */}
                <div 
                  className="aspect-square bg-gray-100 cursor-pointer relative"
                  onClick={() => handleViewDetail(resource)}
                >
                  {resource.url ? (
                    isVideo ? (
                      <video
                        src={resource.url}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={resource.url}
                        alt={resource.filename || 'Resource'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-soft/30">
                      <Image size={32} />
                    </div>
                  )}
                  {isVideo && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                      <Video size={12} /> Video
                    </div>
                  )}
                  {isDeleting && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-white" />
                    </div>
                  )}
                </div>

                {/* Selection checkbox */}
                <button
                  onClick={() => handleSelect(resource.id)}
                  className="absolute top-2 left-2 p-1 rounded-lg bg-white/90 hover:bg-white transition-all shadow-sm"
                  disabled={isDeleting}
                >
                  {isSelected ? (
                    <CheckSquare size={18} className="text-vermilion" />
                  ) : (
                    <Square size={18} className="text-ink-soft/50" />
                  )}
                </button>

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleViewDetail(resource)}
                    className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all"
                    disabled={isDeleting}
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleDownload(resource.url, resource.filename)}
                    className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all"
                    disabled={isDeleting}
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteSingle(resource.id)}
                    className="p-2 rounded-lg bg-red-500/70 text-white hover:bg-red-500 transition-all"
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  </button>
                </div>

                {/* Info footer */}
                <div className="p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-ink-soft truncate flex-1" title={resource.filename || 'Unknown'}>
                      {resource.filename || 'Unknown'}
                    </span>
                    <span className="text-[10px] text-ink-soft/60 whitespace-nowrap ml-1">
                      {formatFileSize(resource.size)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-bold text-ink-soft uppercase tracking-wide w-10">
                  <button onClick={handleSelectAll}>
                    {selectedIds.length === resources.length ? (
                      <CheckSquare size={18} className="text-vermilion" />
                    ) : (
                      <Square size={18} className="text-ink-soft/50" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-ink-soft uppercase tracking-wide">File</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-ink-soft uppercase tracking-wide hidden md:table-cell">Type</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-ink-soft uppercase tracking-wide hidden lg:table-cell">Size</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-ink-soft uppercase tracking-wide hidden xl:table-cell">Date</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-ink-soft uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => {
                const isSelected = selectedIds.includes(resource.id);
                const isVideo = resource.type === 'video';
                const isDeleting = deletingIds.includes(resource.id);
                
                return (
                  <tr key={resource.id || Math.random()} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isDeleting ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => handleSelect(resource.id)} disabled={isDeleting}>
                        {isSelected ? (
                          <CheckSquare size={18} className="text-vermilion" />
                        ) : (
                          <Square size={18} className="text-ink-soft/50" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {getFileIcon(resource)}
                        <div>
                          <div className="font-medium text-ink truncate max-w-[150px] md:max-w-[200px]">
                            {resource.filename || 'Unknown'}
                          </div>
                          <div className="text-xs text-ink-soft md:hidden">
                            {formatFileSize(resource.size)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                        isVideo ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {isVideo ? <Video size={12} /> : <Camera size={12} />}
                        {isVideo ? 'Video' : 'Image'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-ink-soft">
                      {formatFileSize(resource.size)}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-ink-soft text-xs">
                      {formatDate(resource.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetail(resource)}
                          className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                          disabled={isDeleting}
                        >
                          <Eye size={16} className="text-ink-soft" />
                        </button>
                        <button
                          onClick={() => handleDownload(resource.url, resource.filename)}
                          className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                          disabled={isDeleting}
                        >
                          <Download size={16} className="text-ink-soft" />
                        </button>
                        <button
                          onClick={() => handleDeleteSingle(resource.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          disabled={isDeleting}
                        >
                          {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} className="text-red-400 hover:text-red-600" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Load More */}
      {hasMore && resources.length > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-vermilion text-vermilion font-semibold text-sm hover:bg-vermilion hover:text-white transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Load More ({resources.length} of {totalCount})
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedResource && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <h3 className="text-lg font-serif font-semibold">File Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Preview */}
              <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-4">
                {selectedResource.type === 'video' ? (
                  selectedResource.url ? (
                    <video
                      src={selectedResource.url}
                      className="w-full h-full object-cover"
                      controls
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-soft/30">
                      <Video size={48} />
                    </div>
                  )
                ) : (
                  selectedResource.url ? (
                    <img
                      src={selectedResource.url}
                      alt={selectedResource.filename || 'Resource'}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-soft/30">
                      <Image size={48} />
                    </div>
                  )
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-bold text-ink-soft uppercase tracking-wide">Filename</label>
                    <p className="text-sm font-medium break-all">{selectedResource.filename || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-soft uppercase tracking-wide">Type</label>
                    <p className="text-sm font-medium capitalize">{selectedResource.type || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-soft uppercase tracking-wide">Format</label>
                    <p className="text-sm font-medium uppercase">{selectedResource.format || 'Unknown'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-bold text-ink-soft uppercase tracking-wide">Size</label>
                    <p className="text-sm font-medium">{formatFileSize(selectedResource.size)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-soft uppercase tracking-wide">Dimensions</label>
                    <p className="text-sm font-medium">{selectedResource.width || 0} × {selectedResource.height || 0} px</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink-soft uppercase tracking-wide">Uploaded</label>
                    <p className="text-sm font-medium">{formatDate(selectedResource.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleDownload(selectedResource.url, selectedResource.filename)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-vermilion text-white font-semibold text-sm hover:bg-[#a83a0c] transition-all"
                >
                  <Download size={16} />
                  Download
                </button>
                <button
                  onClick={() => {
                    handleDeleteSingle(selectedResource.id);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-500 font-semibold text-sm hover:bg-red-100 transition-all"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudGalleryPage;