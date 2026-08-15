import React, { useState, useEffect } from 'react';
import { 
  Database, Download, Upload, Trash2, RefreshCw, 
  Cloud, Clock, Users, CalendarDays, Gift, BookOpen,
  Image, ScrollText, Users as UsersIcon, Mail,
  Activity, Loader2, CheckCircle, XCircle, FileText,
  HardDrive, Server, Archive, Shield, Lock, X
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useBackup } from '../../context/BackupContext';
import OmLoader from '../../components/common/OmLoader';

const AdminBackup = ({ t }) => {
  const { showToast } = useToast();
  const {
    backups,
    loading,
    progress,
    isBackingUp,
    fetchBackups,
    createBackup,
    downloadBackup,
    downloadFromCloudinary,
    deleteBackup,
    getBackupStats,
  } = useBackup();

  const [stats, setStats] = useState(null);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchBackups();
    loadStats();
  }, []);

  const loadStats = async () => {
    const statsData = await getBackupStats();
    setStats(statsData);
  };

  const handleCreateBackup = async () => {
    await createBackup({
      description: 'Full system backup',
      type: 'full',
      includeDeleted: true,
    });
    loadStats();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      processing: 'bg-blue-100 text-blue-700 border-blue-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle size={14} className="text-green-500" />;
      case 'failed': return <XCircle size={14} className="text-red-500" />;
      case 'processing': return <Loader2 size={14} className="animate-spin text-blue-500" />;
      default: return <Clock size={14} className="text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-ink flex items-center gap-2">
            <Database size={24} className="text-[#7A0000]" />
            Backup & Restore
          </h2>
          <p className="text-sm text-ink-soft">Manage your data backups securely</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateBackup}
            disabled={isBackingUp}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#7A0000] text-white rounded-xl text-sm font-semibold hover:bg-[#5A0000] transition-all disabled:opacity-50"
          >
            {isBackingUp ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Cloud size={16} />
                Create Backup
              </>
            )}
          </button>
          <button
            onClick={() => { fetchBackups(); loadStats(); }}
            className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
          >
            <RefreshCw size={18} className="text-ink-soft" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {isBackingUp && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">Creating backup...</span>
            <span className="text-sm text-ink-soft">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#7A0000] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">Total Backups</p>
                <p className="text-2xl font-bold text-ink">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Archive size={18} className="text-blue-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">Total Size</p>
                <p className="text-2xl font-bold text-ink">{formatFileSize(stats.totalSize)}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <HardDrive size={18} className="text-green-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">Latest Backup</p>
                <p className="text-sm font-bold text-ink">
                  {stats.recent ? formatDate(stats.recent.createdAt) : 'No backups'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Clock size={18} className="text-purple-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">Storage</p>
                <p className="text-sm font-bold text-ink">Cloudinary</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Cloud size={18} className="text-amber-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backups Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-[#7A0000]/10 to-[#A00000]/5 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-sm font-serif font-semibold text-ink flex items-center gap-2">
            <Database size={16} className="text-[#7A0000]" />
            Backup History
          </h4>
          <span className="text-xs text-ink-soft">{backups.length} backups</span>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <OmLoader size="md" color="maroon" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-12">
              <Database size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No backups created yet</p>
              <p className="text-sm text-gray-400 mt-1">Click "Create Backup" to start</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Date</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Size</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup) => (
                    <tr key={backup._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-ink">{backup.name}</p>
                          <p className="text-xs text-ink-soft truncate max-w-[150px]">
                            {backup.description || 'Full backup'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 hidden md:table-cell text-gray-500 text-xs">
                        {formatDate(backup.createdAt)}
                      </td>
                      <td className="py-3 hidden lg:table-cell text-gray-500 text-xs">
                        {formatFileSize(backup.fileSize)}
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border ${getStatusBadge(backup.status)}`}>
                          {getStatusIcon(backup.status)}
                          {backup.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => downloadBackup(backup._id)}
                            className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          {backup.fileUrl && (
                            <button
                              onClick={() => downloadFromCloudinary(backup._id)}
                              className="p-1.5 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                              title="Download from Cloudinary"
                            >
                              <Cloud size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedBackup(backup);
                              setShowDetailModal(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#7A0000] hover:bg-gray-50 transition-all"
                            title="View Details"
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            onClick={() => deleteBackup(backup._id)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
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
      </div>

      {/* Backup Detail Modal */}
      {showDetailModal && selectedBackup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#7A0000]/10 to-[#A00000]/5 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-serif font-bold text-[#7A0000] flex items-center gap-2">
                <Database size={18} />
                Backup Details
              </h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedBackup(null);
                }}
                className="p-2 rounded-xl hover:bg-gray-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-medium">Name</p>
                  <p className="font-semibold text-ink">{selectedBackup.name}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-medium">Created</p>
                  <p className="font-semibold text-ink">{formatDate(selectedBackup.createdAt)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-medium">Status</p>
                  <p className={`font-semibold capitalize ${selectedBackup.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {selectedBackup.status}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-medium">Size</p>
                  <p className="font-semibold text-ink">{formatFileSize(selectedBackup.fileSize)}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 font-medium">Description</p>
                <p className="text-ink">{selectedBackup.description || 'No description'}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 font-medium">Statistics</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {selectedBackup.stats && Object.entries(selectedBackup.stats).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-ink-soft capitalize">{key}:</span>
                      <span className="text-xs font-bold text-ink">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 font-medium">Storage</p>
                <div className="flex items-center gap-2 mt-1">
                  {selectedBackup.fileUrl ? (
                    <>
                      <Cloud size={14} className="text-amber-500" />
                      <span className="text-sm text-ink">Stored in Cloudinary</span>
                      <a 
                        href={selectedBackup.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline ml-auto"
                      >
                        View
                      </a>
                    </>
                  ) : (
                    <>
                      <Server size={14} className="text-gray-400" />
                      <span className="text-sm text-ink-soft">Stored in database</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedBackup(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    downloadBackup(selectedBackup._id);
                    setShowDetailModal(false);
                    setSelectedBackup(null);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#7A0000] text-white rounded-xl text-sm font-semibold hover:bg-[#5A0000] transition-all"
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBackup;