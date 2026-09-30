// components/admin/AdminTeam.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, Pencil, Trash2, Save, X, User, Upload, Search, Eye, 
  Users, Award, Mail, Phone, MapPin, Check, XCircle, EyeOff, 
  RefreshCw, Filter, ChevronDown, ChevronUp, ChevronRight, Shield, Crown,
  Star, UserCog, UserCheck, UserPlus, HeartHandshake
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import api from '../../services/api';
import OmLoader from '../../components/common/OmLoader';

// Localized text helper: reads a { en, ne, hi, zh, ta } object
const getLocalizedValue = (obj, lang) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || '';
};

const emptyPageLocalized = { en: '', ne: '', hi: '', zh: '', ta: '' };

const AdminTeam = ({ team, setTeam, t }) => {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(null);
  const [activeLang, setActiveLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [roleLabels, setRoleLabels] = useState({});
  const [roleHierarchy, setRoleHierarchy] = useState({});

  // committee page content (AdminSettings.teamPageTitle / teamContent)
  const [teamContent, setTeamContent] = useState([]);
  const [teamPageTitle, setTeamPageTitle] = useState(emptyPageLocalized);
  const [contentLang, setContentLang] = useState('ne');
  const [savingContent, setSavingContent] = useState(false);
  const [openSections, setOpenSections] = useState(() => new Set());

  const toggleSectionOpen = (i) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  // Role definitions with icons and hierarchy
  const roleDefinitions = {
    founder: { 
      icon: Crown, 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-100',
      order: 0 
    },
    president: { 
      icon: Shield, 
      color: 'text-purple-600', 
      bg: 'bg-purple-100',
      order: 1 
    },
    vicePresident: { 
      icon: Shield, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-100',
      order: 2 
    },
    secretary: { 
      icon: UserCheck, 
      color: 'text-blue-600', 
      bg: 'bg-blue-100',
      order: 3 
    },
    treasurer: { 
      icon: UserCog, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-100',
      order: 4 
    },
    coordinator: { 
      icon: Star, 
      color: 'text-amber-600', 
      bg: 'bg-amber-100',
      order: 5 
    },
    coCoordinator: { 
      icon: Star, 
      color: 'text-orange-600', 
      bg: 'bg-orange-100',
      order: 6 
    },
    member: { 
      icon: UserPlus, 
      color: 'text-cyan-600', 
      bg: 'bg-cyan-100',
      order: 7 
    },
    volunteer: { 
      icon: HeartHandshake, 
      color: 'text-rose-600', 
      bg: 'bg-rose-100',
      order: 8 
    }
  };

  // Fetch role labels + committee page content from server
  useEffect(() => {
    const fetchRoleData = async () => {
      try {
        const [roleRes, settingsRes] = await Promise.all([
          api.get('/admin/team/roles'),
          api.get('/admin/settings').catch(() => null),
        ]);
        setRoleLabels(roleRes.data.labels || {});
        setRoleHierarchy(roleRes.data.hierarchy || {});
        if (settingsRes?.data) {
          if (Array.isArray(settingsRes.data.teamContent)) {
            setTeamContent(settingsRes.data.teamContent);
          }
          if (settingsRes.data.teamPageTitle) {
            setTeamPageTitle(settingsRes.data.teamPageTitle);
          }
        }
      } catch (error) {
        console.error('Error fetching role data:', error);
      }
    };
    fetchRoleData();
  }, []);

  const blank = () => ({
    photo: null,
    name: { en: '', ne: '', hi: '', zh: '', ta: '' },
    role: { en: '', ne: '', hi: '', zh: '', ta: '' },
    roleType: 'member',
    bio: { en: '', ne: '', hi: '', zh: '', ta: '' },
    email: '',
    phone: '',
    age: '',
    order: team.length,
    enabled: true,
  });

  const getRoleIcon = (roleType) => {
    return roleDefinitions[roleType]?.icon || User;
  };

  const getRoleColor = (roleType) => {
    return roleDefinitions[roleType]?.color || 'text-gray-600';
  };

  const getRoleBg = (roleType) => {
    return roleDefinitions[roleType]?.bg || 'bg-gray-100';
  };

  const getRoleLabel = (roleType, lang = 'en') => {
    if (roleLabels[roleType]) {
      return roleLabels[roleType][lang] || roleLabels[roleType].en || roleType;
    }
    return roleType;
  };

  const getRoleOptions = () => {
    return Object.keys(roleDefinitions).map(key => ({
      value: key,
      label: getRoleLabel(key, activeLang)
    }));
  };

  const handleSave = async () => {
    if (!editing.name?.en?.trim()) {
      showToast('Name is required (English)', 'error');
      return;
    }
    if (!editing.roleType) {
      showToast('Please select a role type', 'error');
      return;
    }

    setLoading(true);
    try {
      // keep whatever custom role text the admin typed; only fill a blank one
      const customRole = (editing.role?.en || '').trim();
      const payload = {
        ...editing,
        age: editing.age === '' || editing.age === null || editing.age === undefined
          ? null
          : Number(editing.age),
        role: {
          ...editing.role,
          en: customRole || getRoleLabel(editing.roleType, 'en')
        }
      };

      if (editing._id) {
        const response = await api.put(`/admin/team/${editing._id}`, payload);
        setTeam(team.map(m => m._id === editing._id ? response.data : m));
        showToast('Team member updated successfully', 'success');
      } else {
        const response = await api.post('/admin/team', payload);
        setTeam([...team, response.data]);
        showToast('Team member added successfully', 'success');
      }
      setEditing(null);
    } catch (error) {
      console.error('Save team error:', error);
      showToast(error.response?.data?.message || 'Failed to save team member', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this team member?')) return;
    setLoading(true);
    try {
      await api.delete(`/admin/team/${id}`);
      setTeam(team.filter(m => m._id !== id));
      showToast('Team member deleted successfully', 'success');
    } catch (error) {
      console.error('Delete team error:', error);
      showToast(error.response?.data?.message || 'Failed to delete team member', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
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

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('teamId', editing._id || 'new');

    try {
      const response = await api.post('/admin/upload/team', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditing({ ...editing, photo: response.data.url });
      showToast('Photo uploaded successfully', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      showToast(error.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  };

  const handleToggleEnabled = async (member) => {
    const newEnabled = !member.enabled;
    try {
      const updated = { ...member, enabled: newEnabled };
      const response = await api.put(`/admin/team/${member._id}`, updated);
      setTeam(team.map(m => m._id === member._id ? response.data : m));
      showToast(newEnabled ? 'Member enabled' : 'Member disabled', 'success');
    } catch (error) {
      console.error('Toggle enabled error:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const getLocalizedText = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[activeLang] || obj.en || '';
  };

  // Filter and sort team members by role hierarchy
  const filteredTeam = team
    .filter(member => {
      const name = member.name?.en?.toLowerCase() || '';
      const email = (member.email || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      const matchesSearch = name.includes(search) || email.includes(search);
      
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && member.enabled !== false) ||
        (filterStatus === 'hidden' && member.enabled === false);
      
      const matchesRole = filterRole === 'all' || member.roleType === filterRole;
      
      return matchesSearch && matchesStatus && matchesRole;
    })
    .sort((a, b) => {
      // Sort by role hierarchy first
      const orderA = roleDefinitions[a.roleType]?.order ?? 99;
      const orderB = roleDefinitions[b.roleType]?.order ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      // Then by order field
      return (a.order || 0) - (b.order || 0);
    });

  // ===== committee page content (AdminSettings) =====
  const emptyLocalized = () => ({ en: '', ne: '', hi: '', zh: '', ta: '' });

  const patchSection = (index, fn) =>
    setTeamContent((prev) => prev.map((s, i) => (i === index ? fn(s) : s)));

  const addContentSection = () => {
    setTeamContent([
      ...teamContent,
      {
        key: `team_${Date.now()}`,
        title: emptyLocalized(),
        paragraphs: {
          p1: emptyLocalized(),
          p2: emptyLocalized(),
          p3: emptyLocalized(),
          p4: emptyLocalized()
        },
        listTitle: emptyLocalized(),
        points: [],
        showMembers: false,
        order: teamContent.length,
        enabled: true
      }
    ]);
  };

  const removeContentSection = (index) => {
    if (!window.confirm('Remove this section?')) return;
    setTeamContent(teamContent.filter((_, i) => i !== index));
  };

  const moveContentSection = (index, dir) => {
    const next = [...teamContent];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setTeamContent(next.map((s, i) => ({ ...s, order: i })));
  };

  const updateContentField = (index, field, value) => {
    patchSection(index, (s) => ({ ...s, [field]: { ...(s[field] || {}), [contentLang]: value } }));
  };

  const updateContentParagraph = (index, pKey, value) => {
    patchSection(index, (s) => ({
      ...s,
      paragraphs: {
        ...(s.paragraphs || {}),
        [pKey]: { ...(s.paragraphs?.[pKey] || {}), [contentLang]: value }
      }
    }));
  };

  const addContentPoint = (index) => {
    patchSection(index, (s) => ({ ...s, points: [...(s.points || []), emptyLocalized()] }));
  };

  const updateContentPoint = (index, pointIndex, value) => {
    patchSection(index, (s) => ({
      ...s,
      points: (s.points || []).map((p, i) =>
        i === pointIndex ? { ...(p || {}), [contentLang]: value } : p
      )
    }));
  };

  const removeContentPoint = (index, pointIndex) => {
    patchSection(index, (s) => ({
      ...s,
      points: (s.points || []).filter((_, i) => i !== pointIndex)
    }));
  };

  const moveContentPoint = (index, pointIndex, dir) => {
    patchSection(index, (s) => {
      const points = [...(s.points || [])];
      const target = pointIndex + dir;
      if (target < 0 || target >= points.length) return s;
      [points[pointIndex], points[target]] = [points[target], points[pointIndex]];
      return { ...s, points };
    });
  };

  const saveTeamContent = async () => {
    setSavingContent(true);
    try {
      await api.put('/admin/settings', {
        teamPageTitle,
        teamContent: teamContent.map((s, i) => ({ ...s, order: i }))
      });
      showToast('Committee content saved', 'success');
    } catch (error) {
      console.error('Error saving team content:', error);
      showToast('Failed to save committee content', 'error');
    } finally {
      setSavingContent(false);
    }
  };

  if (editing) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-serif font-semibold text-ink">
            {editing._id ? 'Edit Team Member' : 'Add New Team Member'}
          </h4>
          <button 
            onClick={() => setEditing(null)} 
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Photo Upload */}
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Profile Photo</label>
            <div className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden h-40 flex items-center justify-center cursor-pointer bg-gray-50 hover:border-vermilion transition-colors">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoUpload} 
                className="hidden" 
                id="team-photo-upload" 
              />
              <label htmlFor="team-photo-upload" className="absolute inset-0 flex items-center justify-center cursor-pointer">
                {editing.photo ? (
                  <img src={editing.photo} alt="Team" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-ink-soft">
                    <User size={40} />
                    <span className="text-sm font-medium">Click to upload profile photo</span>
                    <span className="text-xs text-ink-soft/60">JPG, PNG, WEBP • Max 5MB</span>
                  </div>
                )}
              </label>
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <OmLoader size="lg" color="white" />
                </div>
              )}
              {editing.photo && !uploading && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs font-bold py-2 flex items-center justify-center gap-1.5">
                  <Upload size={14} /> Click to change photo
                </div>
              )}
            </div>
          </div>

          <LanguageSwitcher active={activeLang} onChange={setActiveLang} t={t} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">Name *</label>
              <input
                type="text"
                value={editing.name[activeLang] || ''}
                onChange={(e) => setEditing({ ...editing, name: { ...editing.name, [activeLang]: e.target.value } })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
                placeholder="Enter name..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">Role Type *</label>
              <select
                value={editing.roleType || 'member'}
                onChange={(e) => {
                  const roleType = e.target.value;
                  const label = getRoleLabel(roleType, activeLang);
                  setEditing({ 
                    ...editing, 
                    roleType,
                    role: { ...editing.role, [activeLang]: label }
                  });
                }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
              >
                {getRoleOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Custom Role Name (Optional)</label>
            <input
              type="text"
              value={editing.role[activeLang] || ''}
              onChange={(e) => setEditing({ ...editing, role: { ...editing.role, [activeLang]: e.target.value } })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
              placeholder="Custom role name (overrides default)..."
            />
            <p className="text-xs text-ink-soft/60 mt-1">Leave empty to use default role name</p>
          </div>

          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Bio / Description</label>
            <textarea
              rows={3}
              value={editing.bio?.[activeLang] || ''}
              onChange={(e) => setEditing({ ...editing, bio: { ...editing.bio, [activeLang]: e.target.value } })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors resize-none"
              placeholder="Enter bio..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5 flex items-center gap-1">
                <Mail size={14} className="text-ink-soft" /> Email
              </label>
              <input
                type="email"
                value={editing.email || ''}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5 flex items-center gap-1">
                <Phone size={14} className="text-ink-soft" /> Phone
              </label>
              <input
                type="text"
                value={editing.phone || ''}
                onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
                placeholder="+977-XXXXXXXXXX"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5 flex items-center gap-1">
                <Users size={14} className="text-ink-soft" /> Age
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={editing.age ?? ''}
                onChange={(e) => setEditing({ ...editing, age: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <input
                type="checkbox"
                checked={editing.enabled !== false}
                onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-vermilion focus:ring-vermilion"
              />
              Show on website
            </label>
            <span className="text-xs text-ink-soft/60">(Active members appear on the public team page)</span>
          </div>

          <button
            onClick={handleSave}
            disabled={loading || uploading}
            className="w-full py-3 rounded-xl bg-vermilion text-white font-semibold text-sm hover:bg-[#a83a0c] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                {editing._id ? 'Update Member' : 'Add Member'}
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Role filter options
  const roleFilterOptions = [
    { value: 'all', label: 'All Roles' },
    ...getRoleOptions()
  ];

  return (
    <div className="space-y-6">
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-gray-100 gap-4">
        <div>
          <h4 className="text-lg font-serif font-semibold text-ink flex items-center gap-2">
            <Users size={20} className="text-vermilion" />
            {t.manageTeam || 'Team Members'}
          </h4>
          <p className="text-xs text-ink-soft">
            Total: <span className="font-bold text-ink">{team?.length || 0}</span> members • 
            Active: <span className="font-bold text-green-600">{team?.filter(m => m.enabled !== false).length || 0}</span> • 
            Hidden: <span className="font-bold text-gray-400">{team?.filter(m => m.enabled === false).length || 0}</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white text-ink shadow-sm' 
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'list' 
                  ? 'bg-white text-ink shadow-sm' 
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              List
            </button>
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-white min-w-[130px]"
          >
            {roleFilterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
          </select>

          {/* Search Bar */}
          <div className="relative w-full sm:w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm bg-gray-50 hover:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => setEditing(blank())}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-vermilion text-white text-sm font-semibold hover:bg-[#a83a0c] transition-all whitespace-nowrap shadow-lg shadow-vermilion/20"
          >
            <Plus size={16} /> {t.add || 'Add Member'}
          </button>
        </div>
      </div>

      {/* Team Grid/List */}
      {filteredTeam?.length === 0 ? (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-ink-soft">
            {searchTerm || filterStatus !== 'all' || filterRole !== 'all'
              ? 'No members found matching your filters' 
              : 'No team members added yet'}
          </p>
          {(searchTerm || filterStatus !== 'all' || filterRole !== 'all') && (
            <button
              onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterRole('all'); }}
              className="mt-2 text-sm text-vermilion hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 max-h-[600px] overflow-y-auto scroll-smooth">
          {filteredTeam.map((member) => {
            const RoleIcon = getRoleIcon(member.roleType);
            const roleColor = getRoleColor(member.roleType);
            const roleBg = getRoleBg(member.roleType);
            const roleLabel = getRoleLabel(member.roleType, activeLang);
            const roleNe = member.role?.ne?.trim() || getRoleLabel(member.roleType, 'ne');

            return (
              <div
                key={member._id}
                className="group bg-white rounded-xl border border-gray-100 hover:border-vermilion/30 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Photo */}
                <div className="relative aspect-square bg-gradient-to-br from-vermilion/10 to-maroon-deep/5">
                  {member.photo ? (
                    <img 
                      src={member.photo} 
                      alt={member.name?.en} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={48} className="text-ink-soft/30" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      member.enabled !== false 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {member.enabled !== false ? <Check size={10} /> : <XCircle size={10} />}
                      {member.enabled !== false ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  {/* Role Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${roleBg} ${roleColor}`}>
                      <RoleIcon size={12} />
                      {roleLabel}
                    </span>
                  </div>
                  {/* Actions on hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setEditing(member)}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
                      title="Edit"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleToggleEnabled(member)}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
                      title={member.enabled !== false ? 'Hide' : 'Show'}
                    >
                      {member.enabled !== false ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button
                      onClick={() => handleDelete(member._id)}
                      className="p-2 rounded-lg bg-red-500/70 hover:bg-red-500 text-white transition-all"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h5 className="font-serif font-semibold text-ink text-sm truncate">
                    {member.name?.ne || member.name?.en || 'Unknown'}
                  </h5>
                  <p className={`text-xs font-medium truncate ${roleColor}`}>
                    {roleNe}
                  </p>
                  {member.bio?.[activeLang] && (
                    <p className="text-xs text-ink-soft mt-1 line-clamp-2">
                      {member.bio[activeLang]}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-ink-soft/60">
                    {member.email && (
                      <span className="flex items-center gap-1 truncate max-w-[100px]">
                        <Mail size={12} /> {member.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide">#</th>
                <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Photo</th>
                <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Role</th>
                <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Email</th>
                <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
                <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeam.map((member, index) => {
                const RoleIcon = getRoleIcon(member.roleType);
                const roleColor = getRoleColor(member.roleType);
                const roleBg = getRoleBg(member.roleType);
                const roleLabel = getRoleLabel(member.roleType, activeLang);
                const roleNe = member.role?.ne?.trim() || getRoleLabel(member.roleType, 'ne');

                return (
                  <tr key={member._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 text-xs text-gray-400">{index + 1}</td>
                    <td className="py-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
                        {member.photo ? (
                          <img src={member.photo} alt={member.name?.en} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-vermilion to-maroon text-white text-xs font-bold">
                            {member.name?.en?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 font-medium text-gray-800">{member.name?.ne || member.name?.en || 'Unknown'}</td>
                    <td className="py-3 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${roleBg} ${roleColor}`}>
                        <RoleIcon size={12} />
                        {roleNe}
                      </span>
                    </td>
                    <td className="py-3 hidden lg:table-cell text-gray-500 text-xs">{member.email || '—'}</td>
                    <td className="py-3 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        member.enabled !== false 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {member.enabled !== false ? <Check size={10} /> : <XCircle size={10} />}
                        {member.enabled !== false ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditing(member)}
                          className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleEnabled(member)}
                          className="p-1.5 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                          title={member.enabled !== false ? 'Hide' : 'Show'}
                        >
                          {member.enabled !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button
                          onClick={() => handleDelete(member._id)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={14} />
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

      {/* Footer with stats */}
      <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between text-xs text-ink-soft">
        <span>
          Showing {filteredTeam.length} of {team.length} members
        </span>
        <span>
          {team.filter(m => m.enabled !== false).length} active • {team.filter(m => m.enabled === false).length} hidden
        </span>
      </div>
    </div>

    {/* ===== Committee Page Content ===== */}
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      <div className="px-6 py-4 bg-gradient-to-r from-vermilion/10 to-vermilion/5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-gray-700 font-semibold flex items-center gap-2">
          <Users size={18} className="text-vermilion" />
          Committee Page Content
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={addContentSection}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-vermilion text-white text-xs font-semibold hover:bg-[#a83a0c] transition-all"
          >
            <Plus size={14} /> Add Section
          </button>
          <button
            onClick={saveTeamContent}
            disabled={savingContent}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-vermilion text-white text-xs font-semibold hover:bg-[#a83a0c] transition-all disabled:opacity-50"
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
        <div className="mb-4">
          <label className="text-xs font-bold text-ink block mb-1.5">Page Title</label>
          <input
            type="text"
            value={getLocalizedValue(teamPageTitle, contentLang)}
            onChange={(e) =>
              setTeamPageTitle({ ...(teamPageTitle || {}), [contentLang]: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
            placeholder="e.g. कार्यसमिति तथा सदस्यहरू"
          />
        </div>

        <div className="flex gap-1.5 mb-4 flex-wrap">
          {['ne', 'en', 'hi', 'zh', 'ta'].map((l) => (
            <button
              key={l}
              onClick={() => setContentLang(l)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                contentLang === l
                  ? 'bg-vermilion text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-vermilion/10'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {teamContent.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No content sections yet.</p>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="w-8 text-center font-bold py-2.5">#</th>
                  <th className="text-left font-bold py-2.5 px-2">Title</th>
                  <th className="hidden md:table-cell w-20 text-center font-bold py-2.5">Paras</th>
                  <th className="hidden md:table-cell w-16 text-center font-bold py-2.5">Points</th>
                  <th className="w-16 text-center font-bold py-2.5">Members</th>
                  <th className="w-28 text-center font-bold py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamContent.map((section, i) => {
                  const isOpen = openSections.has(i);
                  const paraCount = ['p1', 'p2', 'p3', 'p4'].filter(
                    (p) => (getLocalizedValue(section.paragraphs?.[p], contentLang) || '').trim()
                  ).length;
                  const pointCount = (section.points || []).filter(
                    (pt) => (getLocalizedValue(pt, contentLang) || '').trim()
                  ).length;

                  return (
                    <React.Fragment key={section.key || i}>
                      <tr
                        className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => toggleSectionOpen(i)}
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
                              {getLocalizedValue(section.title, contentLang) || 'Untitled section'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 hidden md:table-cell text-center text-xs text-gray-500">{paraCount || '—'}</td>
                        <td className="py-2 hidden md:table-cell text-center text-xs text-gray-500">{pointCount || '—'}</td>
                        <td className="py-2 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              patchSection(i, (s) => ({ ...s, showMembers: !s.showMembers }));
                            }}
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
                              section.showMembers
                                ? 'bg-vermilion/15 text-vermilion'
                                : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                            }`}
                            title="Render the member list at this section"
                          >
                            <Users size={14} />
                          </button>
                        </td>
                        <td className="py-2">
                          <div
                            className="flex items-center justify-center gap-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => moveContentSection(i, -1)}
                              disabled={i === 0}
                              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                              title="Move up"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              onClick={() => moveContentSection(i, 1)}
                              disabled={i === teamContent.length - 1}
                              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                              title="Move down"
                            >
                              <ChevronDown size={14} />
                            </button>
                            <button
                              onClick={() => removeContentSection(i)}
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
                                  value={getLocalizedValue(section.title, contentLang)}
                                  onChange={(e) => updateContentField(i, 'title', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                                  placeholder="Section title..."
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-gray-500 mb-1">List Heading</label>
                                <input
                                  type="text"
                                  value={getLocalizedValue(section.listTitle, contentLang)}
                                  onChange={(e) => updateContentField(i, 'listTitle', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                                  placeholder="Optional"
                                />
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-3 mt-3">
                              {['p1', 'p2', 'p3', 'p4'].map((pKey) => (
                                <div key={pKey}>
                                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                    Paragraph {pKey.slice(1).toUpperCase()}
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={getLocalizedValue(section.paragraphs?.[pKey], contentLang)}
                                    onChange={(e) => updateContentParagraph(i, pKey, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm resize-none"
                                    placeholder={`Paragraph ${pKey.slice(1).toUpperCase()}`}
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between mt-3 mb-1.5">
                              <label className="text-[11px] font-bold text-gray-500">
                                Bullet Points ({(section.points || []).length})
                              </label>
                              <button
                                onClick={() => addContentPoint(i)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-vermilion/10 text-vermilion text-[11px] font-semibold hover:bg-vermilion/20 transition-all"
                              >
                                <Plus size={12} /> Add Point
                              </button>
                            </div>

                            {(section.points || []).length === 0 ? (
                              <p className="text-[11px] text-gray-400">No bullet points.</p>
                            ) : (
                              (section.points || []).map((point, pi) => (
                                <div key={pi} className="flex items-center gap-1.5 mb-1.5">
                                  <span className="text-[11px] font-mono text-gray-400 w-4 shrink-0">{pi + 1}</span>
                                  <input
                                    type="text"
                                    value={getLocalizedValue(point, contentLang)}
                                    onChange={(e) => updateContentPoint(i, pi, e.target.value)}
                                    className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
                                    placeholder={`Point ${pi + 1}`}
                                  />
                                  <button
                                    onClick={() => moveContentPoint(i, pi, -1)}
                                    disabled={pi === 0}
                                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-30"
                                    title="Move up"
                                  >
                                    <ChevronUp size={13} />
                                  </button>
                                  <button
                                    onClick={() => moveContentPoint(i, pi, 1)}
                                    disabled={pi === section.points.length - 1}
                                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-30"
                                    title="Move down"
                                  >
                                    <ChevronDown size={13} />
                                  </button>
                                  <button
                                    onClick={() => removeContentPoint(i, pi)}
                                    className="p-2 rounded hover:bg-red-100 text-red-500"
                                    title="Remove"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ))
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

export default AdminTeam;