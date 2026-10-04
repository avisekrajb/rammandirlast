import React, { useState, useEffect } from 'react';
import { 
  Trash2, User, Edit2, Mail, Phone, MapPin, Shield, 
  UserCog, Camera, Users as UsersIcon, Calendar, 
  Eye, X, ChevronRight, TrendingUp, UserPlus,
  Activity, BarChart3, Clock, Award
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../utils/formatDate';
import api from '../../services/api';
import DownloadMenu from './DownloadMenu';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';

/**
 * Column definitions for the CSV export. `User` records carry `createdAt`,
 * which is the "joined" date shown in the table.
 */
const USER_CSV_COLUMNS = (t) => [
  { key: 'name', label: t?.fullName || 'Full Name' },
  { key: 'email', label: t?.yourEmail || 'Email' },
  { key: 'phone', label: t?.phoneNumber || 'Phone', mono: true },
  { key: 'address', label: t?.address || 'Address', value: (u) => u.address || '' },
  { key: 'role', label: t?.role || 'Role' },
  {
    key: 'createdAt',
    label: t?.memberSince || 'Member Since',
    value: (u) => formatDateTime(u.createdAt),
  },
];

const AdminUsers = ({ users, setUsers, t }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userStats, setUserStats] = useState({
    total: 0,
    admins: 0,
    regularUsers: 0,
    newToday: 0,
    weeklyGrowth: 0
  });
  const [userGrowthData, setUserGrowthData] = useState([]);

  useEffect(() => {
    if (users && users.length > 0) {
      // Calculate stats
      const admins = users.filter(u => u.role === 'admin').length;
      const regularUsers = users.filter(u => u.role === 'user').length;
      
      // Calculate new users today
      const today = new Date().toDateString();
      const newToday = users.filter(u => {
        const createdAt = new Date(u.createdAt);
        return createdAt.toDateString() === today;
      }).length;

      // Calculate weekly growth data
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        const count = users.filter(u => {
          const createdAt = new Date(u.createdAt);
          return createdAt.toDateString() === dateStr;
        }).length;
        last7Days.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          users: count,
          cumulative: users.filter(u => {
            const createdAt = new Date(u.createdAt);
            return createdAt <= date;
          }).length
        });
      }

      // Calculate weekly growth percentage
      const totalLastWeek = users.filter(u => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(u.createdAt) >= weekAgo;
      }).length;

      setUserStats({
        total: users.length,
        admins,
        regularUsers,
        newToday,
        weeklyGrowth: users.length > 0 ? Math.round((totalLastWeek / users.length) * 100) : 0
      });

      setUserGrowthData(last7Days);
    }
  }, [users]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setLoading(true);
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      showToast(t.userRemoved || 'User removed successfully', 'success');
    } catch (error) {
      console.error('Delete user error:', error);
      showToast(error.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      setUsers(users.map(u => u._id === id ? { ...u, role } : u));
      showToast(t.savedSuccess || 'Role updated successfully', 'success');
    } catch (error) {
      console.error('Update role error:', error);
      showToast(error.response?.data?.message || 'Failed to update role', 'error');
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const getRoleColor = (role) => {
    if (role === 'admin') {
      return 'bg-vermilion/10 text-vermilion border-vermilion/20';
    }
    return 'bg-blue-50 text-blue-600 border-blue-200';
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') {
      return <Shield size={12} className="text-vermilion" />;
    }
    return <User size={12} className="text-blue-500" />;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100">
          <p className="text-xs font-semibold text-gray-700">{label}</p>
          <p className="text-sm font-bold text-[#7A0000]">{payload[0].value} users</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Total Users</p>
              <p className="text-2xl font-bold text-gray-800">{userStats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#7A0000]/10 flex items-center justify-center">
              <UsersIcon size={18} className="text-[#7A0000]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Admins</p>
              <p className="text-2xl font-bold text-vermilion">{userStats.admins}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-vermilion/10 flex items-center justify-center">
              <Shield size={18} className="text-vermilion" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Regular Users</p>
              <p className="text-2xl font-bold text-blue-600">{userStats.regularUsers}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <User size={18} className="text-blue-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">New Today</p>
              <p className="text-2xl font-bold text-green-600">{userStats.newToday}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <UserPlus size={18} className="text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Mini Graph - User Growth */}
      {userGrowthData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[#7A0000]" />
              <h4 className="text-sm font-semibold text-gray-700">User Growth (Last 7 Days)</h4>
            </div>
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              <Activity size={12} />
              +{userStats.weeklyGrowth}% this week
            </span>
          </div>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="userGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7A0000" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#7A0000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#7A0000" 
                  strokeWidth={2}
                  fill="url(#userGrowth)"
                  dot={{ fill: '#7A0000', r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7A0000]/10 to-[#A00000]/5 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UsersIcon size={18} className="text-[#7A0000]" />
            <h4 className="text-gray-700 font-semibold">{t.manageUsers || 'Manage Users'}</h4>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200">
              {users?.length || 0} users
            </span>
            <DownloadMenu
              rows={users || []}
              baseName="users"
              dateField="createdAt"
              t={t}
              columns={USER_CSV_COLUMNS(t)}
            />
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {users?.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">{t.noUsersYet || 'No users registered yet'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide">User</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Email</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Phone</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Joined</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          {/* Profile Photo - Clickable */}
                          <button
                            onClick={() => handleViewUser(user)}
                            className="relative group"
                          >
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-vermilion/10 to-maroon/10 border-2 border-gray-200 flex-shrink-0 transition-all group-hover:border-[#7A0000]">
                              {user.profilePhoto ? (
                                <img 
                                  src={user.profilePhoto} 
                                  alt={user.name} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = '';
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-vermilion to-maroon-deep text-white text-sm font-bold">
                                  {getInitials(user.name)}
                                </div>
                              )}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                            <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye size={12} className="text-white" />
                            </div>
                          </button>
                          <div>
                            <button 
                              onClick={() => handleViewUser(user)}
                              className="font-medium text-gray-800 hover:text-[#7A0000] transition-colors text-left"
                            >
                              {user.name}
                            </button>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock size={10} />
                              <span className="font-mono text-[10px]">ID: {user._id?.slice(-6) || 'N/A'}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                          <Mail size={13} className="text-gray-400" />
                          <span className="truncate max-w-[150px]">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-3 hidden md:table-cell text-gray-600 text-xs">
                        {user.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone size={13} className="text-gray-400" />
                            <span>{user.phone}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                          <Calendar size={13} className="text-gray-400" />
                          <span>{formatDate(user.createdAt).split(',')[0]}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border ${getRoleColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user._id, e.target.value)}
                              className={`text-xs font-semibold bg-transparent border-none focus:outline-none cursor-pointer ${
                                user.role === 'admin' ? 'text-vermilion' : 'text-blue-600'
                              }`}
                            >
                              <option value="user" className="text-gray-700">User</option>
                              <option value="admin" className="text-vermilion">Admin</option>
                            </select>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            disabled={loading}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                            title="Delete User"
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

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowUserModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#7A0000] to-[#A00000] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <h3 className="text-white font-serif font-bold text-lg flex items-center gap-2">
                <User size={20} />
                User Details
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-white/80 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Profile Photo - Large */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-vermilion/10 to-maroon/10 border-2 border-gray-200 flex-shrink-0">
                  {selectedUser.profilePhoto ? (
                    <img src={selectedUser.profilePhoto} alt={selectedUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-vermilion to-maroon-deep text-white text-2xl font-bold">
                      {getInitials(selectedUser.name)}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-800">{selectedUser.name}</h4>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                      {getRoleIcon(selectedUser.role)}
                      {selectedUser.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium">Email</p>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Mail size={14} className="text-gray-400" />
                    {selectedUser.email}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium">Phone</p>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Phone size={14} className="text-gray-400" />
                    {selectedUser.phone || 'Not provided'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium">Address</p>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <MapPin size={14} className="text-gray-400" />
                    {selectedUser.address || 'Not provided'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium">Member Since</p>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Calendar size={14} className="text-gray-400" />
                    {formatDate(selectedUser.createdAt)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium">User ID</p>
                  <p className="text-sm font-medium text-gray-700 font-mono text-xs">
                    {selectedUser._id}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium">Account Status</p>
                  <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Active
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-6 py-2 rounded-xl bg-[#7A0000] text-white font-semibold text-sm hover:bg-[#5A0000] transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;