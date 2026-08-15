import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Bot, User, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useChatbot } from '../../context/ChatbotContext';

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

  const [showSuggestions, setShowSuggestions] = useState(true);
  const [settings, setSettings] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const inputRef = useRef(null);
  const chatWindowRef = useRef(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle scroll events for visibility and footer detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Check if footer is visible (bottom of page)
      const bottomThreshold = 150;
      const isFooterVisible = scrollY + windowHeight < documentHeight - bottomThreshold;
      setIsFooterVisible(isFooterVisible);
      
      // Hide on scroll down, show on scroll up
      if (scrollY > lastScrollY && scrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
    if (inputValue.trim()) {
      setShowSuggestions(false);
      sendMessage(inputValue);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
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

  // Don't show if footer is NOT visible (at bottom) or not visible (scrolled down)
  if (!isFooterVisible || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Mini Chat Button */}
      <button
        onClick={toggleChat}
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
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        aria-label={t('templeAssistant')}
      >
        <div className="relative">
          <MessageCircle size={isMobile ? 20 : 28} color="white" strokeWidth={2} />
        </div>
      </button>

      {/* Chat Window */}
      <div
        ref={chatWindowRef}
        key={lang}
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
          className="flex items-center justify-between px-3 py-2 flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #7A1F2B 0%, #5B1420 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* Logo from settings - mini size */}
            <div className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden`}>
              {logoPhoto ? (
                <img 
                  src={logoPhoto} 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full rounded-full bg-gradient-to-br ${logoBgColor} flex items-center justify-center text-white font-bold ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                  ॐ
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h4 className={`text-white font-semibold ${isMobile ? 'text-[11px]' : 'text-xs'} truncate max-w-[80px] sm:max-w-[120px]`}>
                {logoText.length > 15 ? logoText.substring(0, 13) + '...' : logoText}
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Delete/Clear All Messages Button */}
            {messages.length > 1 && (
              <button
                onClick={handleClearAll}
                className="text-white/70 hover:text-red-400 transition-colors p-1 hover:bg-white/10 rounded-full"
                aria-label={t('clearAll') || 'Clear all messages'}
                title={t('clearAll') || 'Clear all messages'}
              >
                <Trash2 size={isMobile ? 13 : 14} />
              </button>
            )}
            {/* Close button */}
            <button
              onClick={closeChat}
              className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
              aria-label={t('close')}
            >
              <X size={isMobile ? 15 : 16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/50" style={{ maxHeight: isMobile ? '260px' : '340px' }}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-maroon to-maroon-deep text-white'
                    : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-1.5">
                  {message.sender === 'bot' && (
                    <Bot size={isMobile ? 11 : 12} className="text-maroon mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`${isMobile ? 'text-[11px]' : 'text-xs'} whitespace-pre-wrap leading-relaxed break-words`}>
                      {message.text}
                    </p>
                    <span className={`text-[7px] mt-0.5 block ${
                      message.sender === 'user' ? 'text-white/60' : 'text-gray-400'
                    }`}>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  {message.sender === 'user' && (
                    <User size={isMobile ? 11 : 12} className="text-white/60 mt-0.5 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions - Show fewer on mobile */}
          {suggestions.length > 0 && !isTyping && messages.length > 1 && (
            <div className="mt-1.5">
              <p className="text-[8px] text-gray-400 mb-1.5 flex items-center gap-1">
                {t('suggestions')}:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.slice(0, isMobile ? 3 : 4).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`${isMobile ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-2.5 py-1'} bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-maroon hover:text-white hover:border-maroon transition-all duration-200 shadow-sm`}
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
        <div className="p-2 border-t border-gray-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('typeMessage') || t('askMe')}
              className={`flex-1 ${isMobile ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-1.5 text-xs'} bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-maroon focus:ring-1 focus:ring-maroon/20 transition-all min-w-0`}
              dir={lang === 'hi' || lang === 'ne' || lang === 'ta' ? 'auto' : 'ltr'}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className={`p-1.5 rounded-full transition-all duration-200 flex-shrink-0 ${
                inputValue.trim()
                  ? 'bg-maroon text-white hover:bg-maroon-deep shadow-md shadow-maroon/25'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              aria-label={t('send')}
            >
              <Send size={isMobile ? 13 : 14} />
            </button>
          </div>
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
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce {
          animation: bounce 0.6s infinite;
        }

        /* Mobile specific styles */
        @media (max-width: 640px) {
          .chatbot-window {
            bottom: 80px !important;
            right: 12px !important;
            width: calc(100vw - 24px) !important;
            height: 400px !important;
            max-height: calc(100vh - 100px) !important;
            border-radius: 16px !important;
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