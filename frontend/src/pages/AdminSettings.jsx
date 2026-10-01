import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useAdminLogs } from '../context/AdminLogsContext';
import api from '../services/api';
import {
  User, Mail, Lock, Phone, Key, Shield, Save, Eye, EyeOff,
  AlertCircle, Check, LogOut, UserPlus, Users, Clock,
  FileText, Activity, History as HistoryIcon, Calendar,
  Settings, Trash2, RefreshCw, Search, Filter, Camera,
  ChevronDown, ChevronUp, BadgeCheck, Crown
} from 'lucide-react';

const AdminSettings = () => {
  const { t, lang } = useLanguage();
  const { user, logout, setUser } = useAuth();
  const { showToast } = useToast();
  const { logs, loading: logsLoading, stats, fetchLogs, clearLogs } = useAdminLogs();
  
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Admin Profile Form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Profile Photo
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  // Password Change Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // New Admin Form
  const [newAdminForm, setNewAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  });

  const [showNewAdminForm, setShowNewAdminForm] = useState(false);

  // Fetch admin users
  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const response = await api.get('/admin/users');
        const admins = response.data.filter(u => u.role === 'admin');
        setAdminUsers(admins);
      } catch (error) {
        console.error('Error fetching admin users:', error);
        setAdminUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchAdminUsers();
  }, []);

  // Update Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/users/profile', {
        name: profileForm.name,
        phone: profileForm.phone,
      });
      showToast('Profile updated successfully', 'success');
      await api.post('/admin/activity/log', {
        action: 'Profile Updated',
        details: { name: profileForm.name },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Upload Profile Photo
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    setUploadingPhoto(true);
    try {
      const response = await api.post('/admin/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = response.data?.data?.profilePhoto;
      if (url) {
        setProfilePhoto(url);
        setUser({ ...user, profilePhoto: url });
        showToast('Profile photo updated successfully', 'success');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      showToast(error.response?.data?.message || 'Failed to upload photo', 'error');
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // Remove Profile Photo
  const handlePhotoRemove = async () => {
    setUploadingPhoto(true);
    try {
      await api.delete('/admin/profile/photo');
      setProfilePhoto('');
      setUser({ ...user, profilePhoto: null });
      showToast('Profile photo removed', 'success');
    } catch (error) {
      console.error('Photo remove error:', error);
      showToast(error.response?.data?.message || 'Failed to remove photo', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.put('/users/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showToast('Password changed successfully', 'success');
      await api.post('/admin/activity/log', {
        action: 'Password Changed',
        details: { user: user?.name },
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Change password error:', error);
      showToast(error.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Create New Admin
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/signup', {
        ...newAdminForm,
        role: 'admin',
      });
      showToast('New admin created successfully', 'success');
      await api.post('/admin/activity/log', {
        action: 'Admin Created',
        details: { email: newAdminForm.email, name: newAdminForm.name },
      });
      setNewAdminForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
      });
      setShowNewAdminForm(false);
      const response = await api.get('/admin/users');
      setAdminUsers(response.data.filter(u => u.role === 'admin'));
    } catch (error) {
      console.error('Create admin error:', error);
      showToast(error.response?.data?.message || 'Failed to create admin', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Remove Admin
  const handleRemoveAdmin = async (adminId, adminName) => {
    if (!window.confirm(`Are you sure you want to remove ${adminName} as admin?`)) return;
    setLoading(true);
    try {
      await api.put(`/admin/users/${adminId}/role`, { role: 'user' });
      showToast(`${adminName} removed from admin role`, 'success');
      await api.post('/admin/activity/log', {
        action: 'Admin Removed',
        details: { user: adminName },
      });
      const response = await api.get('/admin/users');
      setAdminUsers(response.data.filter(u => u.role === 'admin'));
    } catch (error) {
      console.error('Remove admin error:', error);
      showToast(error.response?.data?.message || 'Failed to remove admin', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  // Safe stats with default values
  const safeStats = {
    total: stats?.total || 0,
    today: stats?.today || 0,
    thisWeek: stats?.thisWeek || 0,
    thisMonth: stats?.thisMonth || 0,
  };

  // The server prunes to the newest N entries; surface that so the panel does
  // not look like it is showing a partial history.
  const logLimit = stats?.limit || 50;
  const retained = stats?.retained || logs.length;

  const filteredLogs = Array.isArray(logs) ? logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const detailsText = JSON.stringify(log.details || {}).toLowerCase();
    const matchesSearch = (log.displayMessage?.toLowerCase() || '').includes(term) ||
                          (log.action?.toLowerCase() || '').includes(term) ||
                          detailsText.includes(term);
    const matchesFilter = filterType === 'all' || log.action?.includes(filterType);
    return matchesSearch && matchesFilter;
  }) : [];

  // Build a short human-readable summary of what changed in a log entry
  const formatLogDetails = (details) => {
    if (!details || typeof details !== 'object') return '';
    const entries = Object.entries(details);
    if (entries.length === 0) return '';
    return entries
      .filter(([k, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => {
        let val = v;
        if (typeof val === 'object') val = JSON.stringify(val);
        return `${k}: ${String(val).slice(0, 120)}`;
      })
      .join(' · ');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings size={28} className="text-vermilion" />
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Admin Settings</h1>
          <p className="text-sm text-ink-soft">Manage your account, security, and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Profile & Security */}
        <div className="space-y-6">
          {/* Profile Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-serif font-semibold text-ink flex items-center gap-2 mb-4">
              <User size={20} className="text-vermilion" />
              Profile Settings
            </h2>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-gray-300" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-ink hover:border-vermilion hover:text-vermilion transition-all disabled:opacity-50"
                >
                  <Camera size={14} />
                  {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </button>
                {profilePhoto && (
                  <button
                    type="button"
                    onClick={handlePhotoRemove}
                    disabled={uploadingPhoto}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                )}
              </div>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={profileForm.name || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">Email</label>
                <input
                  type="email"
                  value={profileForm.email || ''}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50"
                  disabled
                />
                <p className="text-xs text-ink-soft mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-vermilion text-white text-sm font-semibold hover:bg-[#a83a0c] transition-all disabled:opacity-50"
              >
                <Save size={16} />
                {loading ? 'Saving...' : 'Update Profile'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-serif font-semibold text-ink flex items-center gap-2 mb-4">
              <Key size={20} className="text-vermilion" />
              Change Password
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword || ''}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-ink-soft hover:text-ink"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword || ''}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-ink-soft hover:text-ink"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-ink-soft mt-1">Minimum 6 characters</p>
              </div>
              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword || ''}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-ink-soft hover:text-ink"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-vermilion text-white text-sm font-semibold hover:bg-[#a83a0c] transition-all disabled:opacity-50"
              >
                <Key size={16} />
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Admin Users List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-serif font-semibold text-ink flex items-center gap-2 mb-4">
              <Shield size={20} className="text-vermilion" />
              Admin Users ({adminUsers.length || 0})
            </h2>
            
            {loadingUsers ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-3 border-vermilion border-t-transparent rounded-full animate-spin" />
              </div>
            ) : adminUsers.length === 0 ? (
              <p className="text-center text-ink-soft py-4">No admin users found</p>
            ) : (
              <div className="space-y-2">
                {adminUsers.map((admin) => (
                  <div key={admin._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-vermilion/10 text-vermilion flex items-center justify-center font-bold">
                        {admin.name?.charAt(0).toUpperCase() || 'A'}
                      </div>
                      <div>
                        <p className="font-medium text-ink text-sm">{admin.name || 'Unknown'}</p>
                        <p className="text-xs text-ink-soft">{admin.email || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-vermilion/10 text-vermilion flex items-center gap-1">
                        <Crown size={12} />
                        Admin
                      </span>
                      {admin._id !== user?._id && (
                        <button
                          onClick={() => handleRemoveAdmin(admin._id, admin.name)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          title="Remove Admin"
                        >
                          <UserPlus size={14} className="rotate-180" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Create Admin & Activity Logs */}
        <div className="space-y-6">
          {/* Create New Admin */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif font-semibold text-ink flex items-center gap-2">
                <UserPlus size={20} className="text-vermilion" />
                Create New Admin
              </h2>
              <button
                onClick={() => setShowNewAdminForm(!showNewAdminForm)}
                className="text-sm text-vermilion font-semibold hover:underline"
              >
                {showNewAdminForm ? 'Cancel' : 'Add Admin'}
              </button>
            </div>

            {showNewAdminForm && (
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-ink block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={newAdminForm.name || ''}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-ink block mb-1.5">Email</label>
                  <input
                    type="email"
                    value={newAdminForm.email || ''}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-ink block mb-1.5">Password</label>
                  <input
                    type="password"
                    value={newAdminForm.password || ''}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                    required
                    minLength="6"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-ink block mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={newAdminForm.phone || ''}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-vermilion text-white text-sm font-semibold hover:bg-[#a83a0c] transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Admin'}
                </button>
              </form>
            )}
          </div>

          {/* Admin Activity Logs - Simplified */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif font-semibold text-ink flex items-center gap-2">
                <HistoryIcon size={20} className="text-vermilion" />
                Activity Logs
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchLogs}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-all"
                  title="Refresh"
                >
                  <RefreshCw size={16} className="text-ink-soft" />
                </button>
                {logs && logs.length > 0 && (
                  <button
                    onClick={clearLogs}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-all"
                    title="Clear Logs"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Stats - Simplified */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-ink">{safeStats.total}</p>
                <p className="text-[10px] text-ink-soft">
                  Latest {logLimit}
                </p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="text-lg font-bold text-blue-600">{safeStats.today}</p>
                <p className="text-[10px] text-ink-soft">Today</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-600">{safeStats.thisWeek}</p>
                <p className="text-[10px] text-ink-soft">Week</p>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded-lg">
                <p className="text-lg font-bold text-purple-600">{safeStats.thisMonth}</p>
                <p className="text-[10px] text-ink-soft">Month</p>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-2.5 text-ink-soft" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-white"
              >
                <option value="all">All</option>
                <option value="Profile">Profile</option>
                <option value="Password">Password</option>
                <option value="Admin">Admin</option>
                <option value="Booking">Booking</option>
                <option value="Donation">Donation</option>
                <option value="Settings">Settings</option>
                <option value="Gallery">Gallery</option>
                <option value="Team">Team</option>
                <option value="History">History</option>
              </select>
            </div>

            {logsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-3 border-vermilion border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <p className="text-center text-ink-soft py-8">
                {searchTerm ? 'No logs match your search' : 'No admin activity recorded yet'}
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredLogs.map((log, index) => (
                  <div key={log._id || index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-50">
                    <div className="w-8 h-8 rounded-full bg-vermilion/10 text-vermilion flex items-center justify-center flex-shrink-0">
                      <Activity size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink font-medium">{log.displayMessage || log.action || 'Admin action'}</p>
                      {formatLogDetails(log.details) && (
                        <p className="text-xs text-ink-soft/80 mt-0.5 truncate">{formatLogDetails(log.details)}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-ink-soft/60 flex items-center gap-1">
                          <Clock size={12} />
                          {getTimeAgo(log.timestamp || log.createdAt || new Date())}
                        </span>
                        {log.user?.name && (
                          <span className="text-xs text-ink-soft/60 flex items-center gap-1">
                            <User size={12} />
                            {log.user.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Retention note: only the newest entries are kept */}
            <p className="mt-3 text-[10px] text-ink-soft/70">
              Showing the {Math.min(retained, logLimit)} most recent entries of a
              maximum {logLimit}. Older activity is removed automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;