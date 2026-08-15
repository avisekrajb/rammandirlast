// pages/TeamProfilePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import OmLoader from '../components/common/OmLoader';
import { 
  ArrowLeft, User, Mail, Phone, Calendar, 
  Users, Award, Copy, CheckCheck,
  ArrowUpRight, UserPlus,
  BadgeCheck, QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const TeamProfilePage = () => {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedMembers, setRelatedMembers] = useState([]);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        console.log('Fetching member with ID:', id);
        const response = await api.get(`/admin/team/${id}`);
        console.log('Member data:', response.data);
        setMember(response.data);
        setFollowers(response.data.followers || 0);
        setIsFollowing(response.data.followersBy?.includes?.(user?._id) || false);
        setError(null);
        
        // Fetch related members
        try {
          const teamRes = await api.get('/admin/team');
          const team = teamRes.data || [];
          const related = team
            .filter(m => m._id !== id && m.enabled !== false)
            .slice(0, 6);
          setRelatedMembers(related);
        } catch (relatedError) {
          console.error('Error fetching related members:', relatedError);
        }
      } catch (error) {
        console.error('Error fetching team member:', error);
        setError('Team member not found');
        showToast(t.teamMemberNotFound || 'Team member not found', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchMember();
    } else {
      setLoading(false);
      setError('No member ID provided');
    }
  }, [id, showToast, user?._id, t]);

  const getLocalizedText = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj.en || '';
  };

  const formatFollowerCount = (count) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    if (count >= 100) {
      return count + '+';
    }
    return count;
  };

  const handleFollow = async () => {
    if (!user) {
      showToast(t.loginRequired || 'Please login to follow', 'warning');
      navigate('/login');
      return;
    }

    setFollowLoading(true);
    try {
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const response = await api.post(`/admin/team/${id}/${endpoint}`);
      setFollowers(response.data.followers);
      setIsFollowing(!isFollowing);
      showToast(isFollowing ? t.unfollowed || 'Unfollowed' : t.following || 'Following!', 'success');
    } catch (error) {
      console.error('Follow error:', error);
      showToast(error.response?.data?.message || t.followFailed || 'Failed to update follow', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCopyEmail = () => {
    if (member?.email) {
      navigator.clipboard.writeText(member.email);
      setCopied(true);
      showToast(t.emailCopied || 'Email copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRelatedClick = (relatedMember) => {
    navigate(`/templeteams/${relatedMember._id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <OmLoader size="lg" color="maroon" className="mx-auto mb-4" />
          <p className="text-gray-500 text-sm">{t.loadingProfile || 'Loading profile...'}</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-6 bg-white rounded-2xl shadow-lg p-8">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <User size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{t.memberNotFound || 'Member Not Found'}</h2>
          <p className="text-gray-500 mt-2">{t.memberNotFoundMsg || "The team member you're looking for doesn't exist."}</p>
          <button
            onClick={() => navigate('/templeteams')}
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#7A0000] text-white font-semibold text-sm hover:bg-[#5A0000] transition-all shadow-lg"
          >
            <ArrowLeft size={16} /> {t.backToTeam || 'Back to Team'}
          </button>
        </div>
      </div>
    );
  }

  const nameText = getLocalizedText(member.name);
  const roleText = getLocalizedText(member.role);
  const bioText = getLocalizedText(member.bio);
  const photo = member.photo || '/default-avatar.jpg';

  // Info items
  const infoItems = [
    { icon: Mail, label: t.email || 'Email', value: member.email, isEmail: true },
    { icon: Phone, label: t.phone || 'Phone', value: member.phone, isPhone: true },
    { icon: Calendar, label: t.memberSince || 'Member Since', value: new Date(member.createdAt).toLocaleDateString(lang === 'ne' ? 'ne-NP' : lang === 'hi' ? 'hi-IN' : lang === 'zh' ? 'zh-CN' : lang === 'ta' ? 'ta-IN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
    { icon: Award, label: t.role || 'Role', value: roleText },
  ];

  const visibleInfo = infoItems.filter(item => item.value);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content - No Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {/* Photo */}
                <div className="relative flex-shrink-0">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                    <img
                      src={photo}
                      alt={nameText}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/default-avatar.jpg';
                      }}
                    />
                  </div>
                  <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#7A0000]">
                        {nameText}
                      </h1>
                      <p className="text-sm text-gray-600 mt-1 font-medium">
                        {roleText}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${
                          isFollowing 
                            ? 'bg-[#7A0000] text-white hover:bg-[#5A0000]' 
                            : 'bg-[#7A0000] text-white hover:bg-[#5A0000]'
                        }`}
                      >
                        {followLoading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <UserPlus size={16} />
                        )}
                        {isFollowing ? (t.following || 'Following') : (t.follow || 'Follow')}
                      </button>
                      <div className="flex items-center gap-1.5 bg-gray-100 px-3.5 py-1.5 rounded-full">
                        <Users size={14} className="text-[#7A0000]" />
                        <span className="text-sm font-bold text-[#7A0000]">{formatFollowerCount(followers)}</span>
                        <span className="text-xs text-gray-500">{t.followers || 'followers'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {bioText && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {bioText}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <BadgeCheck size={16} className="text-[#7A0000]" />
                {t.profileDetails || 'Profile Details'}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibleInfo.map((item, index) => {
                  const Icon = item.icon;
                  const isEmail = item.isEmail;
                  const isPhone = item.isPhone;
                  
                  return (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-[#7A0000]/10 flex items-center justify-center flex-shrink-0">
                        <Icon size={16} className="text-[#7A0000]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                        {isEmail ? (
                          <div className="flex items-center gap-2">
                            <a 
                              href={`mailto:${item.value}`}
                              className="text-sm text-gray-800 hover:text-[#7A0000] transition-colors truncate"
                            >
                              {item.value}
                            </a>
                            <button
                              onClick={handleCopyEmail}
                              className="p-1 rounded hover:bg-gray-200 transition-colors flex-shrink-0"
                            >
                              {copied ? <CheckCheck size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                            </button>
                          </div>
                        ) : isPhone ? (
                          <a 
                            href={`tel:${item.value}`}
                            className="text-sm text-gray-800 hover:text-[#7A0000] transition-colors flex items-center gap-1"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-sm text-gray-800 font-medium">{item.value}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* QR Code Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <button
                onClick={() => setShowQR(!showQR)}
                className="flex items-center justify-between w-full group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#7A0000]/10 flex items-center justify-center">
                    <QrCode size={16} className="text-[#7A0000]" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{t.qrCode || 'QR Code'}</span>
                </div>
                <span className="text-sm text-[#7A0000] font-medium group-hover:underline">
                  {showQR ? (t.hideQR || 'Hide') : (t.showQR || 'Show')}
                </span>
              </button>
              
              <AnimatePresence>
                {showQR && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                      <p className="text-xs text-gray-500 mb-3">{t.scanToViewProfile || 'Scan to view profile'}</p>
                      <div className="flex justify-center">
                        <QRCodeSVG 
                          value={window.location.href} 
                          size={160}
                          level="H"
                          includeMargin={true}
                          bgColor="#ffffff"
                          fgColor="#7A0000"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column - Related Members (1/3) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#7A0000]" />
                  <h4 className="font-semibold text-sm text-gray-700">{t.teamMembers || 'Team Members'}</h4>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {relatedMembers.length}
                </span>
              </div>

              <div 
                ref={scrollContainerRef}
                className="space-y-2 max-h-[500px] overflow-y-auto pr-1"
              >
                {relatedMembers.map((related, index) => {
                  const relName = getLocalizedText(related.name);
                  const relRole = getLocalizedText(related.role);

                  return (
                    <motion.button
                      key={related._id}
                      onClick={() => handleRelatedClick(related)}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="w-full group flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-all duration-200"
                    >
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 group-hover:border-[#7A0000]/30 transition-all">
                        {related.photo ? (
                          <img 
                            src={related.photo} 
                            alt={relName} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7A0000] to-[#A00000] text-white font-bold text-sm">
                            {relName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-[#7A0000] transition-colors">
                          {relName}
                        </p>
                        {relRole && (
                          <p className="text-xs text-gray-400 truncate">
                            {relRole}
                          </p>
                        )}
                      </div>
                    </motion.button>
                  );
                })}

                {relatedMembers.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400">{t.noOtherMembers || 'No other members'}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate('/templeteams')}
                className="w-full mt-3 pt-3 border-t border-gray-100 text-center text-xs text-[#7A0000] hover:underline font-medium flex items-center justify-center gap-1"
              >
                {t.viewAll || 'View All'} <ArrowUpRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar */}
      <style>{`
        .overflow-y-auto::-webkit-scrollbar {
          width: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default TeamProfilePage;