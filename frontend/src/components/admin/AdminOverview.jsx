import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import OmLoader from '../../components/common/OmLoader';
import {
  Users, CalendarDays, Gift, ClipboardList, Check, X, BadgeCheck,
  Eye, Activity, ArrowUp, ArrowDown, DollarSign, UserPlus,
  TrendingUp, Calendar, Clock, BookOpen, Image, MessageCircle,
  Home, Settings, Bell, Shield, Award, Star, Heart, MapPin,
  Globe, Monitor, Smartphone, Tablet, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area, ComposedChart
} from 'recharts';

// Format a coordinate to a readable value (e.g. 27.7172°)
const formatCoord = (val) => {
  const n = Number(val);
  if (Number.isNaN(n)) return '—';
  return n.toFixed(4);
};

const AdminOverview = ({ settings, users, events, donations, bookings, t, lang }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visitorStats, setVisitorStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7');
  const [contactStats, setContactStats] = useState({ total: 0, pending: 0, read: 0, replied: 0 });
  const [blogStats, setBlogStats] = useState({ total: 0, published: 0, draft: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [visitorRes, activityRes, contactRes, blogRes] = await Promise.all([
          api.get(`/visitors/stats?days=${timeRange}`),
          api.get('/admin/activity'),
          api.get('/contact/stats'),
          api.get('/admin/blogs')
        ]);
        
        setVisitorStats(visitorRes.data.data);
        setRecentActivities(activityRes.data.slice(0, 5));
        setContactStats(contactRes.data.data);
        
        const blogs = blogRes.data.data || [];
        setBlogStats({
          total: blogs.length,
          published: blogs.filter(b => b.published !== false).length,
          draft: blogs.filter(b => b.published === false).length
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [timeRange]);

  const statusCounts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  bookings?.forEach((b) => {
    if (statusCounts[b.status] !== undefined) statusCounts[b.status]++;
  });

  const statusColors = {
    pending: '#F59E0B',
    confirmed: '#16A34A',
    completed: '#0EA5E9',
    cancelled: '#EF4444',
  };

  const statusLabels = {
    pending: t.statusPending || 'Pending',
    confirmed: t.statusConfirmed || 'Confirmed',
    completed: t.statusCompleted || 'Completed',
    cancelled: t.statusCancelled || 'Cancelled',
  };

  const totalDonors = (settings?.donate?.baseCount || 0) + (donations?.length || 0);
  const totalDonationAmount = donations?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

  // Real visitor change between the last 7 days and the previous 7 days
  const daily = visitorStats?.dailyStats || [];
  const last7 = daily.slice(-7).reduce((sum, d) => sum + (d.count || 0), 0);
  const prev7 = daily.slice(-14, -7).reduce((sum, d) => sum + (d.count || 0), 0);
  const visitorChange = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : null;

  // Prepare chart data
  const barData = visitorStats?.dailyStats?.slice(-14).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    visitors: d.count || 0,
    sessions: d.sessions || 0,
    uniqueIPs: d.uniqueIPs || 0,
  })) || [];

  const pieData = Object.entries(statusCounts)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: statusLabels[key] || key,
      value: value,
      color: statusColors[key],
    }));

  const lineData = visitorStats?.dailyStats?.slice(-7).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    visitors: d.count || 0,
  })) || [];

  const pieColors = ['#F59E0B', '#16A34A', '#0EA5E9', '#EF4444'];

  // Prepare location data for display
  const locationData = visitorStats?.locationStats || [];

  // Prepare device data
  const deviceData = visitorStats?.deviceStats || {};
  const deviceChartData = Object.entries(deviceData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Stats cards with real data
  const stats = [
    { 
      icon: Users, 
      label: 'Total Users', 
      value: users?.length || 0,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      path: '/admin/users',
    },
    { 
      icon: Eye, 
      label: 'Total Visitors', 
      value: visitorStats?.totalVisitors || 0,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      change: visitorChange !== null ? `${visitorChange >= 0 ? '+' : ''}${visitorChange}%` : null,
      trend: visitorChange !== null && visitorChange >= 0 ? 'up' : 'down',
      path: '/admin/visitors',
    },
    { 
      icon: Gift, 
      label: 'Total Donors', 
      value: totalDonors,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      path: '/admin/donations',
    },
    { 
      icon: CalendarDays, 
      label: 'Total Events', 
      value: events?.length || 0,
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      path: '/admin/events',
    },
    { 
      icon: ClipboardList, 
      label: 'Total Bookings', 
      value: bookings?.length || 0,
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      path: '/admin/bookings',
    },
    { 
      icon: BookOpen, 
      label: 'Blog Posts', 
      value: blogStats.total,
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-600',
      path: '/admin/blogs',
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100">
          <p className="text-sm font-semibold text-ink">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-xs text-ink-soft">
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Get status icon for activity
  const getActivityIcon = (type) => {
    switch(type) {
      case 'booking': return <ClipboardList size={14} className="text-blue-500" />;
      case 'donation': return <Gift size={14} className="text-green-500" />;
      case 'user': return <UserPlus size={14} className="text-purple-500" />;
      default: return <Activity size={14} className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <OmLoader size="lg" color="maroon" className="mx-auto mb-4" />
          <p className="text-ink-soft">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#7A0000] to-[#A00000] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold">Welcome back, {user?.name || 'Admin'}! 👋</h2>
            <p className="text-white/70 text-sm mt-1">Here's what's happening with your temple today</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-white/60">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{bookings?.length || 0}</div>
            <div className="text-[10px] text-white/70">Total Bookings</div>
          </div>
        </div>
      </div>

      {/* Stats Grid - 6 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              onClick={() => stat.path && navigate(stat.path)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-[#7A0000]/20 hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-medium text-ink-soft uppercase tracking-wider">{stat.label}</p>
                  <p className="text-xl font-bold font-serif text-ink mt-1">{stat.value.toLocaleString()}</p>
                  {stat.change && (
                    <p className={`text-[10px] font-semibold mt-0.5 flex items-center gap-0.5 ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.trend === 'up' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                      {stat.change}
                    </p>
                  )}
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                  <Icon size={16} className={stat.iconColor} />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[#7A0000] opacity-0 group-hover:opacity-100 transition-opacity">
                View details <ChevronRight size={12} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar Chart - Daily Visitors */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-serif font-semibold text-ink">Daily Visitors</h4>
              <p className="text-xs text-ink-soft">Last {barData.length} days</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-soft">
              <Activity size={14} className="text-[#7A0000]" />
              <span>Total: {visitorStats?.totalVisitors || 0}</span>
            </div>
          </div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="visitors" fill="#7A0000" radius={[4, 4, 0, 0]} name="Visitors" />
                <Bar dataKey="uniqueIPs" fill="#E8A93D" radius={[4, 4, 0, 0]} name="Unique IPs" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-ink-soft">
              No data available
            </div>
          )}
        </div>

        {/* Pie Chart - Booking Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-serif font-semibold text-ink">Booking Status</h4>
              <p className="text-xs text-ink-soft">Distribution of all bookings</p>
            </div>
            <ClipboardList size={16} className="text-[#7A0000]" />
          </div>
          {pieData.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 min-w-[120px]">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: item.color || pieColors[index] }} />
                      <span className="text-ink-soft">{item.name}</span>
                    </div>
                    <span className="font-semibold text-ink">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-ink-soft">
              No bookings data available
            </div>
          )}
        </div>
      </div>

      {/* Second Row - Line and Visitor Location */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Line Chart - Visitor Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-serif font-semibold text-ink">Visitor Trend</h4>
              <p className="text-xs text-ink-soft">Last 7 days</p>
            </div>
            <TrendingUp size={16} className="text-green-500" />
          </div>
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="visitors" 
                  stroke="#7A0000" 
                  strokeWidth={2}
                  dot={{ fill: '#7A0000', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Visitors"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-ink-soft">
              No data available
            </div>
          )}
        </div>

        {/* Visitor Location Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-serif font-semibold text-ink flex items-center gap-2">
                <MapPin size={16} className="text-[#7A0000]" />
                Visitor Locations
              </h4>
              <p className="text-xs text-ink-soft">Real visitor locations</p>
            </div>
            <Globe size={16} className="text-ink-soft" />
          </div>
          {locationData.length > 0 ? (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {locationData.slice(0, 6).map((location, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#7A0000] flex-shrink-0" />
                      <span className="text-sm text-ink-soft truncate">
                        {location.country}
                        {location.city && location.city !== 'Unknown' && `, ${location.city}`}
                      </span>
                    </div>
                    {location.locations && location.locations.length > 0 && (
                      <span className="text-[11px] text-ink-soft/70 ml-6 font-mono">
                        {formatCoord(location.locations[0].lat)}°, {formatCoord(location.locations[0].lng)}°
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-ink-soft">{location.count} visits</span>
                    <span className="text-xs font-semibold text-[#7A0000]">
                      {location.uniqueVisitors} visitors
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-ink-soft">
              No location data available
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-serif font-semibold text-ink flex items-center gap-2">
              <Activity size={16} className="text-[#7A0000]" />
              Recent Activity
            </h4>
            <p className="text-xs text-ink-soft">Latest actions on your site</p>
          </div>
        </div>
        {recentActivities.length > 0 ? (
          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink truncate">{activity.message}</p>
                  <p className="text-xs text-ink-soft">
                    {new Date(activity.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-ink-soft">
            No recent activity
          </div>
        )}
      </div>

      {/* Bottom Row - Quick Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* Blog Stats */}
        <div onClick={() => navigate('/admin/blogs')} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-[#7A0000]/20 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
          <h4 className="text-sm font-serif font-semibold text-ink mb-3 flex items-center gap-2">
            <BookOpen size={16} className="text-rose-500" />
            Blog Posts
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-rose-50 rounded-lg">
              <span className="text-xs text-ink-soft">Total</span>
              <span className="text-sm font-bold text-ink">{blogStats.total}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <span className="text-xs text-ink-soft">Published</span>
              <span className="text-sm font-bold text-green-600">{blogStats.published}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
              <span className="text-xs text-ink-soft">Draft</span>
              <span className="text-sm font-bold text-yellow-600">{blogStats.draft}</span>
            </div>
          </div>
        </div>

        {/* Contact Stats */}
        <div onClick={() => navigate('/admin/contact')} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-[#7A0000]/20 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
          <h4 className="text-sm font-serif font-semibold text-ink mb-3 flex items-center gap-2">
            <MessageCircle size={16} className="text-blue-500" />
            Contact Messages
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
              <span className="text-xs text-ink-soft">Total</span>
              <span className="text-sm font-bold text-ink">{contactStats.total}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
              <span className="text-xs text-ink-soft">Pending</span>
              <span className="text-sm font-bold text-yellow-600">{contactStats.pending}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <span className="text-xs text-ink-soft">Replied</span>
              <span className="text-sm font-bold text-green-600">{contactStats.replied}</span>
            </div>
          </div>
        </div>

        {/* Donation Stats */}
        <div onClick={() => navigate('/admin/donations')} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-[#7A0000]/20 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
          <h4 className="text-sm font-serif font-semibold text-ink mb-3 flex items-center gap-2">
            <Gift size={16} className="text-green-500" />
            Donations
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <span className="text-xs text-ink-soft">Total Donors</span>
              <span className="text-sm font-bold text-ink">{totalDonors}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
              <span className="text-xs text-ink-soft">Total Amount</span>
              <span className="text-sm font-bold text-emerald-600">₹{totalDonationAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
              <span className="text-xs text-ink-soft">Records</span>
              <span className="text-sm font-bold text-ink">{donations?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Booking Stats */}
        <div onClick={() => navigate('/admin/bookings')} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-[#7A0000]/20 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
          <h4 className="text-sm font-serif font-semibold text-ink mb-3 flex items-center gap-2">
            <ClipboardList size={16} className="text-indigo-500" />
            Bookings
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg">
              <span className="text-xs text-ink-soft">Total</span>
              <span className="text-sm font-bold text-ink">{bookings?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
              <span className="text-xs text-ink-soft">Pending</span>
              <span className="text-sm font-bold text-yellow-600">{statusCounts.pending}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <span className="text-xs text-ink-soft">Confirmed</span>
              <span className="text-sm font-bold text-green-600">{statusCounts.confirmed}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;