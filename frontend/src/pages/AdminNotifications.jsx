import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import OmLoader from '../components/common/OmLoader';
import {
  Bell, User, Gift, Calendar, Mail, Phone, MapPin, 
  Check, X, Clock, Eye, EyeOff, Trash2, Users,
  CalendarDays, MessageSquare, DollarSign, FileText,
  Filter, Search, ChevronDown, ChevronUp, RefreshCw,
  Award, Heart, Star, Sparkles, TrendingUp, AlertCircle,
  BookOpen, Image, Settings, Home, CreditCard, Shield,
  AlertTriangle, Download, Printer, Filter as FilterIcon
} from 'lucide-react';

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message, count }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h3 className="text-xl font-serif font-bold text-ink mb-2">{title}</h3>
          <p className="text-sm text-ink-soft mb-2">{message}</p>
          {count > 0 && (
            <p className="text-sm font-semibold text-red-500 mb-4">
              This will delete {count} notification{count > 1 ? 's' : ''}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-ink-soft font-medium hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
            >
              Delete All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Item Component
const NotificationItem = ({ notification, onMarkRead, onDelete, onToggleExpand, isExpanded, getTimeAgo }) => {
  const isUnread = !notification.read;
  const isOld = new Date(notification.time) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  return (
    <div
      className={`border rounded-xl p-4 transition-all duration-300 ${
        isUnread 
          ? 'bg-white shadow-md border-gray-200 hover:shadow-lg' 
          : 'bg-gray-50/50 border-gray-100 opacity-80'
      } ${isOld ? 'border-l-4 border-l-amber-400' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.bgColor}`}>
          {notification.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={`text-sm font-semibold ${isUnread ? 'text-ink' : 'text-ink-soft'}`}>
                  {notification.title}
                </h4>
                {isUnread && (
                  <span className="w-2 h-2 rounded-full bg-vermilion flex-shrink-0 animate-pulse" />
                )}
                {isOld && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium">
                    Old
                  </span>
                )}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  notification.type === 'user' ? 'bg-blue-50 text-blue-600' :
                  notification.type === 'booking' ? 'bg-vermilion/10 text-vermilion' :
                  notification.type === 'donation' ? 'bg-green-50 text-green-600' :
                  notification.type === 'contact' ? 'bg-purple-50 text-purple-600' :
                  notification.type === 'subscribe' ? 'bg-amber-50 text-amber-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {notification.type}
                </span>
              </div>
              <p className={`text-sm ${isUnread ? 'text-ink-soft' : 'text-ink-soft/60'}`}>
                {notification.message}
              </p>
              {isExpanded && notification.data && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs space-y-1 border border-gray-100">
                  {notification.type === 'user' && (
                    <>
                      <p><strong className="text-ink">Name:</strong> <span className="text-ink-soft">{notification.data.name}</span></p>
                      <p><strong className="text-ink">Email:</strong> <span className="text-ink-soft">{notification.data.email}</span></p>
                      <p><strong className="text-ink">Phone:</strong> <span className="text-ink-soft">{notification.data.phone || 'N/A'}</span></p>
                      <p><strong className="text-ink">Role:</strong> <span className="text-ink-soft">{notification.data.role || 'user'}</span></p>
                      <p><strong className="text-ink">Joined:</strong> <span className="text-ink-soft">{new Date(notification.data.createdAt).toLocaleDateString()}</span></p>
                    </>
                  )}
                  {notification.type === 'booking' && (
                    <>
                      <p><strong className="text-ink">Name:</strong> <span className="text-ink-soft">{notification.data.name}</span></p>
                      <p><strong className="text-ink">Puja Type:</strong> <span className="text-ink-soft">{notification.data.type}</span></p>
                      <p><strong className="text-ink">Date:</strong> <span className="text-ink-soft">{notification.data.date}</span></p>
                      <p><strong className="text-ink">Time:</strong> <span className="text-ink-soft">{notification.data.time || 'N/A'}</span></p>
                      <p><strong className="text-ink">Status:</strong> <span className={`px-2 py-0.5 rounded-full text-xs ${
                        notification.data.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        notification.data.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        notification.data.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{notification.data.status || 'pending'}</span></p>
                    </>
                  )}
                  {notification.type === 'donation' && (
                    <>
                      <p><strong className="text-ink">Name:</strong> <span className="text-ink-soft">{notification.data.name}</span></p>
                      <p><strong className="text-ink">Amount:</strong> <span className="text-ink-soft font-bold text-vermilion">₹{notification.data.amount}</span></p>
                      <p><strong className="text-ink">Date:</strong> <span className="text-ink-soft">{new Date(notification.data.date).toLocaleDateString()}</span></p>
                      <p><strong className="text-ink">Status:</strong> <span className={`px-2 py-0.5 rounded-full text-xs ${
                        notification.data.status === 'completed' ? 'bg-green-100 text-green-700' :
                        notification.data.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{notification.data.status || 'pending'}</span></p>
                    </>
                  )}
                  {notification.type === 'contact' && (
                    <>
                      <p><strong className="text-ink">Name:</strong> <span className="text-ink-soft">{notification.data.name}</span></p>
                      <p><strong className="text-ink">Email:</strong> <span className="text-ink-soft">{notification.data.email}</span></p>
                      <p><strong className="text-ink">Phone:</strong> <span className="text-ink-soft">{notification.data.phone || 'N/A'}</span></p>
                      <p><strong className="text-ink">Message:</strong> <span className="text-ink-soft">{notification.data.message}</span></p>
                      <p><strong className="text-ink">Status:</strong> <span className={`px-2 py-0.5 rounded-full text-xs ${
                        notification.data.status === 'replied' ? 'bg-green-100 text-green-700' :
                        notification.data.status === 'read' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{notification.data.status || 'new'}</span></p>
                    </>
                  )}
                  {notification.type === 'subscribe' && (
                    <>
                      <p><strong className="text-ink">Email:</strong> <span className="text-ink-soft">{notification.data.email}</span></p>
                      <p><strong className="text-ink">Subscribed:</strong> <span className="text-ink-soft">{new Date(notification.data.createdAt || notification.time).toLocaleDateString()}</span></p>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onToggleExpand(notification.id)}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title="Expand"
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button
                onClick={() => onMarkRead(notification.id)}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title={isUnread ? 'Mark as read' : 'Mark as unread'}
              >
                {isUnread ? <Eye size={16} className="text-ink-soft" /> : <EyeOff size={16} className="text-ink-soft" />}
              </button>
              <button
                onClick={() => onDelete(notification.id)}
                className="p-1 rounded hover:bg-red-100 transition-colors text-red-400 hover:text-red-600"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-ink-soft/60 flex items-center gap-1">
              <Clock size={12} />
              {getTimeAgo(notification.time)}
            </span>
            {isUnread && (
              <span className="text-[10px] text-vermilion font-medium flex items-center gap-1">
                <AlertCircle size={10} />
                New
              </span>
            )}
            {isOld && (
              <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                <Clock size={10} />
                30+ days
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminNotifications = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    users: 0,
    bookings: 0,
    donations: 0,
    contacts: 0,
    subscribes: 0,
    old: 0
  });
  const fetched = useRef(false);

  // Map a backend notification to the shape used by the UI
  const mapNotification = (n) => {
    const type = n.type || 'system';
    let icon;
    let bgColor;
    switch (type) {
      case 'user':
        icon = <User size={18} className="text-blue-500" />;
        bgColor = 'bg-blue-50';
        break;
      case 'booking':
        icon = <CalendarDays size={18} className="text-vermilion" />;
        bgColor = 'bg-vermilion/10';
        break;
      case 'donation':
        icon = <Gift size={18} className="text-green-500" />;
        bgColor = 'bg-green-50';
        break;
      case 'contact':
        icon = <MessageSquare size={18} className="text-purple-500" />;
        bgColor = 'bg-purple-50';
        break;
      case 'subscribe':
        icon = <Mail size={18} className="text-amber-500" />;
        bgColor = 'bg-amber-50';
        break;
      default:
        icon = <Bell size={18} className="text-gray-500" />;
        bgColor = 'bg-gray-50';
        break;
    }
    return {
      id: n._id,
      type,
      title: n.title,
      message: n.message,
      time: n.createdAt || new Date().toISOString(),
      read: !!n.read,
      data: n.data || {},
      icon,
      bgColor,
    };
  };

  // Fetch real notifications from backend
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const fetchNotifications = async () => {
      try {
        const res = await api.get('/admin/notifications');

        const notifs = (res.data?.data || []).map(mapNotification);
        notifs.sort((a, b) => new Date(b.time) - new Date(a.time));

        setNotifications(notifs);
        updateStats(notifs, res.data?.stats);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        showToast('Failed to load notifications', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [showToast]);

  const handleDelete = (id) => {
    setDeleteType('single');
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const id = deleteId;
    try {
      await api.delete(`/admin/notifications/${id}`);

      const updatedNotifications = notifications.filter(n => n.id !== id);
      setNotifications(updatedNotifications);
      updateStats(updatedNotifications);

      showToast('Notification deleted successfully', 'success');
    } catch (error) {
      console.error('Delete notification error:', error);
      showToast('Failed to delete notification', 'error');
    }
    setShowDeleteModal(false);
    setDeleteId(null);
    setDeleteType(null);
  };

  const handleDeleteAll = () => {
    setDeleteType('all');
    setDeleteId(null);
    setShowDeleteModal(true);
  };

  const confirmDeleteAll = async () => {
    try {
      await api.delete('/admin/notifications', { data: { type: filter } });

      const remaining = filter === 'all'
        ? []
        : notifications.filter(n => n.type !== filter);

      setNotifications(remaining);
      updateStats(remaining);

      showToast('Notifications deleted successfully', 'success');
    } catch (error) {
      console.error('Delete all notifications error:', error);
      showToast('Failed to delete notifications', 'error');
    }
    setShowDeleteModal(false);
    setDeleteType(null);
  };

  const handleMarkRead = async (id) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;

    const wasUnread = !notification.read;
    const nextRead = !notification.read;

    // Optimistic update
    const updatedNotifications = notifications.map(n => {
      if (n.id === id) {
        return { ...n, read: nextRead };
      }
      return n;
    });

    setNotifications(updatedNotifications);
    updateStats(updatedNotifications);

    try {
      await api.put(`/admin/notifications/${id}/read`, { read: nextRead });
      showToast(wasUnread ? 'Notification marked as read' : 'Notification marked as unread', 'success');
    } catch (error) {
      console.error('Mark notification read error:', error);
      // Revert on failure
      setNotifications(notifications);
      updateStats(notifications);
      showToast('Failed to update notification', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    const unreadCount = notifications.filter(n => !n.read).length;

    const updatedNotifications = notifications.map(n => ({
      ...n,
      read: true
    }));

    setNotifications(updatedNotifications);
    updateStats(updatedNotifications);

    try {
      await api.put('/admin/notifications/read-all');
      showToast(`Marked ${unreadCount} notifications as read`, 'success');
    } catch (error) {
      console.error('Mark all read error:', error);
      showToast('Failed to mark all as read', 'error');
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const refreshNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/notifications');

      const notifs = (res.data?.data || []).map(mapNotification);
      notifs.sort((a, b) => new Date(b.time) - new Date(a.time));

      setNotifications(notifs);
      updateStats(notifs, res.data?.stats);
      showToast('Notifications refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      showToast('Failed to refresh', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (notifs, serverStats) => {
    const unreadCount = notifs.filter(n => !n.read).length;
    const userCount = notifs.filter(n => n.type === 'user').length;
    const bookingCount = notifs.filter(n => n.type === 'booking').length;
    const donationCount = notifs.filter(n => n.type === 'donation').length;
    const contactCount = notifs.filter(n => n.type === 'contact').length;
    const subscribeCount = notifs.filter(n => n.type === 'subscribe').length;

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const oldCount = notifs.filter(n => new Date(n.time) < threeMonthsAgo).length;

    setStats({
      total: serverStats?.total ?? notifs.length,
      unread: serverStats?.unread ?? unreadCount,
      users: serverStats?.users ?? userCount,
      bookings: serverStats?.bookings ?? bookingCount,
      donations: serverStats?.donations ?? donationCount,
      contacts: serverStats?.contacts ?? contactCount,
      subscribes: serverStats?.subscribes ?? subscribeCount,
      old: oldCount
    });
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesFilter = filter === 'all' || n.type === filter;
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (n.data?.name && n.data.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffMonths < 1) return `${diffDays}d ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${Math.floor(diffMonths / 12)}y ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <OmLoader size="lg" color="vermilion" className="mx-auto mb-4" />
          <p className="text-ink-soft text-sm">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 text-center hover:shadow-md transition-all">
          <div className="text-xl font-bold text-ink">{stats.total}</div>
          <div className="text-[10px] text-ink-soft font-medium">Total</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-vermilion/20 p-3 text-center hover:shadow-md transition-all">
          <div className="text-xl font-bold text-vermilion">{stats.unread}</div>
          <div className="text-[10px] text-ink-soft font-medium">Unread</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-3 text-center hover:shadow-md transition-all">
          <div className="text-xl font-bold text-blue-600">{stats.users}</div>
          <div className="text-[10px] text-ink-soft font-medium">Users</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-vermilion/10 p-3 text-center hover:shadow-md transition-all">
          <div className="text-xl font-bold text-vermilion">{stats.bookings}</div>
          <div className="text-[10px] text-ink-soft font-medium">Bookings</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-green-100 p-3 text-center hover:shadow-md transition-all">
          <div className="text-xl font-bold text-green-600">{stats.donations}</div>
          <div className="text-[10px] text-ink-soft font-medium">Donations</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-3 text-center hover:shadow-md transition-all">
          <div className="text-xl font-bold text-purple-600">{stats.contacts}</div>
          <div className="text-[10px] text-ink-soft font-medium">Contacts</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-3 text-center hover:shadow-md transition-all">
          <div className="text-xl font-bold text-amber-600">{stats.subscribes}</div>
          <div className="text-[10px] text-ink-soft font-medium">Subscribers</div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Notifications</h1>
          <p className="text-sm text-ink-soft">
            {stats.unread > 0 ? `${stats.unread} unread notifications` : 'All caught up! 🎉'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={refreshNotifications}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all"
            title="Refresh"
          >
            <RefreshCw size={18} className="text-ink-soft" />
          </button>
          {notifications.length > 0 && (
            <>
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2 rounded-lg bg-vermilion/10 text-vermilion text-sm font-semibold hover:bg-vermilion/20 transition-all"
              >
                Mark All Read
              </button>
              <button
                onClick={handleDeleteAll}
                className="px-4 py-2 rounded-lg bg-red-50 text-red-500 text-sm font-semibold hover:bg-red-100 transition-all"
              >
                Delete All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {['all', 'user', 'booking', 'donation', 'contact', 'subscribe'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === type
                  ? 'bg-vermilion text-white shadow-md shadow-vermilion/20'
                  : 'bg-gray-100 text-ink-soft hover:bg-gray-200'
              }`}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-1.5 pl-9 border border-gray-200 rounded-lg focus:border-vermilion focus:ring-2 focus:ring-vermilion/10 focus:outline-none text-sm"
          />
          <Search size={16} className="absolute left-3 top-2 text-ink-soft" />
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
          <Bell size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-ink-soft font-medium">No notifications</p>
          <p className="text-sm text-ink-soft/60 mt-1">All caught up! 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
              onToggleExpand={toggleExpand}
              isExpanded={expandedId === notification.id}
              getTimeAgo={getTimeAgo}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteId(null);
          setDeleteType(null);
        }}
        onConfirm={() => {
          if (deleteType === 'all') {
            confirmDeleteAll();
          } else {
            confirmDelete();
          }
        }}
        title={deleteType === 'all' ? "Delete All Notifications" : "Delete Notification"}
        message={deleteType === 'all' 
          ? "Are you sure you want to delete all notifications? This action cannot be undone."
          : "Are you sure you want to delete this notification?"
        }
        count={deleteType === 'all' ? notifications.length : 1}
      />
    </div>
  );
};

export default AdminNotifications;