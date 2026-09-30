import React, { useState, useEffect } from 'react';
import { 
  Save, Trash2, QrCode, CreditCard, Wallet, Smartphone, 
  Banknote, Mail, Settings, Gift, FileText, Download,
  Eye, Check, X, Clock, User, Calendar, Search,
  Filter, RefreshCw, ChevronDown, ChevronUp, ChevronRight,
  Plus, Hand
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import DonationReceipt from '../common/DonationReceipt';

const EMPTY_LOC = { en: '', ne: '', hi: '', zh: '', ta: '' };
const emptyLoc = () => ({ en: '', ne: '', hi: '', zh: '', ta: '' });

const locValue = (obj, lang) => (obj ? (obj[lang] || obj.en || obj.ne || '') : '');

// paragraphs is a free-length list; older records stored a fixed { p1..p4 } object
const normalizeSection = (raw) => {
  const section = { ...(raw || {}) };
  const p = raw?.paragraphs;
  if (Array.isArray(p)) {
    section.paragraphs = p.map((x) => ({ ...(x || {}) }));
  } else if (p && typeof p === 'object') {
    section.paragraphs = Object.keys(p)
      .filter((k) => /^p\d+$/i.test(k))
      .sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10))
      .map((k) => ({ ...(p[k] || {}) }));
  } else {
    section.paragraphs = [];
  }
  section.points = Array.isArray(section.points) ? section.points : [];
  return section;
};

const AdminDonations = ({ donations, setDonations, settings, updateSettings, t, lang }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [qrPhoto, setQrPhoto] = useState(null);
  const [baseCount, setBaseCount] = useState(1248);
  const [bankNumber, setBankNumber] = useState('986XXXXXXX');
  const [bankName, setBankName] = useState('Nepal Investment Bank');
  const [accountHolder, setAccountHolder] = useState('Temple Trust Fund');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  // "दान तथा सहयोग" page content
  const [donateContent, setDonateContent] = useState([]);
  const [donatePageTitle, setDonatePageTitle] = useState(EMPTY_LOC);
  const [donateIntro, setDonateIntro] = useState(EMPTY_LOC);
  const [contentLang, setContentLang] = useState('ne');
  const [savingContent, setSavingContent] = useState(false);
  const [openRows, setOpenRows] = useState(() => new Set());

  useEffect(() => {
    if (Array.isArray(settings?.donateContent)) {
      setDonateContent(settings.donateContent.map(normalizeSection));
    }
    if (settings?.donatePageTitle) setDonatePageTitle(settings.donatePageTitle);
    if (settings?.donateIntro) setDonateIntro(settings.donateIntro);
  }, [settings]);

  // Initialize from settings when available
  useEffect(() => {
    if (settings) {
      setQrPhoto(settings?.donate?.qrPhoto || null);
      setBaseCount(settings?.donate?.baseCount || 1248);
      setBankNumber(settings?.donate?.bankNumber || '986XXXXXXX');
      setBankName(settings?.donate?.bankName || 'Nepal Investment Bank');
      setAccountHolder(settings?.donate?.accountHolder || 'Temple Trust Fund');
    }
  }, [settings]);

  const statusColors = {
    pending: '#F59E0B',
    completed: '#10B981',
    failed: '#EF4444',
    refunded: '#6B7280',
  };

  const statusBadgeClasses = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    refunded: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  // ===== Donate page content helpers =====
  const patchSection = (index, fn) =>
    setDonateContent((prev) => prev.map((s, i) => (i === index ? fn(s) : s)));

  const setSectionField = (index, field, value) =>
    patchSection(index, (s) => ({ ...s, [field]: { ...(s[field] || {}), [contentLang]: value } }));

  const setSectionParagraph = (index, pIndex, value) => {
    patchSection(index, (s) => {
      const paragraphs = normalizeSection(s).paragraphs;
      while (paragraphs.length <= pIndex) paragraphs.push(emptyLoc());
      paragraphs[pIndex] = { ...(paragraphs[pIndex] || {}), [contentLang]: value };
      return { ...s, paragraphs };
    });
  };

  const addParagraph = (index) =>
    patchSection(index, (s) => ({
      ...s,
      paragraphs: [...normalizeSection(s).paragraphs, emptyLoc()]
    }));

  const removeParagraph = (index, pIndex) =>
    patchSection(index, (s) => ({
      ...s,
      paragraphs: normalizeSection(s).paragraphs.filter((_, i) => i !== pIndex)
    }));

  const moveParagraph = (index, pIndex, dir) =>
    patchSection(index, (s) => {
      const paragraphs = normalizeSection(s).paragraphs;
      const target = pIndex + dir;
      if (target < 0 || target >= paragraphs.length) return s;
      [paragraphs[pIndex], paragraphs[target]] = [paragraphs[target], paragraphs[pIndex]];
      return { ...s, paragraphs };
    });

  const addPoint = (index) =>
    patchSection(index, (s) => ({ ...s, points: [...(s.points || []), emptyLoc()] }));

  const setPoint = (index, pIndex, value) =>
    patchSection(index, (s) => ({
      ...s,
      points: (s.points || []).map((p, i) => (i === pIndex ? { ...(p || {}), [contentLang]: value } : p))
    }));

  const removePoint = (index, pIndex) =>
    patchSection(index, (s) => ({
      ...s,
      points: (s.points || []).filter((_, i) => i !== pIndex)
    }));

  const movePoint = (index, pIndex, dir) =>
    patchSection(index, (s) => {
      const points = [...(s.points || [])];
      const target = pIndex + dir;
      if (target < 0 || target >= points.length) return s;
      [points[pIndex], points[target]] = [points[target], points[pIndex]];
      return { ...s, points };
    });

  const addSection = () =>
    setDonateContent((prev) => [
      ...prev,
      {
        key: `donate_${Date.now()}`,
        title: emptyLoc(),
        desc: emptyLoc(),
        paragraphs: [],
        listTitle: emptyLoc(),
        points: [],
        order: prev.length,
        enabled: true
      }
    ]);

  const removeSection = (index) => {
    if (!window.confirm('Remove this section?')) return;
    setDonateContent((prev) => prev.filter((_, i) => i !== index));
  };

  const moveSection = (index, dir) =>
    setDonateContent((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((s, i) => ({ ...s, order: i }));
    });

  const toggleSectionEnabled = (index) =>
    patchSection(index, (s) => ({ ...s, enabled: s.enabled === false }));

  const toggleRow = (index) =>
    setOpenRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const saveContent = async () => {
    setSavingContent(true);
    try {
      const payload = {
        donatePageTitle,
        donateIntro,
        donateContent: donateContent.map((s, i) => ({
          ...normalizeSection(s),
          order: i
        }))
      };
      await api.put('/admin/settings', payload);
      if (updateSettings) updateSettings((prev) => ({ ...prev, ...payload }));
      showToast('Donate page content saved', 'success');
    } catch (error) {
      console.error('Error saving donate content:', error);
      showToast(error.response?.data?.message || 'Failed to save donate page content', 'error');
    } finally {
      setSavingContent(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this donation record?')) return;
    setLoading(true);
    try {
      await api.delete(`/admin/donations/${id}`);
      setDonations(donations.filter(d => d._id !== id));
      showToast(t.donationRemoved || 'Donation deleted successfully', 'success');
    } catch (error) {
      console.error('Delete donation error:', error);
      showToast(error.response?.data?.message || 'Failed to delete donation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    setLoading(true);
    try {
      const response = await api.put(`/admin/donations/${id}/status`, { status });
      setDonations(donations.map(d => d._id === id ? response.data.data : d));
      
      const statusMessages = {
        pending: 'Donation marked as pending',
        completed: 'Donation approved! Receipt sent to donor via email',
        failed: 'Donation marked as failed',
        refunded: 'Donation refunded'
      };
      showToast(statusMessages[status] || `Donation status updated to ${status}`, 'success');
    } catch (error) {
      console.error('Update status error:', error);
      showToast(error.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (donation) => {
    if (!window.confirm(`Send confirmation email to ${donation.email}?`)) return;
    setSendingEmail(true);
    try {
      await api.post('/donations/send-email', {
        donationId: donation._id
      });
      showToast(`Email sent to ${donation.email}`, 'success');
    } catch (error) {
      console.error('Email error:', error);
      showToast('Failed to send email', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleViewReceipt = (donation) => {
    if (donation.status !== 'completed') {
      showToast('Receipt only available for completed donations', 'warning');
      return;
    }
    setSelectedDonation(donation);
    setShowReceipt(true);
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be less than 5MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/admin/upload/qr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const newQrUrl = response.data.url;
      setQrPhoto(newQrUrl);
      
      await updateSettings({ 
        donate: { 
          ...settings?.donate, 
          qrPhoto: newQrUrl,
          baseCount,
          bankNumber,
          bankName,
          accountHolder
        } 
      });
      
      showToast('QR code uploaded successfully', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      showToast(error.response?.data?.message || 'Upload failed', 'error');
    }
    e.target.value = '';
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings({ 
        donate: { 
          qrPhoto, 
          baseCount, 
          bankNumber,
          bankName,
          accountHolder 
        } 
      });
      showToast(t.savedSuccess || 'Donation settings saved', 'success');
    } catch (error) {
      console.error('Save donation settings error:', error);
      showToast(error.response?.data?.message || 'Failed to save settings', 'error');
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch(method) {
      case 'esewa': return <Smartphone size={14} className="text-green-600" />;
      case 'khalti': return <Wallet size={14} className="text-purple-600" />;
      case 'ips': return <CreditCard size={14} className="text-blue-600" />;
      case 'bank': return <Banknote size={14} className="text-emerald-600" />;
      default: return <Wallet size={14} className="text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    return statusBadgeClasses[status] || statusBadgeClasses.pending;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <Check size={12} className="text-green-500" />;
      case 'failed': return <X size={12} className="text-red-500" />;
      case 'refunded': return <Clock size={12} className="text-gray-500" />;
      default: return <Clock size={12} className="text-yellow-500" />;
    }
  };

  const realDonors = donations?.filter(d => d.status === 'completed') || [];

  const filteredDonations = donations?.filter(donation => {
    const matchesSearch = donation.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          donation.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          donation.phone?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || donation.status === filterStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  const sortedDonations = [...filteredDonations].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Helper to get full Cloudinary URL if needed
  const getFullImageUrl = (url) => {
    if (!url) return null;
    // If it's already a full URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If it's a relative path, prepend Cloudinary base URL
    if (url.startsWith('/')) {
      // For Cloudinary URLs from your config
      const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dibusz4ag';
      return `https://res.cloudinary.com/${cloudName}/image/upload/${url}`;
    }
    return url;
  };

  const displayQrPhoto = getFullImageUrl(qrPhoto);

  return (
    <div className="space-y-6">
      {/* Donation Settings */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#7A0000]/10 to-[#A00000]/5 px-6 py-4 border-b border-gray-100">
          <h4 className="text-gray-700 font-semibold flex items-center gap-2">
            <Settings size={18} className="text-[#7A0000]" />
            Donation Settings
          </h4>
          <p className="text-xs text-gray-400">QR Code & Bank Details</p>
        </div>

        <div className="p-6">
          <div className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden h-32 flex items-center justify-center cursor-pointer bg-gray-50 hover:border-[#7A0000] transition-colors mb-4">
            <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" id="qr-upload" />
            <label htmlFor="qr-upload" className="absolute inset-0 flex items-center justify-center cursor-pointer">
              {displayQrPhoto ? (
                <img 
                  src={displayQrPhoto} 
                  alt="QR Code" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('QR image failed to load:', displayQrPhoto);
                    e.target.style.display = 'none';
                    // Show fallback
                    const parent = e.target.parentElement;
                    const fallback = document.createElement('div');
                    fallback.className = 'flex flex-col items-center gap-1.5 text-gray-400';
                    fallback.innerHTML = `
                      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h-2m2 0h2M4 12v1m4 0h4m-4 0v4m0-4h-2" />
                      </svg>
                      <span class="text-xs font-semibold">Click to upload QR Code</span>
                    `;
                    parent.appendChild(fallback);
                  }}
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-gray-400">
                  <QrCode size={32} />
                  <span className="text-xs font-semibold">{t.uploadPhoto || 'Upload QR Code'}</span>
                </div>
              )}
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">{t.startingCount || 'Starting Count'}</label>
              <input
                type="number"
                value={baseCount}
                onChange={(e) => setBaseCount(Number(e.target.value) || 0)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#7A0000] focus:outline-none transition-colors text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Bank Account Number</label>
              <input
                type="text"
                value={bankNumber}
                onChange={(e) => setBankNumber(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#7A0000] focus:outline-none transition-colors text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#7A0000] focus:outline-none transition-colors text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Account Holder</label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#7A0000] focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7A0000] text-white font-semibold text-sm hover:bg-[#5A0000] transition-all shadow-lg shadow-[#7A0000]/20"
          >
            <Save size={16} /> {t.save || 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Donation Records - Same as before */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7A0000]/10 to-[#A00000]/5 px-6 py-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="text-gray-700 font-semibold flex items-center gap-2">
                <Gift size={18} className="text-[#7A0000]" />
                Donation Records
              </h4>
              <p className="text-xs text-gray-400">
                Total: {donations?.length || 0} • Completed: {realDonors.length} • Pending: {donations?.filter(d => d.status === 'pending').length || 0}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search donations..."
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:border-[#7A0000] focus:outline-none text-sm w-40 sm:w-48"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:border-[#7A0000] focus:outline-none text-sm bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <button
                onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                title="Reset Filters"
              >
                <RefreshCw size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          {sortedDonations.length === 0 ? (
            <p className="text-center text-gray-500 py-8">{t.noDonationsYet || 'No donations yet'}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide">#</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Devotee</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Email</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Method</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Amount</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDonations.map((donation, index) => (
                    <React.Fragment key={donation._id}>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 text-xs text-gray-400">{index + 1}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-[#7A0000] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {donation.name?.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <p className="font-medium text-gray-800">{donation.name}</p>
                              {donation.message && (
                                <p className="text-xs text-gray-400 italic truncate max-w-[120px]">"{donation.message}"</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 hidden sm:table-cell text-gray-600 text-xs">{donation.email}</td>
                        <td className="py-3 hidden md:table-cell">
                          <span className="flex items-center gap-1 text-xs">
                            {getPaymentMethodIcon(donation.paymentMethod)}
                            <span className="capitalize">{donation.paymentMethod || 'cash'}</span>
                          </span>
                        </td>
                        <td className="py-3 font-bold text-[#7A0000]">
                          Rs. {donation.amount?.toLocaleString() || 0}
                        </td>
                        <td className="py-3 hidden lg:table-cell text-gray-500 text-xs">
                          {formatDate(donation.date)}
                        </td>
                        <td className="py-3">
                          <select
                            value={donation.status}
                            onChange={(e) => handleStatusChange(donation._id, e.target.value)}
                            disabled={loading}
                            className={`text-xs font-semibold px-3 py-1 rounded-full border-2 focus:outline-none disabled:opacity-50 cursor-pointer ${getStatusBadge(donation.status)}`}
                            style={{ borderColor: statusColors[donation.status] }}
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {donation.status === 'completed' && (
                              <>
                                <button 
                                  onClick={() => handleViewReceipt(donation)}
                                  className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                                  title="View Receipt"
                                >
                                  <FileText size={16} />
                                </button>
                                <button 
                                  onClick={() => handleSendEmail(donation)} 
                                  disabled={sendingEmail}
                                  className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50"
                                  title="Send Email"
                                >
                                  <Mail size={16} />
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => toggleExpand(donation._id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#7A0000] transition-all"
                              title="View Details"
                            >
                              {expandedId === donation._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <button 
                              onClick={() => handleDelete(donation._id)} 
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === donation._id && (
                        <tr>
                          <td colSpan="8" className="px-4 py-4 bg-gray-50/50 border-b border-gray-100">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-gray-400">Donor Information</p>
                                <p className="font-medium text-gray-800">{donation.name}</p>
                                <p className="text-gray-600 text-xs">{donation.email}</p>
                                {donation.phone && <p className="text-gray-600 text-xs">{donation.phone}</p>}
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Donation Details</p>
                                <p className="font-medium text-[#7A0000]">Rs. {donation.amount?.toLocaleString() || 0}</p>
                                <p className="text-gray-600 text-xs capitalize">Method: {donation.paymentMethod || 'cash'}</p>
                                <p className="text-gray-600 text-xs">Date: {formatDate(donation.date)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Additional Info</p>
                                <p className="text-gray-600 text-xs">Status: <span className={`font-semibold ${getStatusBadge(donation.status)}`}>{donation.status}</span></p>
                                {donation.transactionId && (
                                  <p className="text-gray-600 text-xs">Transaction ID: {donation.transactionId}</p>
                                )}
                                {donation.message && (
                                  <p className="text-gray-600 text-xs italic">"{donation.message}"</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Donation Receipt Modal */}
      {showReceipt && selectedDonation && (
        <DonationReceipt
          donation={selectedDonation}
          onClose={() => {
            setShowReceipt(false);
            setSelectedDonation(null);
          }}
          settings={settings}
        />
      )}

      {/* Donate Page Content — table form */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 bg-gradient-to-r from-[#7A0000]/10 to-[#A00000]/5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-gray-700 font-semibold flex items-center gap-2">
              <Hand size={18} className="text-[#7A0000]" />
              Donate Page Content
            </h4>
            <p className="text-xs text-gray-400">
              Shown at the bottom of the donate page, under the donation form.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={addSection}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#7A0000] text-white text-xs font-semibold hover:bg-[#5A0000] transition-all"
            >
              <Plus size={14} /> Add Section
            </button>
            <button
              onClick={saveContent}
              disabled={savingContent}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#7A0000] text-white text-xs font-semibold hover:bg-[#5A0000] transition-all disabled:opacity-50"
            >
              {savingContent ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} /> Save Content
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-ink-soft mb-1">Page Title</label>
              <input
                type="text"
                value={locValue(donatePageTitle, contentLang)}
                onChange={(e) => setDonatePageTitle({ ...donatePageTitle, [contentLang]: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#7A0000] focus:outline-none text-sm"
                placeholder="e.g. दान तथा सहयोग"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-ink-soft mb-1">Page Intro</label>
              <input
                type="text"
                value={locValue(donateIntro, contentLang)}
                onChange={(e) => setDonateIntro({ ...donateIntro, [contentLang]: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-[#7A0000] focus:outline-none text-sm"
                placeholder="Short lead-in shown under the page title"
              />
            </div>
          </div>

          <div className="flex gap-1.5 mt-4 mb-4 flex-wrap">
            {['ne', 'en', 'hi', 'zh', 'ta'].map((l) => (
              <button
                key={l}
                onClick={() => setContentLang(l)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  contentLang === l
                    ? 'bg-[#7A0000] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-[#7A0000]/10'
                }`}
              >
                {l === 'ne' ? 'नेपाली' : l.toUpperCase()}
              </button>
            ))}
          </div>

          {donateContent.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No content sections yet.</p>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm table-fixed">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="w-8 text-center font-bold py-2.5">#</th>
                    <th className="text-left font-bold py-2.5 px-2">Title</th>
                    <th className="hidden md:table-cell w-16 text-center font-bold py-2.5">Paras</th>
                    <th className="hidden md:table-cell w-16 text-center font-bold py-2.5">Points</th>
                    <th className="w-14 text-center font-bold py-2.5">Show</th>
                    <th className="w-28 text-center font-bold py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donateContent.map((rawSection, i) => {
                    const section = normalizeSection(rawSection);
                    const isOpen = openRows.has(i);
                    const paraCount = section.paragraphs.filter(
                      (p) => (locValue(p, contentLang) || '').trim()
                    ).length;
                    const pointCount = section.points.filter(
                      (pt) => (locValue(pt, contentLang) || '').trim()
                    ).length;

                    return (
                      <React.Fragment key={section.key || i}>
                        <tr
                          className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => toggleRow(i)}
                        >
                          <td className="py-2 text-center text-xs font-mono text-gray-400">{i + 1}</td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isOpen ? (
                                <ChevronDown size={14} className="shrink-0 text-gray-400" />
                              ) : (
                                <ChevronRight size={14} className="shrink-0 text-gray-400" />
                              )}
                              <span className="font-medium text-gray-700 truncate">
                                {locValue(section.title, contentLang) || 'Untitled section'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 hidden md:table-cell text-center text-xs text-gray-500">
                            {paraCount || '—'}
                          </td>
                          <td className="py-2 hidden md:table-cell text-center text-xs text-gray-500">
                            {pointCount || '—'}
                          </td>
                          <td className="py-2 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSectionEnabled(i);
                              }}
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
                                section.enabled === false
                                  ? 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                                  : 'bg-[#7A0000]/15 text-[#7A0000]'
                              }`}
                              title={section.enabled === false ? 'Hidden on the page' : 'Visible on the page'}
                            >
                              {section.enabled === false ? <X size={14} /> : <Check size={14} />}
                            </button>
                          </td>
                          <td className="py-2">
                            <div
                              className="flex items-center justify-center gap-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => moveSection(i, -1)}
                                disabled={i === 0}
                                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                                title="Move up"
                              >
                                <ChevronUp size={14} />
                              </button>
                              <button
                                onClick={() => moveSection(i, 1)}
                                disabled={i === donateContent.length - 1}
                                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                                title="Move down"
                              >
                                <ChevronDown size={14} />
                              </button>
                              <button
                                onClick={() => removeSection(i)}
                                className="p-1.5 rounded hover:bg-red-100 text-red-500"
                                title="Remove"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr className="border-t border-gray-100 bg-gray-50/60">
                            <td colSpan={6} className="px-4 py-3">
                              <div className="grid md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Title</label>
                                  <input
                                    type="text"
                                    value={locValue(section.title, contentLang)}
                                    onChange={(e) => setSectionField(i, 'title', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#7A0000] focus:outline-none text-sm"
                                    placeholder="Section title..."
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                    Description
                                  </label>
                                  <input
                                    type="text"
                                    value={locValue(section.desc, contentLang)}
                                    onChange={(e) => setSectionField(i, 'desc', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#7A0000] focus:outline-none text-sm"
                                    placeholder="Short lead paragraph under the title"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-3 mb-1.5">
                                <label className="text-[11px] font-bold text-gray-500">
                                  Paragraphs ({section.paragraphs.length})
                                </label>
                                <button
                                  onClick={() => addParagraph(i)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#7A0000]/10 text-[#7A0000] text-[11px] font-semibold hover:bg-[#7A0000]/20 transition-all"
                                >
                                  <Plus size={12} /> Add Paragraph
                                </button>
                              </div>
                              <p className="text-[11px] text-gray-400 mb-2">
                                Add as many as you need. Empty ones are skipped on the public page.
                              </p>

                              {section.paragraphs.length === 0 ? (
                                <p className="text-[11px] text-gray-400">No paragraphs yet.</p>
                              ) : (
                                section.paragraphs.map((para, pi) => (
                                  <div key={pi} className="mb-2">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className="text-[11px] font-mono text-gray-400 w-4 shrink-0">
                                        {pi + 1}
                                      </span>
                                      <span className="text-xs text-gray-500 flex-1">
                                        Paragraph {pi + 1}
                                      </span>
                                      <button
                                        onClick={() => moveParagraph(i, pi, -1)}
                                        disabled={pi === 0}
                                        className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30"
                                        title="Move up"
                                      >
                                        <ChevronUp size={13} />
                                      </button>
                                      <button
                                        onClick={() => moveParagraph(i, pi, 1)}
                                        disabled={pi === section.paragraphs.length - 1}
                                        className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30"
                                        title="Move down"
                                      >
                                        <ChevronDown size={13} />
                                      </button>
                                      <button
                                        onClick={() => removeParagraph(i, pi)}
                                        className="p-1.5 rounded hover:bg-red-100 text-red-500"
                                        title="Remove"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                    <textarea
                                      rows={2}
                                      value={locValue(para, contentLang)}
                                      onChange={(e) => setSectionParagraph(i, pi, e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#7A0000] focus:outline-none text-sm resize-none"
                                      placeholder={`Paragraph ${pi + 1}`}
                                    />
                                  </div>
                                ))
                              )}

                              <div className="grid md:grid-cols-2 gap-3 mt-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                    List Heading
                                  </label>
                                  <input
                                    type="text"
                                    value={locValue(section.listTitle, contentLang)}
                                    onChange={(e) => setSectionField(i, 'listTitle', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#7A0000] focus:outline-none text-sm"
                                    placeholder="Optional"
                                  />
                                </div>
                                <div className="flex items-end">
                                  <button
                                    onClick={() => addPoint(i)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#7A0000]/10 text-[#7A0000] text-[11px] font-semibold hover:bg-[#7A0000]/20 transition-all"
                                  >
                                    <Plus size={12} /> Add Point
                                  </button>
                                </div>
                              </div>

                              {section.points.length > 0 && (
                                <div className="mt-2">
                                  {section.points.map((point, pi) => (
                                    <div key={pi} className="flex items-center gap-1.5 mb-1.5">
                                      <span className="text-[11px] font-mono text-gray-400 w-4 shrink-0">
                                        {pi + 1}
                                      </span>
                                      <input
                                        type="text"
                                        value={locValue(point, contentLang)}
                                        onChange={(e) => setPoint(i, pi, e.target.value)}
                                        className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg focus:border-[#7A0000] focus:outline-none text-sm"
                                        placeholder={`Point ${pi + 1}`}
                                      />
                                      <button
                                        onClick={() => movePoint(i, pi, -1)}
                                        disabled={pi === 0}
                                        className="p-2 rounded hover:bg-gray-200 disabled:opacity-30"
                                        title="Move up"
                                      >
                                        <ChevronUp size={13} />
                                      </button>
                                      <button
                                        onClick={() => movePoint(i, pi, 1)}
                                        disabled={pi === section.points.length - 1}
                                        className="p-2 rounded hover:bg-gray-200 disabled:opacity-30"
                                        title="Move down"
                                      >
                                        <ChevronDown size={13} />
                                      </button>
                                      <button
                                        onClick={() => removePoint(i, pi)}
                                        className="p-2 rounded hover:bg-red-100 text-red-500"
                                        title="Remove"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDonations;