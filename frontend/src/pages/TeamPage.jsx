// pages/TeamPage.jsx - Updated with Founder/Patron hero section (no icons, no view profile button)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import api from '../services/api';
import OmLoader from '../components/common/OmLoader';

const TeamPage = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState('all');

  const roleHierarchy = {
    founder: { 
      label: { en: 'Founder / Patron', ne: 'निर्माणकर्ता / संरक्षक', hi: 'संस्थापक / संरक्षक', zh: '创始人 / 赞助人', ta: 'நிறுவனர் / புரவலர்' },
      order: 0,
      isFounder: true
    },
    president: { 
      label: { en: 'President / Chairperson', ne: 'अध्यक्ष', hi: 'अध्यक्ष', zh: '主席', ta: 'தலைவர்' },
      order: 1
    },
    vicePresident: { 
      label: { en: 'Vice President', ne: 'उपाध्यक्ष', hi: 'उपाध्यक्ष', zh: '副主席', ta: 'துணைத் தலைவர்' },
      order: 2
    },
    secretary: { 
      label: { en: 'Secretary', ne: 'सचिव', hi: 'सचिव', zh: '秘书', ta: 'செயலாளர்' },
      order: 3
    },
    treasurer: { 
      label: { en: 'Treasurer', ne: 'कोषाध्यक्ष', hi: 'कोषाध्यक्ष', zh: '财务主管', ta: 'பொருளாளர்' },
      order: 4
    },
    coordinator: { 
      label: { en: 'Coordinator', ne: 'संयोजक', hi: 'संयोजक', zh: '协调员', ta: 'ஒருங்கிணைப்பாளர்' },
      order: 5
    },
    coCoordinator: { 
      label: { en: 'Co-Coordinator', ne: 'सह-संयोजक', hi: 'सह-संयोजक', zh: '联合协调员', ta: 'இணை ஒருங்கிணைப்பாளர்' },
      order: 6
    },
    member: { 
      label: { en: 'Member', ne: 'सदस्य', hi: 'सदस्य', zh: '成员', ta: 'உறுப்பினர்' },
      order: 7
    },
    volunteer: { 
      label: { en: 'Volunteer / Service Member', ne: 'सेवक', hi: 'सेवक', zh: '志愿者', ta: 'தன்னார்வலர்' },
      order: 8
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/team');
      setTeam(response.data);
    } catch (error) {
      console.error('Error fetching team:', error);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedText = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj.en || '';
  };

  const getRoleLabel = (roleType) => {
    return roleHierarchy[roleType]?.label?.[lang] || roleType;
  };

  // Separate founder from other members
  const founderMembers = team
    .filter(member => member.enabled !== false && member.roleType === 'founder')
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const otherMembers = team
    .filter(member => member.enabled !== false && member.roleType !== 'founder')
    .filter(member => selectedRole === 'all' || member.roleType === selectedRole)
    .sort((a, b) => {
      const orderA = roleHierarchy[a.roleType]?.order ?? 99;
      const orderB = roleHierarchy[b.roleType]?.order ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.order || 0) - (b.order || 0);
    });

  const groupedByRole = otherMembers.reduce((acc, member) => {
    const role = member.roleType || 'member';
    if (!acc[role]) acc[role] = [];
    acc[role].push(member);
    return acc;
  }, {});

  const uniqueRoles = [...new Set(team.map(m => m.roleType))].filter(Boolean);

  const handleMemberClick = (member) => {
    navigate(`/templeteams/${member._id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 px-6">
        <div className="max-w-7xl mx-auto py-12 text-center">
          <OmLoader size="lg" color="maroon" className="mx-auto" />
          <p className="text-gray-500 mt-4">Loading team members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 px-6">
        <div className="max-w-7xl mx-auto py-12 text-center">
          <p className="text-red-500">{error}</p>
          <button onClick={fetchTeam} className="mt-4 text-[#7A0000] hover:underline">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-6">
      <div className="max-w-7xl mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#7A0000]">
            {t.teamTitle || 'Our Team'}
          </h1>
          <div className="w-20 h-1 bg-[#7A0000] mx-auto mt-4 rounded-full" />
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            {t.teamSubtitle || 'Meet the dedicated individuals behind Shree Ramchandra Temple'}
          </p>
        </motion.div>

        {/* ===== FOUNDER / PATRON HERO SECTION ===== */}
        {founderMembers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-16"
          >
            {founderMembers.map((founder, index) => {
              const founderName = getLocalizedText(founder.name);
              const founderRole = getLocalizedText(founder.role);
              const founderBio = getLocalizedText(founder.bio);
              const founderTitle = roleHierarchy.founder?.label?.[lang] || 'Founder / Patron';

              return (
                <div key={founder._id} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7A0000] via-[#8B0000] to-[#5C0000] shadow-2xl">
                  {/* Decorative pattern overlay */}
                  <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,215,0,0.1) 0%, transparent 50%), 
                                    radial-gradient(circle at 80% 50%, rgba(255,215,0,0.05) 0%, transparent 50%)`
                  }} />
                  
                  {/* Gold accent lines */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

                  <div className="relative z-10 grid md:grid-cols-2 gap-8 p-8 md:p-12 lg:p-16 items-center">
                    {/* Left - Photo */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="flex justify-center md:justify-start"
                    >
                      <div className="relative">
                        {/* Glowing ring */}
                        <div className="absolute -inset-4 rounded-full bg-amber-400/20 blur-2xl animate-pulse" />
                        <div className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full overflow-hidden border-4 border-amber-400/40 shadow-2xl shadow-amber-500/20">
                          {founder.photo ? (
                            <img
                              src={founder.photo}
                              alt={founderName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#7A0000]/30 text-amber-400/30 text-6xl font-serif">
                              🕉️
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Right - Info (Name, Role, Bio ONLY - No View Profile button) */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="text-center md:text-left space-y-4"
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-200 text-xs font-medium tracking-wider uppercase">
                        {founderTitle}
                      </div>
                      
                      <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                        {founderName || 'Unknown'}
                      </h2>
                      
                      {founderRole && (
                        <p className="text-amber-300/80 text-lg sm:text-xl font-medium">
                          {founderRole}
                        </p>
                      )}
                      
                      {founderBio && (
                        <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-lg mx-auto md:mx-0">
                          {founderBio}
                        </p>
                      )}

                      {/* Contact info - visible but no view profile button */}
                      <div className="flex flex-wrap items-center gap-4 pt-2">
                        {founder.email && (
                          <a
                            href={`mailto:${founder.email}`}
                            className="text-amber-200/80 hover:text-amber-200 transition-colors text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {founder.email}
                          </a>
                        )}
                        {founder.email && founder.phone && (
                          <span className="w-px h-4 bg-amber-200/20" />
                        )}
                        {founder.phone && (
                          <a
                            href={`tel:${founder.phone}`}
                            className="text-amber-200/80 hover:text-amber-200 transition-colors text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {founder.phone}
                          </a>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ===== FILTER BUTTONS ===== */}
        {uniqueRoles.filter(r => r !== 'founder').length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            <button
              onClick={() => setSelectedRole('all')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                selectedRole === 'all'
                  ? 'bg-[#7A0000] text-white shadow-lg shadow-[#7A0000]/20'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t.allMembers || 'All Members'}
            </button>
            {uniqueRoles.filter(r => r !== 'founder').map(role => {
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#7A0000] text-white shadow-lg shadow-[#7A0000]/20'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {getRoleLabel(role)}
                </button>
              );
            })}
          </div>
        )}

        {/* ===== OTHER MEMBERS GRID ===== */}
        {Object.entries(groupedByRole).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl text-gray-300 mb-3 font-serif">🕉️</div>
            <p className="text-gray-500">No other team members found</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(groupedByRole).map(([role, members]) => {
              const roleLabel = getRoleLabel(role);
              
              return (
                <motion.div
                  key={role}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="border-b border-gray-200 pb-8 last:border-b-0"
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-serif font-bold text-[#7A0000]">
                      {roleLabel}
                    </h2>
                    <div className="w-16 h-0.5 bg-[#7A0000]/30 mt-2 rounded-full" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {members.map((member, index) => {
                      const memberName = getLocalizedText(member.name);
                      const memberRole = getLocalizedText(member.role);
                      const memberBio = getLocalizedText(member.bio);
                      
                      return (
                        <motion.div
                          key={member._id}
                          onClick={() => handleMemberClick(member)}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                        >
                          <div className="relative aspect-[4/3] bg-gradient-to-br from-[#7A0000]/5 to-[#7A0000]/10 overflow-hidden">
                            {member.photo ? (
                              <img
                                src={member.photo}
                                alt={memberName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300 font-serif">
                                🕉️
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <h3 className="font-serif font-bold text-[#7A0000] text-lg">
                              {memberName || 'Unknown'}
                            </h3>
                            <p className="text-sm text-gray-600 font-medium mt-0.5">
                              {memberRole || ''}
                            </p>
                            {memberBio && (
                              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                {memberBio}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                              {member.email && (
                                <a
                                  href={`mailto:${member.email}`}
                                  className="text-xs text-gray-500 hover:text-[#7A0000] transition-colors truncate"
                                  title={member.email}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {member.email}
                                </a>
                              )}
                              {member.phone && (
                                <a
                                  href={`tel:${member.phone}`}
                                  className="text-xs text-gray-500 hover:text-[#7A0000] transition-colors"
                                  title={member.phone}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {member.phone}
                                </a>
                              )}
                              <div className="ml-auto text-gray-300 group-hover:text-[#7A0000] transition-colors">
                                →
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamPage;