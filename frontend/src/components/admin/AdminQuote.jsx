import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Save, Calendar, ChevronLeft, ChevronRight, Copy, X, 
  Plus, Trash2, RefreshCw, Search, Edit, Globe, 
  CheckCircle, Clock, CalendarDays, 
  Loader2, Languages, BookOpen, Filter
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import api from '../../services/api';

const AdminQuote = ({ settings, updateSettings, t }) => {
  const { showToast } = useToast();
  const [activeLang, setActiveLang] = useState('en');
  const [quotes, setQuotes] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showAllQuotes, setShowAllQuotes] = useState(false);
  const [editingQuote, setEditingQuote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'month' | 'year'
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkQuotes, setBulkQuotes] = useState({});
  const [stats, setStats] = useState({ total: 0, filled: 0, empty: 0, languages: {} });
  const [monthQuotesCache, setMonthQuotesCache] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const initialLoadRef = useRef(true);
  const textareaRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Language options
  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ne', label: 'नेपाली', flag: '🇳🇵' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'ta', label: 'தமிழ்', flag: '🇱🇰' },
  ];

  // Helper: Get date key
  const getDateKey = useCallback((date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Today's date key
  const todayKey = getDateKey(new Date());

  // Fetch quotes from API
  const fetchQuotes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/quotes');
      if (response.data.success) {
        setQuotes(response.data.data || {});
        updateStats(response.data.data || {});
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
      showToast('Failed to load quotes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Initialize quotes
  useEffect(() => {
    if (!initialLoadRef.current) return;
    initialLoadRef.current = false;
    fetchQuotes();
  }, [fetchQuotes]);

  // Update stats
  const updateStats = (quotesData) => {
    const total = Object.keys(quotesData).length;
    let filled = 0;
    let empty = 0;
    const langStats = {};
    
    languages.forEach(lang => {
      langStats[lang.code] = 0;
    });
    
    Object.values(quotesData).forEach(q => {
      let hasContent = false;
      languages.forEach(lang => {
        if (q[lang.code] && q[lang.code].trim()) {
          langStats[lang.code] = (langStats[lang.code] || 0) + 1;
          hasContent = true;
        }
      });
      if (hasContent) {
        filled++;
      } else {
        empty++;
      }
    });
    
    setStats({ total, filled, empty, languages: langStats });
  };

  // Set editing quote when date or language changes - PRESERVES ALL LANGUAGES
  useEffect(() => {
    if (!isInitialized && Object.keys(quotes).length > 0) {
      setIsInitialized(true);
    }
    
    const key = getDateKey(selectedDate);
    if (quotes[key]) {
      // Get the current language quote, but keep all other languages intact
      setEditingQuote(quotes[key][activeLang] || '');
    } else {
      setEditingQuote('');
    }
  }, [selectedDate, activeLang, quotes, getDateKey, isInitialized]);

  // Auto-focus textarea when editing
  useEffect(() => {
    if (textareaRef.current && editingQuote !== undefined) {
      textareaRef.current.focus();
    }
  }, [editingQuote]);

  // Handle language change - PRESERVES ALL DATA
  const handleLangChange = (lang) => {
    // Save current quote before switching if it has content
    if (editingQuote.trim() && quotes[getDateKey(selectedDate)]) {
      // Auto-save on language switch
      handleAutoSave();
    }
    setActiveLang(lang);
  };

  // Auto-save function
  const handleAutoSave = useCallback(async () => {
    const key = getDateKey(selectedDate);
    if (!editingQuote.trim()) return;
    
    try {
      const currentQuote = quotes[key] || {};
      // Update only the current language, preserve all others
      const updatedQuote = {
        ...currentQuote,
        [activeLang]: editingQuote.trim()
      };
      
      const updatedQuotes = {
        ...quotes,
        [key]: updatedQuote
      };
      
      setQuotes(updatedQuotes);
      updateStats(updatedQuotes);
      
      // Save to API
      await api.put(`/admin/quotes/${key}`, {
        quote: updatedQuote
      });
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }, [selectedDate, editingQuote, activeLang, quotes]);

  // Handle date change - PRESERVES ALL DATA
  const handleDateChange = (date) => {
    // Save current quote before switching if it has content
    if (editingQuote.trim() && quotes[getDateKey(selectedDate)]) {
      handleAutoSave();
    }
    setSelectedDate(date);
  };

  // Save quote for a specific date - PRESERVES ALL LANGUAGES
  const handleSaveQuote = async () => {
    if (!editingQuote.trim()) {
      showToast('Please enter a quote', 'error');
      return;
    }

    if (isSaving) return;

    setIsSaving(true);
    setLoading(true);
    
    try {
      const key = getDateKey(selectedDate);
      const currentQuote = quotes[key] || {};
      
      // IMPORTANT: Update ONLY the current language, preserve all others
      const updatedQuote = {
        ...currentQuote,
        [activeLang]: editingQuote.trim()
      };
      
      // Keep all existing language data, only update the current one
      const updatedQuotes = {
        ...quotes,
        [key]: updatedQuote
      };
      
      // Update via API
      const response = await api.put(`/admin/quotes/${key}`, {
        quote: updatedQuote
      });
      
      if (response.data.success) {
        setQuotes(updatedQuotes);
        updateStats(updatedQuotes);
        showToast(`Quote saved in ${activeLang.toUpperCase()}`, 'success');
      }
    } catch (error) {
      console.error('Save quote error:', error);
      showToast(error.response?.data?.message || 'Failed to save quote', 'error');
    } finally {
      setLoading(false);
      setIsSaving(false);
    }
  };

  // Copy quote from English to current language
  const handleCopyFromEnglish = () => {
    const key = getDateKey(selectedDate);
    if (quotes[key] && quotes[key].en) {
      setEditingQuote(quotes[key].en);
      showToast('Copied from English', 'success');
    } else {
      showToast('No English quote available to copy', 'warning');
    }
  };

  // Delete quote for a specific date - REMOVES ENTIRE DAY'S QUOTE
  const handleDeleteQuote = async () => {
    if (!window.confirm('Delete all quotes for this date? This will remove all language versions.')) return;
    
    const key = getDateKey(selectedDate);
    try {
      const response = await api.delete(`/admin/quotes/${key}`);
      if (response.data.success) {
        const updatedQuotes = { ...quotes };
        delete updatedQuotes[key];
        setQuotes(updatedQuotes);
        updateStats(updatedQuotes);
        setEditingQuote('');
        showToast('Quote deleted', 'success');
      }
    } catch (error) {
      console.error('Delete quote error:', error);
      showToast('Failed to delete quote', 'error');
    }
  };

  // Generate quotes for the year
  const handleGenerateQuotes = async () => {
    if (!window.confirm('Generate quotes for the next 365 days? Existing quotes will be kept.')) return;
    
    setLoading(true);
    try {
      const response = await api.post('/admin/quotes/generate');
      if (response.data.success) {
        await fetchQuotes();
        showToast(`Generated ${response.data.data.generated} new quotes`, 'success');
      }
    } catch (error) {
      console.error('Generate quotes error:', error);
      showToast('Failed to generate quotes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to previous/next day
  const navigateDay = (direction) => {
    // Save current quote before navigating
    if (editingQuote.trim() && quotes[getDateKey(selectedDate)]) {
      handleAutoSave();
    }
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  // Navigate to today
  const goToToday = () => {
    // Save current quote before navigating
    if (editingQuote.trim() && quotes[getDateKey(selectedDate)]) {
      handleAutoSave();
    }
    setSelectedDate(new Date());
  };

  // Format date display
  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Get quote of the day for display
  const getQuoteOfDay = () => {
    if (quotes[todayKey]) {
      return quotes[todayKey][activeLang] || quotes[todayKey].en || 'No quote for today';
    }
    return 'No quote for today';
  };

  // Get all quotes for the current month with caching
  const getMonthQuotes = useCallback(() => {
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    const result = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const key = getDateKey(date);
      if (quotes[key]) {
        const quoteData = quotes[key];
        const hasAllLanguages = languages.every(lang => 
          quoteData[lang.code] && quoteData[lang.code].trim()
        );
        result.push({
          date: key,
          day,
          quote: quoteData[activeLang] || quoteData.en || '',
          original: quoteData.en || '',
          hasAllLanguages,
          languages: languages.map(lang => ({
            code: lang.code,
            hasContent: !!(quoteData[lang.code] && quoteData[lang.code].trim())
          })),
        });
      } else {
        result.push({
          date: key,
          day,
          quote: '',
          original: '',
          hasAllLanguages: false,
          empty: true,
          languages: languages.map(lang => ({ code: lang.code, hasContent: false })),
        });
      }
    }
    return result;
  }, [selectedDate, quotes, activeLang, getDateKey]);

  // Update month quotes cache when quotes or selected date changes
  useEffect(() => {
    setMonthQuotesCache(getMonthQuotes());
  }, [getMonthQuotes]);

  // Search quotes
  const getFilteredQuotes = () => {
    const entries = Object.entries(quotes);
    if (!searchTerm.trim()) return entries;
    
    const search = searchTerm.toLowerCase();
    return entries.filter(([key, value]) => {
      const quoteText = (value[activeLang] || value.en || '').toLowerCase();
      return quoteText.includes(search) || key.includes(search);
    });
  };

  const filteredQuotes = getFilteredQuotes();

  // Check if a quote exists for a date
  const hasQuoteForDate = (dateKey) => {
    return !!quotes[dateKey];
  };

  // Get quote preview for a date
  const getQuotePreview = (dateKey) => {
    const quote = quotes[dateKey];
    if (!quote) return '';
    return quote[activeLang] || quote.en || '';
  };

  // Get language completion status for a date
  const getLanguageStatus = (dateKey) => {
    const quote = quotes[dateKey];
    if (!quote) return { total: 0, filled: 0 };
    
    let filled = 0;
    languages.forEach(lang => {
      if (quote[lang.code] && quote[lang.code].trim()) {
        filled++;
      }
    });
    return { total: languages.length, filled };
  };

  // Check if all languages have content
  const hasAllLanguages = (dateKey) => {
    const status = getLanguageStatus(dateKey);
    return status.filled === status.total;
  };

  if (!isInitialized && loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#7A0000] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading quotes...</p>
        </div>
      </div>
    );
  }

  // Get language completion for current date
  const currentDateKey = getDateKey(selectedDate);
  const langStatus = getLanguageStatus(currentDateKey);

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs">Total Quotes</div>
          <div className="text-xl sm:text-2xl font-bold text-[#7A0000]">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs">Filled</div>
          <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.filled}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs">Empty</div>
          <div className="text-xl sm:text-2xl font-bold text-gray-400">{stats.empty}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs">Coverage</div>
          <div className="text-xl sm:text-2xl font-bold text-blue-600">
            {stats.total > 0 ? Math.round((stats.filled / stats.total) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Language Stats Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
            <Languages size={14} /> Language Coverage:
          </span>
          {languages.map(lang => {
            const count = stats.languages[lang.code] || 0;
            const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <div key={lang.code} className="flex items-center gap-1.5">
                <span className="text-sm">{lang.flag}</span>
                <span className="text-xs font-medium text-gray-700">{count}</span>
                <div className="w-12 sm:w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      percentage >= 80 ? 'bg-green-500' : 
                      percentage >= 50 ? 'bg-yellow-500' : 
                      'bg-red-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quote of the Day - Hero Quote */}
      <div className="bg-gradient-to-r from-[#7A0000] to-[#A00000] rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays size={18} className="text-marigold" />
          <span className="text-xs font-semibold text-marigold uppercase tracking-wider">Quote of the Day</span>
          <span className="ml-auto text-xs text-white/50">{formatDateDisplay(new Date())}</span>
        </div>
        <p className="font-serif text-lg md:text-xl leading-relaxed text-white/90">
          "{getQuoteOfDay()}"
        </p>
        <p className="text-xs text-white/40 mt-2">This quote is displayed on the homepage hero section</p>
      </div>

      {/* Main Editor */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#7A0000]/10 to-[#A00000]/5 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-[#7A0000]" />
            <h4 className="text-gray-700 font-semibold text-sm sm:text-base">Daily Quote Editor</h4>
            <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
              {Object.keys(quotes).length} quotes
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleGenerateQuotes}
              disabled={loading}
              className="px-2 sm:px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-1"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Generate 365</span>
              <span className="sm:hidden">Gen</span>
            </button>
            <button
              onClick={() => setShowAllQuotes(!showAllQuotes)}
              className="px-2 sm:px-3 py-1.5 bg-[#7A0000] text-white rounded-lg text-xs font-semibold hover:bg-[#5A0000] transition-all"
            >
              {showAllQuotes ? 'Hide' : 'View All'}
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* Date Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateDay(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={goToToday}
                className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  isToday(selectedDate) 
                    ? 'bg-[#7A0000] text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isToday(selectedDate) ? 'Today' : 'Go Today'}
              </button>
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {formatDateDisplay(selectedDate)}
              </span>
            </div>
            <button
              onClick={() => navigateDay(1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Language Switcher with completion indicator */}
          <div className="flex items-center justify-between mb-3">
            <LanguageSwitcher active={activeLang} onChange={handleLangChange} t={t} />
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">Languages:</span>
              <span className="font-medium text-gray-700">
                {langStatus.filled}/{langStatus.total}
              </span>
              {langStatus.filled === langStatus.total && langStatus.total > 0 && (
                <CheckCircle size={14} className="text-green-500" />
              )}
            </div>
          </div>

          {/* Language indicator for current date */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {languages.map(lang => {
              const hasContent = quotes[currentDateKey] && 
                quotes[currentDateKey][lang.code] && 
                quotes[currentDateKey][lang.code].trim();
              return (
                <div
                  key={lang.code}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                    hasContent 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                  } ${lang.code === activeLang ? 'ring-2 ring-[#7A0000]/30' : ''}`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.code.toUpperCase()}</span>
                  {hasContent && <CheckCircle size={10} className="text-green-500" />}
                </div>
              );
            })}
          </div>

          {/* Quote Input */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                Quote for {formatDateDisplay(selectedDate)}
                {hasQuoteForDate(currentDateKey) && (
                  <span className="text-green-600 text-[10px] font-normal flex items-center gap-0.5">
                    <CheckCircle size={12} />
                    Saved
                  </span>
                )}
              </label>
              {activeLang !== 'en' && (
                <button
                  onClick={handleCopyFromEnglish}
                  className="text-xs text-[#7A0000] hover:underline flex items-center gap-1"
                >
                  <Copy size={12} /> Copy from English
                </button>
              )}
            </div>
            <textarea
              ref={textareaRef}
              rows={4}
              value={editingQuote}
              onChange={(e) => setEditingQuote(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#7A0000] focus:ring-2 focus:ring-[#7A0000]/10 focus:outline-none transition-all text-sm bg-gray-50 hover:bg-white resize-none"
              placeholder={`Enter quote in ${languages.find(l => l.code === activeLang)?.label || activeLang}...`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.shiftKey) {
                  e.preventDefault();
                  handleSaveQuote();
                }
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{editingQuote.length} characters</span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    langStatus.filled === langStatus.total && langStatus.total > 0 
                      ? 'bg-green-500' 
                      : langStatus.filled > 0 
                      ? 'bg-yellow-500' 
                      : 'bg-gray-300'
                  }`} />
                  {langStatus.filled}/{langStatus.total} languages complete
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasQuoteForDate(currentDateKey) && (
                  <button
                    onClick={handleDeleteQuote}
                    className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-100 transition-all flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Delete All
                  </button>
                )}
                <button
                  onClick={handleSaveQuote}
                  disabled={isSaving || !editingQuote.trim()}
                  className="px-4 py-1.5 bg-[#7A0000] text-white rounded-lg text-xs font-semibold hover:bg-[#5A0000] transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Save {activeLang.toUpperCase()}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
            <button
              onClick={() => {
                const key = getDateKey(selectedDate);
                if (quotes[key]) {
                  setEditingQuote(quotes[key].en || '');
                }
              }}
              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-all"
            >
              Load English
            </button>
            <button
              onClick={() => {
                setEditingQuote('');
              }}
              className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-all"
            >
              Clear
            </button>
            <button
              onClick={() => {
                // Fill from English to all languages
                const key = getDateKey(selectedDate);
                if (quotes[key] && quotes[key].en) {
                  setEditingQuote(quotes[key].en);
                  showToast('Loaded English quote, you can edit and save for other languages', 'info');
                }
              }}
              className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-semibold hover:bg-purple-100 transition-all"
            >
              <Languages size={12} className="inline mr-1" />
              Use for all
            </button>
          </div>
        </div>
      </div>

      {/* Month Calendar View */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#7A0000]/10 to-[#A00000]/5 px-4 sm:px-6 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-gray-700 font-semibold text-sm flex items-center gap-2">
            <Calendar size={16} className="text-[#7A0000]" />
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} 
            <span className="text-xs text-gray-400 font-normal">
              ({monthQuotesCache.filter(q => !q.empty).length} quotes)
            </span>
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setSelectedDate(newDate);
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="text-xs text-[#7A0000] font-medium hover:underline"
            >
              Today
            </button>
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setSelectedDate(newDate);
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="p-4">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
              <div key={i} className="text-center text-[10px] font-semibold text-gray-400 py-1">
                {day}
              </div>
            ))}
            {(() => {
              const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();
              const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
              const cells = [];
              
              for (let i = 0; i < firstDay; i++) {
                cells.push(<div key={`empty-${i}`} className="aspect-square" />);
              }
              
              for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
                const key = getDateKey(date);
                const hasQuote = !!quotes[key];
                const isTodayQuote = key === todayKey;
                const isSelected = date.getDate() === selectedDate.getDate() &&
                  date.getMonth() === selectedDate.getMonth() &&
                  date.getFullYear() === selectedDate.getFullYear();
                
                // Check language completion for this date
                const status = getLanguageStatus(key);
                const allComplete = status.filled === status.total && status.total > 0;
                const partial = status.filled > 0 && status.filled < status.total;
                
                cells.push(
                  <button
                    key={day}
                    onClick={() => {
                      // Save current quote before switching
                      if (editingQuote.trim() && quotes[getDateKey(selectedDate)]) {
                        handleAutoSave();
                      }
                      const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
                      setSelectedDate(d);
                    }}
                    className={`aspect-square rounded-lg text-xs font-medium transition-all flex items-center justify-center relative ${
                      isSelected
                        ? 'bg-[#7A0000] text-white shadow-lg'
                        : isTodayQuote
                        ? 'bg-[#7A0000]/10 text-[#7A0000] border border-[#7A0000]/20'
                        : hasQuote
                        ? 'bg-green-50 text-gray-700 hover:bg-green-100'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={hasQuote ? getQuotePreview(key) : 'No quote'}
                  >
                    {day}
                    {hasQuote && !isSelected && !isTodayQuote && (
                      <div className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${
                        allComplete ? 'bg-green-500' : partial ? 'bg-yellow-500' : 'bg-blue-300'
                      }`} />
                    )}
                  </button>
                );
              }
              return cells;
            })()}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span>All languages</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span>Partial</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-300" />
              <span>Has quote</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              <span>Empty</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-2.5 h-2.5 rounded-full bg-[#7A0000]" />
              <span>Selected</span>
            </div>
          </div>
        </div>
      </div>

      {/* All Quotes View */}
      {showAllQuotes && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#7A0000]/10 to-[#A00000]/5 px-4 sm:px-6 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-gray-700 font-semibold text-sm">
              All Quotes ({Object.keys(quotes).length})
            </h4>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search quotes..."
                className="px-3 py-1.5 pl-8 border border-gray-200 rounded-lg text-sm focus:border-[#7A0000] focus:outline-none w-full sm:w-auto"
              />
              <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
            </div>
          </div>
          <div className="p-4 max-h-[28rem] overflow-y-auto scrollbar-hide">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 text-left text-[10px] uppercase tracking-wider text-ink-soft z-10">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Date</th>
                  <th className="px-3 py-2.5 font-semibold">Quote</th>
                  <th className="px-3 py-2.5 font-semibold text-center">EN</th>
                  <th className="px-3 py-2.5 font-semibold text-center">NE</th>
                  <th className="px-3 py-2.5 font-semibold text-center">HI</th>
                  <th className="px-3 py-2.5 font-semibold text-center">ZH</th>
                  <th className="px-3 py-2.5 font-semibold text-center">TA</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400 text-sm">
                      No quotes found
                    </td>
                  </tr>
                ) : (
                  filteredQuotes
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([dateKey, quoteData]) => {
                      const date = new Date(dateKey);
                      const isTodayQuote = dateKey === todayKey;
                      const quoteText = quoteData[activeLang] || quoteData.en || 'No quote';
                      const status = getLanguageStatus(dateKey);
                      const allComplete = status.filled === status.total && status.total > 0;
                      const partial = status.filled > 0 && status.filled < status.total;

                      return (
                        <tr
                          key={dateKey}
                          onClick={() => {
                            const d = new Date(dateKey);
                            if (editingQuote.trim() && quotes[getDateKey(selectedDate)]) {
                              handleAutoSave();
                            }
                            setSelectedDate(d);
                            setShowAllQuotes(false);
                          }}
                          className={`hover:bg-gray-50 transition-colors cursor-pointer ${isTodayQuote ? 'bg-[#7A0000]/5' : ''}`}
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-gray-400">{dateKey}</span>
                              {isTodayQuote && (
                                <span className="text-[9px] font-bold text-[#7A0000] bg-[#7A0000]/10 px-1.5 py-0.5 rounded-full">
                                  Today
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 max-w-[220px]">
                            <span className="text-xs text-gray-700 line-clamp-2">{quoteText}</span>
                          </td>
                          {languages.map((lang) => {
                            const hasContent = quoteData[lang.code] && quoteData[lang.code].trim();
                            return (
                              <td key={lang.code} className="px-3 py-2.5 text-center">
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                                    hasContent ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-300'
                                  }`}
                                  title={`${lang.label}: ${hasContent ? '✓' : '✗'}`}
                                >
                                  {hasContent ? <CheckCircle size={13} /> : <X size={13} />}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-3 py-2.5">
                            {allComplete ? (
                              <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-semibold">
                                All Complete
                              </span>
                            ) : partial ? (
                              <span className="text-[10px] text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full font-semibold">
                                Partial
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full font-semibold">
                                Empty
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 text-sm mt-0.5">💡</div>
          <div>
            <p className="text-sm font-semibold text-blue-700">How it works:</p>
            <ul className="text-xs text-blue-600 mt-1 space-y-0.5 list-disc list-inside">
              <li>Each day has its own quote that automatically shows on the homepage</li>
              <li><strong>All 5 languages are preserved</strong> - switching languages doesn't delete other translations</li>
              <li>Edit each language individually using the language switcher</li>
              <li>Use "Copy from English" to quickly duplicate quotes</li>
              <li>Green dot = all languages complete, Yellow dot = partial, Blue dot = has quote</li>
              <li>Quotes change daily based on the date</li>
              <li>Click "Generate 365" to create quotes for the entire year</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Hide scrollbar styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          width: 0;
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default AdminQuote;