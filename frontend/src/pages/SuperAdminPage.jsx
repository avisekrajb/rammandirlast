import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, ShieldCheck, Users, CalendarDays, Gift, Languages,
  ScrollText, Database, LogOut, Plus, Trash2, ToggleLeft, ToggleRight,
  ArrowLeft, RefreshCw, X, Eye, DatabaseZap, Cloud, Wrench, Download,
  ChevronDown, Image as ImageIcon, Film, HardDrive
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const ALL_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ne', label: 'नेपाली' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'zh', label: '中文' },
  { code: 'ta', label: 'தமிழ்' },
];

const BOOKING_STATUS = ['pending', 'confirmed', 'completed', 'cancelled'];
const DONATION_STATUS = ['pending', 'completed', 'failed', 'refunded'];

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'admins', label: 'Admins', icon: Users },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays },
  { id: 'donations', label: 'Donations', icon: Gift },
  { id: 'media', label: 'Cloudinary Media', icon: Cloud },
  { id: 'languages', label: 'Languages', icon: Languages },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'logs', label: 'Admin Logs', icon: ScrollText },
  { id: 'database', label: 'Database', icon: Database },
];

// Atlas M0 free tier storage limit (real limit, not a made-up number)
const ATLAS_FREE_LIMIT_MB = 512;

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');
const fmtTimeAgo = (d) => {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

function Card({ title, subtitle, value, accent }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <p className="text-xs text-ink-soft">{subtitle || title}</p>
      <p className="text-3xl font-serif font-bold mt-2" style={{ color: accent || '#7A0000' }}>{value}</p>
      <p className="text-sm font-medium text-ink mt-1">{title}</p>
    </div>
  );
}

function SuperAdminPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState('overview');

  const [dashboard, setDashboard] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [donations, setDonations] = useState([]);
  const [enabledLangs, setEnabledLangs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [dbStats, setDbStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');

  // Maintenance mode
  const [maintenance, setMaintenance] = useState(null);
  const [maintenanceForm, setMaintenanceForm] = useState({ title: {}, message: {} });

  // Cloudinary media
  const [cloudResources, setCloudResources] = useState([]);
  const [cloudStats, setCloudStats] = useState(null);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudType, setCloudType] = useState('all');
  const [cloudNextCursor, setCloudNextCursor] = useState(null);

  // Admins form
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });

  // Confirm delete state
  const [confirm, setConfirm] = useState(null);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/superadmin/dashboard');
      setDashboard(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadAdmins = async () => {
    try {
      const res = await api.get('/superadmin/admins');
      setAdmins(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadBookings = async () => {
    try {
      const res = await api.get('/superadmin/bookings');
      setBookings(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadDonations = async () => {
    try {
      const res = await api.get('/superadmin/donations');
      setDonations(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadLanguages = async () => {
    try {
      const res = await api.get('/superadmin/languages');
      setEnabledLangs(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadLogs = async () => {
    try {
      const res = await api.get('/admin/activity?limit=100');
      setLogs(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadDbStats = async () => {
    try {
      const res = await api.get('/superadmin/db/stats');
      setDbStats(res.data.data);
      if (res.data.data.collections && res.data.data.collections.length > 0 && !selectedCollection) {
        setSelectedCollection(res.data.data.collections[0].name);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadRecords = async (collection) => {
    if (!collection) return;
    try {
      const res = await api.get(`/superadmin/db/${collection}/records?limit=50`);
      setRecords(res.data.data);
    } catch (error) {
      console.error(error);
      setRecords([]);
    }
  };

  const loadMaintenance = async () => {
    try {
      const res = await api.get('/superadmin/maintenance');
      const m = res.data.data || { enabled: false };
      setMaintenance(m);
      setMaintenanceForm({
        title: { ...(m.title || {}) },
        message: { ...(m.message || {}) },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const loadCloudResources = async () => {
    setCloudLoading(true);
    try {
      const res = await api.get(`/admin/cloud/resources?type=${cloudType}&maxResults=60`);
      setCloudResources(res.data.resources || []);
      setCloudNextCursor(res.data.nextCursor || null);
    } catch (error) {
      console.error(error);
      showToast('Failed to load Cloudinary resources', 'error');
    } finally {
      setCloudLoading(false);
    }
  };

  const loadCloudMore = async () => {
    if (!cloudNextCursor || cloudLoading) return;
    setCloudLoading(true);
    try {
      const res = await api.get(`/admin/cloud/resources?type=${cloudType}&maxResults=60&nextCursor=${encodeURIComponent(cloudNextCursor)}`);
      setCloudResources((prev) => [...prev, ...(res.data.resources || [])]);
      setCloudNextCursor(res.data.nextCursor || null);
    } catch (error) {
      console.error(error);
      showToast('Failed to load more resources', 'error');
    } finally {
      setCloudLoading(false);
    }
  };

  const loadCloudStats = async () => {
    try {
      const res = await api.get('/admin/cloud/stats');
      setCloudStats(res.data.stats);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (tab === 'overview') {
      loadDashboard();
      loadMaintenance();
    }
    if (tab === 'admins') loadAdmins();
    if (tab === 'bookings') loadBookings();
    if (tab === 'donations') loadDonations();
    if (tab === 'languages') loadLanguages();
    if (tab === 'logs') loadLogs();
    if (tab === 'database') loadDbStats();
    if (tab === 'maintenance') loadMaintenance();
    if (tab === 'media') {
      loadCloudResources();
      loadCloudStats();
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'database' && selectedCollection) loadRecords(selectedCollection);
  }, [selectedCollection, tab]);

  useEffect(() => {
    if (tab === 'media') loadCloudResources();
  }, [cloudType]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleAdminStatus = async (admin) => {
    try {
      await api.put(`/superadmin/admins/${admin._id}/status`, { active: !admin.active });
      showToast(admin.active ? 'Admin disabled' : 'Admin enabled', 'success');
      loadAdmins();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update admin', 'error');
    }
  };

  const deleteAdmin = async (admin) => {
    try {
      await api.delete(`/superadmin/admins/${admin._id}`);
      showToast('Admin deleted', 'success');
      setConfirm(null);
      loadAdmins();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete admin', 'error');
    }
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    try {
      await api.post('/superadmin/admins', adminForm);
      showToast('Admin created successfully', 'success');
      setShowCreateAdmin(false);
      setAdminForm({ name: '', email: '', password: '', phone: '', address: '' });
      loadAdmins();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create admin', 'error');
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      await api.put(`/superadmin/bookings/${id}/status`, { status });
      showToast('Booking updated', 'success');
      loadBookings();
    } catch (error) {
      showToast('Failed to update booking', 'error');
    }
  };

  const updateDonationStatus = async (id, status) => {
    try {
      await api.put(`/superadmin/donations/${id}/status`, { status });
      showToast('Donation updated', 'success');
      loadDonations();
    } catch (error) {
      showToast('Failed to update donation', 'error');
    }
  };

  const toggleLanguage = (code) => {
    setEnabledLangs((prev) => {
      if (prev.includes(code)) {
        return prev.filter((c) => c !== code);
      }
      return [...prev, code];
    });
  };

  const saveLanguages = async () => {
    try {
      if (enabledLangs.length === 0) {
        showToast('At least one language must stay enabled', 'warning');
        return;
      }
      await api.put('/superadmin/languages', { languages: enabledLangs });
      showToast('Languages updated', 'success');
    } catch (error) {
      showToast('Failed to update languages', 'error');
    }
  };

  const clearLogs = async () => {
    if (!window.confirm('Clear ALL admin logs? This cannot be undone.')) return;
    try {
      await api.delete('/admin/activity');
      showToast('All logs cleared', 'success');
      loadLogs();
    } catch (error) {
      showToast('Failed to clear logs', 'error');
    }
  };

  const deleteLog = async (id) => {
    try {
      await api.delete(`/admin/activity/${id}`);
      showToast('Log deleted', 'success');
      loadLogs();
    } catch (error) {
      showToast('Failed to delete log', 'error');
    }
  };

  const deleteRecord = async (collection, id) => {
    if (!window.confirm(`Delete record ${id} from "${collection}"?`)) return;
    try {
      await api.delete(`/superadmin/db/${collection}/${id}`);
      showToast('Record deleted', 'success');
      loadRecords(collection);
      loadDbStats();
    } catch (error) {
      showToast('Failed to delete record', 'error');
    }
  };

  const clearCollection = async (collection) => {
    if (!window.confirm(`WARNING: This will delete ALL records in "${collection}". Continue?`)) return;
    try {
      const res = await api.post(`/superadmin/db/${collection}/clear`);
      showToast(res.data.message || 'Collection cleared', 'success');
      loadDbStats();
      if (selectedCollection === collection) setRecords([]);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to clear collection', 'error');
    }
  };

  const deleteCollection = async (collection) => {
    if (!window.confirm(`⚠️ DANGER: This will DELETE the entire "${collection}" table (all its records and indexes). This cannot be undone!\n\nType the collection name to confirm:`)) return;
    const typed = window.prompt(`Type "${collection}" to confirm permanent deletion of this table:`);
    if (typed !== collection) {
      showToast('Deletion cancelled — name did not match', 'info');
      return;
    }
    try {
      const res = await api.delete(`/superadmin/db/${collection}`);
      showToast(res.data.message || 'Collection deleted', 'success');
      if (selectedCollection === collection) { setSelectedCollection(null); setRecords([]); }
      loadDbStats();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete collection', 'error');
    }
  };

  const saveMaintenance = async () => {
    try {
      const res = await api.put('/superadmin/maintenance', maintenanceForm);
      setMaintenance(res.data.data);
      showToast(res.data.message || 'Maintenance mode updated', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update maintenance mode', 'error');
    }
  };

  const toggleMaintenance = async () => {
    const next = { ...maintenanceForm, enabled: !maintenanceForm.enabled };
    setMaintenanceForm(next);
    setMaintenance((m) => ({ ...m, enabled: next.enabled }));
    try {
      const res = await api.put('/superadmin/maintenance', next);
      if (res.data.data) setMaintenance(res.data.data);
      showToast(next.enabled ? 'Maintenance mode ENABLED' : 'Maintenance mode DISABLED', 'success');
    } catch (error) {
      setMaintenance((m) => ({ ...m, enabled: !next.enabled }));
      setMaintenanceForm((f) => ({ ...f, enabled: !next.enabled }));
      showToast(error.response?.data?.message || 'Failed to update maintenance mode', 'error');
    }
  };

  const renderOverview = () => (
    <div>
      {maintenance?.enabled && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <Wrench size={18} className="text-red-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700">Maintenance mode is currently ENABLED</p>
            <p className="text-xs text-red-600">Visitors are seeing the "Under Development" modal.</p>
          </div>
          <button onClick={() => setTab('maintenance')} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-all flex-shrink-0">
            Manage
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card title="Admins" subtitle="Admin accounts" value={dashboard?.admins ?? '—'} />
        <Card title="Users" subtitle="Registered users" value={dashboard?.users ?? '—'} accent="#1F4E3D" />
        <Card title="Bookings" subtitle="Total" value={dashboard?.bookings ?? '—'} accent="#C1440E" />
        <Card title="Donations" subtitle="Total" value={dashboard?.donations ?? '—'} accent="#E8A93D" />
        <Card title="Events" subtitle="Total" value={dashboard?.events ?? '—'} accent="#5B1420" />
        <Card title="Logs" subtitle="Admin activity" value={dashboard?.logs ?? '—'} accent="#2563eb" />
      </div>
      <p className="text-xs text-ink-soft mt-4">
        Welcome, {user?.name || 'Super Admin'}. Use the tabs above to manage administrators, bookings, donations, languages, logs and the database.
      </p>
    </div>
  );

  const renderAdmins = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-serif font-semibold text-ink">Administrator Accounts</h3>
        <button
          onClick={() => setShowCreateAdmin(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-maroon to-maroon-deep text-white text-sm font-semibold shadow-md hover:-translate-y-0.5 transition-all"
        >
          <Plus size={16} /> Create Admin
        </button>
      </div>

      {showCreateAdmin && (
        <form onSubmit={createAdmin} className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-5 grid md:grid-cols-2 gap-4">
          <input required value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
            placeholder="Name" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          <input required type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
            placeholder="Email" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          <input required type="text" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
            placeholder="Password" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          <input value={adminForm.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
            placeholder="Phone" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          <input value={adminForm.address} onChange={(e) => setAdminForm({ ...adminForm, address: e.target.value })}
            placeholder="Address" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          <div className="flex items-center gap-2 md:col-span-2">
            <button type="submit" className="px-5 py-2 rounded-full bg-[#7A0000] text-white text-sm font-semibold">Create</button>
            <button type="button" onClick={() => setShowCreateAdmin(false)} className="px-5 py-2 rounded-full border border-gray-300 text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-ink-soft">
            <tr>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {admins.map((a) => (
              <tr key={a._id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{a.name}</div>
                  <div className="text-xs text-ink-soft">{a.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.role === 'superadmin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                    {a.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.active === false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {a.active === false ? 'Disabled' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-ink-soft">{fmtDate(a.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {a.role !== 'superadmin' && (
                      <>
                        <button
                          onClick={() => toggleAdminStatus(a)}
                          title={a.active === false ? 'Enable' : 'Disable'}
                          className="p-2 rounded-lg border border-gray-200 hover:border-gray-400 transition-all"
                        >
                          {a.active === false ? <ToggleRight size={16} className="text-green-600" /> : <ToggleLeft size={16} className="text-ink-soft" />}
                        </button>
                        {confirm === a._id ? (
                          <button onClick={() => deleteAdmin(a)} className="p-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100">Confirm?</button>
                        ) : (
                          <button onClick={() => { setConfirm(a._id); setTimeout(() => setConfirm(null), 3000); }} title="Delete"
                            className="p-2 rounded-lg border border-gray-200 hover:border-red-300 text-red-500 transition-all">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-soft">No admins found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBookings = () => (
    <div>
      <h3 className="text-lg font-serif font-semibold text-ink mb-4">All Bookings</h3>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-gray-50 text-left text-xs uppercase text-ink-soft">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Type / Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((b) => (
              <tr key={b._id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{b.name}</div>
                  <div className="text-xs text-ink-soft">{b.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs text-ink-soft">{b.phone}</div>
                  <div className="text-xs text-ink-soft">{fmtDate(b.createdAt)}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-ink">{b.type}</div>
                  <div className="text-xs text-ink-soft">{b.date}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-ink">{b.status}</span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={b.status}
                    onChange={(e) => updateBookingStatus(b._id, e.target.value)}
                    className="px-2 py-1 rounded-lg border border-gray-300 text-xs"
                  >
                    {BOOKING_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-soft">No bookings found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDonations = () => {
    const completed = donations.filter((d) => d.status === 'completed');
    const totalAmount = completed.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const totalAll = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const uniqueDonors = new Set(donations.map((d) => (d.email || '').toLowerCase()).filter(Boolean)).size;

    return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card title="Total Donations" subtitle="All records" value={donations.length} accent="#E8A93D" />
        <Card title="Completed Donors" subtitle="Successful records" value={completed.length} accent="#1F4E3D" />
        <Card title="Unique Donors" subtitle="Distinct emails" value={uniqueDonors} accent="#7A0000" />
        <Card title="Total Amount" subtitle="All records (Rs.)" value={totalAll.toLocaleString()} accent="#C1440E" />
      </div>

      <h3 className="text-lg font-serif font-semibold text-ink mb-4">All Donations</h3>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-gray-50 text-left text-xs uppercase text-ink-soft">
            <tr>
              <th className="px-4 py-3">Donor</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {donations.map((d) => (
              <tr key={d._id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{d.name}</div>
                  <div className="text-xs text-ink-soft">{d.email}</div>
                  {d.phone && <div className="text-xs text-ink-soft">{d.phone}</div>}
                </td>
                <td className="px-4 py-3 font-semibold text-[#7A0000]">Rs. {d.amount}</td>
                <td className="px-4 py-3 text-xs text-ink-soft">{d.paymentMethod}</td>
                <td className="px-4 py-3 text-xs text-ink-soft">{d.reference || d.transactionId || d.paymentId || '—'}</td>
                <td className="px-4 py-3 text-xs text-ink-soft">{fmtDate(d.date || d.createdAt)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    d.status === 'completed' ? 'bg-green-100 text-green-700' :
                    d.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    d.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-ink'
                  }`}>{d.status}</span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={d.status}
                    onChange={(e) => updateDonationStatus(d._id, e.target.value)}
                    className="px-2 py-1 rounded-lg border border-gray-300 text-xs"
                  >
                    {DONATION_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {donations.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-soft">No donations found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
  };

  const renderLanguages = () => (
    <div>
      <h3 className="text-lg font-serif font-semibold text-ink mb-1">Site Languages</h3>
      <p className="text-sm text-ink-soft mb-5">Toggle which languages visitors can select. English cannot be disabled.</p>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="space-y-3">
          {ALL_LANGUAGES.map((l) => {
            const isEnabled = enabledLangs.includes(l.code);
            const locked = l.code === 'en';
            return (
              <div key={l.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-ink">{l.label}</div>
                  <div className="text-xs text-ink-soft uppercase">{l.code}</div>
                </div>
                <button
                  onClick={() => !locked && toggleLanguage(l.code)}
                  disabled={locked}
                  className={`inline-flex items-center gap-2 text-sm font-semibold ${locked ? 'text-gray-400' : isEnabled ? 'text-green-600' : 'text-red-500'}`}
                >
                  {locked ? 'Always on' : (isEnabled ? 'Enabled' : 'Disabled')}
                  {locked ? <ShieldCheck size={16} /> : (isEnabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />)}
                </button>
              </div>
            );
          })}
        </div>
        <button onClick={saveLanguages} className="mt-5 px-6 py-2.5 rounded-full bg-gradient-to-r from-maroon to-maroon-deep text-white text-sm font-semibold shadow-md hover:-translate-y-0.5 transition-all">
          Save Languages
        </button>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-serif font-semibold text-ink">Admin Activity Logs</h3>
        <div className="flex items-center gap-2">
          <button onClick={loadLogs} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={clearLogs} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100">
            <Trash2 size={14} /> Clear All
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
        {logs.map((log) => (
          <div key={log._id} className="p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="font-medium text-ink text-sm">{log.action}</div>
              <div className="text-xs text-ink-soft mt-0.5">
                {log.user?.name || 'Admin'} ({log.user?.email || ''}) • {fmtTimeAgo(log.timestamp)}
              </div>
              {log.details && Object.keys(log.details).length > 0 && (
                <pre className="mt-1 text-[11px] text-ink-soft bg-gray-50 rounded p-2 overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
            <button onClick={() => deleteLog(log._id)} title="Delete" className="p-2 rounded-lg border border-gray-200 text-red-500 hover:border-red-300 hover:bg-red-50 transition-all shrink-0">
              <X size={14} />
            </button>
          </div>
        ))}
        {logs.length === 0 && <div className="p-8 text-center text-ink-soft">No admin logs</div>}
      </div>
    </div>
  );

  const renderDatabase = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-serif font-semibold text-ink">Database Storage (MongoDB Atlas)</h3>
        <button onClick={loadDbStats} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {dbStats && (
        <>
          {/* Atlas free-tier quota gauge */}
          <div className="bg-gradient-to-r from-maroon to-maroon-deep rounded-2xl p-5 text-white mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <HardDrive size={22} className="text-white/80" />
                <div>
                  <p className="font-serif font-semibold">MongoDB Atlas Storage — M0 Free Tier</p>
                  <p className="text-xs text-white/70">Cluster: {dbStats.database}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{dbStats.storageSizeMB} MB <span className="text-sm font-normal text-white/70">/ {ATLAS_FREE_LIMIT_MB} MB</span></p>
                <p className="text-xs text-white/70">Free tier limit: 512 MB</p>
              </div>
            </div>
            <div className="mt-4 h-4 rounded-full bg-white/20 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  dbStats.storageSizeMB > 460 ? 'bg-red-400' : dbStats.storageSizeMB > 384 ? 'bg-yellow-400' : 'bg-green-400'
                }`}
                style={{ width: `${Math.min(100, (dbStats.storageSizeMB / ATLAS_FREE_LIMIT_MB) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/70 mt-1.5">
              <span>Used: {Math.min(100, ((dbStats.storageSizeMB / ATLAS_FREE_LIMIT_MB) * 100).toFixed(1))}% of quota</span>
              <span>Free: {Math.max(0, (ATLAS_FREE_LIMIT_MB - dbStats.storageSizeMB).toFixed(2))} MB</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <Card title="Data Size" subtitle={dbStats.database} value={`${dbStats.dataSizeMB} MB`} />
            <Card title="Storage Size" subtitle="On disk" value={`${dbStats.storageSizeMB} MB`} accent="#C1440E" />
            <Card title="Index Size" subtitle="Indexes" value={`${dbStats.indexSizeMB} MB`} accent="#1F4E3D" />
          </div>

          <h4 className="text-sm font-serif font-semibold text-ink mb-2">Collections by size (what uses the most space)</h4>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-50 text-left text-xs uppercase text-ink-soft">
                <tr>
                  <th className="px-4 py-3">Collection</th>
                  <th className="px-4 py-3">Documents</th>
                  <th className="px-4 py-3">Size (MB)</th>
                  <th className="px-4 py-3">Storage (MB)</th>
                  <th className="px-4 py-3">Index (MB)</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dbStats.collections.map((c) => (
                  <tr key={c.name}>
                    <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                    <td className="px-4 py-3">{c.count}</td>
                    <td className="px-4 py-3 font-semibold">{c.sizeMB}</td>
                    <td className="px-4 py-3">{c.storageMB}</td>
                    <td className="px-4 py-3">{c.indexMB}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setSelectedCollection(c.name); }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#7A0000] hover:underline"
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          onClick={() => deleteCollection(c.name)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedCollection && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-serif font-semibold text-ink">Records in "{selectedCollection}" <span className="text-xs text-ink-soft font-normal">(latest 50)</span></h4>
                <button onClick={() => clearCollection(selectedCollection)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100">
                  <DatabaseZap size={13} /> Clear this collection
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                {records.map((r) => (
                  <div key={r._id?.toString()} className="p-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-mono text-ink break-all">{r._id?.toString()}</div>
                      <pre className="mt-1 text-[10px] text-ink-soft bg-gray-50 rounded p-2 overflow-x-auto max-w-[80vw]">
                        {JSON.stringify(r, null, 2).slice(0, 600)}
                      </pre>
                    </div>
                    <button onClick={() => deleteRecord(selectedCollection, r._id?.toString())} title="Delete record"
                      className="p-2 rounded-lg border border-gray-200 text-red-500 hover:border-red-300 hover:bg-red-50 transition-all shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {records.length === 0 && <div className="p-8 text-center text-ink-soft">No records</div>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderMaintenance = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-serif font-semibold text-ink">Maintenance Mode</h3>
        {maintenance && (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${maintenance.enabled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {maintenance.enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            {maintenance.enabled ? 'Enabled' : 'Disabled'}
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`p-3 rounded-xl flex-shrink-0 ${maintenanceForm.enabled ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
              {maintenanceForm.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-ink">
                {maintenanceForm.enabled ? 'Maintenance mode is ON' : 'Maintenance mode is OFF'}
              </p>
              <p className="text-xs text-ink-soft mt-0.5">
                {maintenanceForm.enabled
                  ? 'Visitors are currently seeing the "Under Development" modal.'
                  : 'The site is fully open to visitors. Toggle ON to block public visitors.'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleMaintenance}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-md hover:-translate-y-0.5 transition-all ${
              maintenanceForm.enabled ? 'bg-red-600 hover:bg-red-700' : 'bg-gradient-to-r from-maroon to-maroon-deep'
            }`}
          >
            {maintenanceForm.enabled ? <><ToggleRight size={16} /> Turn Off</> : <><ToggleLeft size={16} /> Turn On</>}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h4 className="text-sm font-serif font-semibold text-ink mb-4">Modal content (all 5 languages)</h4>
        <div className="grid md:grid-cols-2 gap-4">
          {ALL_LANGUAGES.map((l) => (
            <div key={l.code} className="space-y-2">
              <label className="text-xs font-semibold text-ink-soft uppercase">{l.label} ({l.code})</label>
              <input
                value={maintenanceForm.title?.[l.code] || ''}
                onChange={(e) => setMaintenanceForm((f) => ({
                  ...f,
                  title: { ...(f.title || {}), [l.code]: e.target.value },
                }))}
                placeholder="Title"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-[#7A0000] focus:outline-none"
              />
              <textarea
                value={maintenanceForm.message?.[l.code] || ''}
                onChange={(e) => setMaintenanceForm((f) => ({
                  ...f,
                  message: { ...(f.message || {}), [l.code]: e.target.value },
                }))}
                placeholder="Message"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-[#7A0000] focus:outline-none"
              />
            </div>
          ))}
        </div>
        <button
          onClick={saveMaintenance}
          className="mt-5 px-6 py-2.5 rounded-full bg-gradient-to-r from-maroon to-maroon-deep text-white text-sm font-semibold shadow-md hover:-translate-y-0.5 transition-all"
        >
          Save Maintenance Settings
        </button>
      </div>
    </div>
  );

  const renderMedia = () => (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-serif font-semibold text-ink">Cloudinary Media Library</h3>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {[
              { id: 'all', label: 'All' },
              { id: 'image', label: 'Photos' },
              { id: 'video', label: 'Videos' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setCloudType(f.id)}
                className={`px-3 py-2 text-xs font-semibold transition-all ${cloudType === f.id ? 'bg-[#7A0000] text-white' : 'bg-white text-ink-soft hover:bg-gray-50'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={() => { loadCloudResources(); loadCloudStats(); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
            <RefreshCw size={14} className={cloudLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {cloudStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card title="Total Assets" subtitle="Images + videos" value={cloudStats.totalResources ?? '—'} accent="#7A0000" />
          <Card title="Images" subtitle="Cloudinary photos" value={cloudStats.totalImages ?? '—'} accent="#1F4E3D" />
          <Card title="Videos" subtitle="Cloudinary videos" value={cloudStats.totalVideos ?? '—'} accent="#C1440E" />
          <Card title="Storage Used" subtitle="Cloudinary" value={cloudStats.totalSizeGB != null ? `${cloudStats.totalSizeGB} GB` : '—'} accent="#E8A93D" />
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-ink-soft">
          Showing <span className="font-semibold text-ink">{cloudResources.length}</span> assets
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cloudResources.map((r) => (
          <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
            <div className="relative aspect-video bg-gray-100 overflow-hidden">
              {r.type === 'video' ? (
                <video src={r.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" muted playsInline />
              ) : (
                <img src={r.url} alt={r.id} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              )}
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white flex items-center gap-1">
                {r.type === 'video' ? <Film size={10} /> : <ImageIcon size={10} />}
                {r.type === 'video' ? 'Video' : `${r.width}×${r.height}`}
              </span>
            </div>
            <div className="p-3">
              <p className="text-[11px] font-mono text-ink-soft truncate" title={r.id}>{r.filename || r.id}</p>
              <p className="text-[10px] text-ink-soft mt-0.5">
                {r.format?.toUpperCase()} • {r.size != null ? `${(r.size / 1024 / 1024).toFixed(2)} MB` : ''}
              </p>
              <p className="text-[10px] text-ink-soft">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</p>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#7A0000] hover:underline"
              >
                <Download size={12} /> View / Download
              </a>
            </div>
          </div>
        ))}
      </div>

      {cloudResources.length === 0 && !cloudLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center text-ink-soft">
          No assets found in Cloudinary
        </div>
      )}

      {cloudNextCursor && (
        <div className="text-center mt-6">
          <button onClick={loadCloudMore} disabled={cloudLoading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50">
            {cloudLoading ? <RefreshCw size={14} className="animate-spin" /> : <ChevronDown size={14} />}
            {cloudLoading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-panel">
      {/* Topbar */}
      <div className="bg-gradient-to-r from-maroon to-maroon-deep text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm">
            <ArrowLeft size={16} /> Back to site
          </Link>
          <div className="h-6 w-px bg-white/30" />
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} />
            <h1 className="font-serif text-lg sm:text-xl font-bold">Super Admin</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/80">{user?.email}</span>
          <button onClick={handleLogout} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/15 hover:bg-white/25 text-sm font-semibold transition-all">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-100 p-3 hidden md:block flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-[#7A0000]/10 text-[#7A0000]' : 'text-ink-soft hover:bg-gray-50'}`}
                >
                  <Icon size={17} /> {t.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden overflow-x-auto bg-white border-b border-gray-100 p-2">
          <div className="flex gap-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold ${active ? 'bg-[#7A0000] text-white' : 'bg-gray-100 text-ink-soft'}`}>
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <main className="p-6 flex-1 min-w-0">
          {tab === 'overview' && renderOverview()}
          {tab === 'admins' && renderAdmins()}
          {tab === 'bookings' && renderBookings()}
          {tab === 'donations' && renderDonations()}
          {tab === 'media' && renderMedia()}
          {tab === 'languages' && renderLanguages()}
          {tab === 'maintenance' && renderMaintenance()}
          {tab === 'logs' && renderLogs()}
          {tab === 'database' && renderDatabase()}
        </main>
      </div>
    </div>
  );
}

export default SuperAdminPage;
