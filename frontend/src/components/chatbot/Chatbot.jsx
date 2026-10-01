import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Bot, User, Trash2, Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useChatbot } from '../../context/ChatbotContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useHeroInView from '../../hooks/useHeroInView';

const Chatbot = () => {
  const {
    isOpen,
    toggleChat,
    closeChat,
    messages,
    sendMessage,
    isTyping,
    inputValue,
    setInputValue,
    suggestions,
    handleSuggestionClick,
    messagesEndRef,
    getTranslation,
    lang,
    clearAllMessages,
  } = useChatbot();

  const [settings, setSettings] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  /*
   * The launcher is visible across the whole site. It steps aside for two
   * regions only, both of which own the full width of the screen:
   *   - the footer, which is dense with its own links and controls
   *   - the hero video, where a floating button sits on top of the temple name
   *
   * Both are detected with IntersectionObserver rather than scroll maths, so
   * the decision costs nothing on the scroll path.
   */
  const [footerInView, setFooterInView] = useState(false);
  /*
   * The hero banner. Uses the shared hook because this component mounts above
   * the router outlet while the page is lazy-loaded — a plain querySelector on
   * mount finds no hero and the observer never attaches.
   */
  const heroInView = useHeroInView('any');
  const inputRef = useRef(null);
  const chatWindowRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /*
   * Step aside for the footer and the hero video.
   *
   * Previously the launcher only rendered near the bottom of the page: a local
   * flag was set from a scroll-position calculation, so on any screen taller
   * than the viewport the button was invisible for almost the entire journey
   * and appeared only once the footer came into reach. It was also hidden
   * while scrolling down, which meant it was hidden most of the time.
   *
   * Now it is visible everywhere except the two full-width regions noted
   * above. IntersectionObserver answers this off the main thread and only wakes
   * us when the answer changes, so there is no scroll listener here at all.
   */
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setFooterInView(entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px -40px 0px' }
    );

    const footer = document.querySelector('footer');
    if (footer) observer.observe(footer);

    return () => observer.disconnect();
  }, []);

  // Fetch admin settings for logo
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/admin/settings');
        setSettings(response.data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const t = (key) => {
    if (typeof getTranslation === 'function') {
      return getTranslation(key);
    }
    return key;
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeChat();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeChat]);

  const handleSend = () => {
    if (!isAuthenticated()) {
      showToast(t('loginRequired') || 'Please login to use the assistant', 'warning');
      closeChat();
      navigate('/login');
      return;
    }
    if (inputValue.trim()) {
      sendMessage(inputValue);
    }
  };

  const handleOpenChat = () => {
    if (!isAuthenticated()) {
      showToast(t('loginRequired') || 'Please login to use the assistant', 'warning');
      navigate('/login');
      return;
    }
    toggleChat();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Clear all messages without confirmation
  const handleClearAll = () => {
    clearAllMessages();
  };

  // Get logo from settings
  const logoPhoto = settings?.logo?.photo || null;
  const logoText = settings?.logo?.text?.[lang] || 'Shree Ramchandra Temple';
  const logoSettings = settings?.logo || {};
  const logoBgColor = logoSettings.bgColor || 'from-vermilion to-maroon-deep';

  /*
   * Logged-out visitors do not get the assistant.
   *
   * The launcher is otherwise visible on every page, hiding only where the
   * footer or a hero video is on screen. An already-open chat stays mounted so
   * it is not yanked away mid-conversation if the page scrolls.
   */
  if (!isAuthenticated() || (footerInView && !isOpen) || (heroInView && !isOpen)) {
    return null;
  }

  return (
    <>
      {/* Mini Chat Button - original placement */}
      <button
        onClick={handleOpenChat}
        className={`fixed z-50 transition-all duration-300 ${
          isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}
        style={{
          bottom: isMobile ? '16px' : '24px',
          right: isMobile ? '12px' : '24px',
          width: isMobile ? '48px' : '56px',
          height: isMobile ? '48px' : '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7A1F2B 0%, #5B1420 100%)',
          boxShadow: '0 6px 24px rgba(122, 31, 43, 0.35)',
          border: '2px solid rgba(232, 169, 61, 0.45)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        aria-label={t('templeAssistant')}
      >
        <div className="relative">
          <MessageCircle size={isMobile ? 20 : 28} color="#FFD9A0" strokeWidth={2.2} />
        </div>
      </button>

      {/* Chat Window - original structure & placement */}
      <div
        key={lang}
        ref={chatWindowRef}
        className={`fixed z-50 transition-all duration-400 ease-in-out ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-10 scale-95 pointer-events-none'
        }`}
        style={{
          bottom: isMobile ? '80px' : '90px',
          right: isMobile ? '12px' : '24px',
          width: isMobile ? 'calc(100vw - 24px)' : '360px',
          maxWidth: isMobile ? 'calc(100vw - 24px)' : 'calc(100vw - 32px)',
          height: isMobile ? '400px' : '480px',
          maxHeight: isMobile ? 'calc(100vh - 100px)' : 'calc(100vh - 110px)',
          background: 'white',
          borderRadius: isMobile ? '16px' : '20px',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(122, 31, 43, 0.12)',
        }}
      >
        {/* Header with Logo */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0 relative overflow-hidden"
          style={{
            background: 'linear-gradient(120deg, #7A1F2B 0%, #5B1420 70%, #3D0D15 100%)',
          }}
        >
            {/* subtle decorative shine */}
            <div
              className="absolute -top-10 -right-8 w-28 h-28 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(232,169,61,0.35) 0%, transparent 70%)' }}
            />
            <div className="flex items-center gap-2.5 min-w-0 relative z-10">
              {/* Logo from settings - mini size */}
              <div
                className={`${isMobile ? 'w-8 h-8' : 'w-9 h-9'} rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-marigold/60`}
              >
                {logoPhoto ? (
                  <img
                    src={logoPhoto}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full rounded-full bg-gradient-to-br ${logoBgColor} flex items-center justify-center text-white font-bold ${isMobile ? 'text-[11px]' : 'text-sm'}`}>
                    ॐ
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className={`text-white font-semibold ${isMobile ? 'text-xs' : 'text-sm'} truncate max-w-[100px] sm:max-w-[150px] leading-tight`}>
                    {logoText.length > 16 ? logoText.substring(0, 14) + '...' : logoText}
                  </h4>
                  <Sparkles size={isMobile ? 11 : 12} className="text-marigold flex-shrink-0" />
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[9px] text-white/70 tracking-wide">
                    {t('online') || 'Online'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 relative z-10">
              {/* Delete/Clear All Messages Button */}
              {messages.length > 1 && (
                <button
                  onClick={handleClearAll}
                  className="text-white/70 hover:text-red-400 transition-colors p-1.5 hover:bg-white/10 rounded-full"
                  aria-label={t('clearAll') || 'Clear all messages'}
                  title={t('clearAll') || 'Clear all messages'}
                >
                  <Trash2 size={isMobile ? 14 : 15} />
                </button>
              )}
              {/* Close button */}
              <button
                onClick={closeChat}
                className="text-white/70 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full"
                aria-label={t('close')}
              >
                <X size={isMobile ? 16 : 17} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 scroll-hidden"
            style={{
              maxHeight: isMobile ? '260px' : '340px',
              background: 'linear-gradient(180deg, #FFF8F1 0%, #FBF6EF 100%)',
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-chat-bubble`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-br from-maroon to-maroon-deep text-white shadow-md shadow-maroon/25 rounded-br-md'
                      : 'bg-white border border-maroon/10 text-gray-800 shadow-sm rounded-bl-md'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.sender === 'bot' && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'linear-gradient(135deg, #7A1F2B, #C1440E)' }}
                      >
                        <Bot size={11} className="text-white" />
                      </div>
                    )}
                    <div>
                      <p className={`${isMobile ? 'text-[11px]' : 'text-xs'} whitespace-pre-wrap leading-relaxed break-words ${message.sender === 'user' ? 'font-medium' : ''}`}>
                        {message.text}
                      </p>
                      <span className={`text-[7px] mt-1 block ${
                        message.sender === 'user' ? 'text-white/60' : 'text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    {message.sender === 'user' && (
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User size={11} className="text-white/80" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start animate-chat-bubble">
                <div className="bg-white border border-maroon/10 rounded-2xl rounded-bl-md px-3.5 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="chatbot-typing-dot" style={{ animationDelay: '0ms' }}></span>
                    <span className="chatbot-typing-dot" style={{ animationDelay: '150ms' }}></span>
                    <span className="chatbot-typing-dot" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions - Show fewer on mobile */}
            {suggestions.length > 0 && !isTyping && messages.length > 1 && (
              <div className="mt-2">
                <p className="text-[8px] text-gray-400 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                  {t('suggestions') || 'Suggested questions'}:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.slice(0, isMobile ? 3 : 4).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`${isMobile ? 'text-[9px] px-2.5 py-1' : 'text-[10px] px-3 py-1.5'} bg-white border border-maroon/15 rounded-full text-maroon hover:text-white hover:border-transparent transition-all duration-200 shadow-sm relative overflow-hidden`}
                      style={{
                        backgroundImage: 'linear-gradient(135deg, #7A1F2B 0%, #5B1420 100%)',
                        backgroundSize: '0% 100%',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'left center',
                        transition: 'background-size 0.3s ease, color 0.3s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundSize = '100% 100%'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundSize = '0% 100%'; e.currentTarget.style.color = '#7A1F2B'; }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-maroon/10 bg-white/80 backdrop-blur flex-shrink-0" style={{ borderTop: '1px solid rgba(122,31,43,0.08)' }}>
            {isAuthenticated() ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none opacity-60"
                    style={{ background: 'linear-gradient(90deg, rgba(232,169,61,0.15), rgba(122,31,43,0.12), rgba(232,169,61,0.15))', filter: 'blur(0px)' }}
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t('typeMessage') || t('askMe')}
                    className={`relative w-full ${isMobile ? 'px-3 py-2 text-[11px]' : 'px-3.5 py-2.5 text-xs'} bg-transparent border border-maroon/15 rounded-full focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition-all min-w-0 text-gray-800`}
                    dir={lang === 'hi' || lang === 'ne' || lang === 'ta' ? 'auto' : 'ltr'}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className={`p-2.5 rounded-full transition-all duration-200 flex-shrink-0 ${
                    inputValue.trim()
                      ? 'text-white shadow-md shadow-maroon/30 hover:scale-105 active:scale-95'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  style={inputValue.trim() ? { background: 'linear-gradient(135deg, #7A1F2B 0%, #5B1420 100%)' } : undefined}
                  aria-label={t('send')}
                >
                  <Send size={isMobile ? 14 : 15} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { closeChat(); navigate('/login'); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-maroon/10 text-maroon text-xs font-semibold hover:bg-maroon hover:text-white transition-all border border-maroon/15"
              >
<Lock size={14} />
                {t('loginToChat') || 'Login to chat with the assistant'}
              </button>
            )}
          </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease forwards;
        }

        /* Mobile specific styles */
        @media (max-width: 640px) {
          .chatbot-window {
            bottom: 80px !important;
            right: 12px !important;
            width: calc(100vw - 24px) !important;
            height: 400px !important;
            max-height: calc(100vh - 100px) !important;
          }
          
          .chatbot-button {
            bottom: 16px !important;
            right: 12px !important;
            width: 48px !important;
            height: 48px !important;
          }
          
          .chatbot-button svg {
            width: 20px !important;
            height: 20px !important;
          }
        }
      `}</style>
    </>
  );
};

export default Chatbot;