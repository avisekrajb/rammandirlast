import React, { createContext, useState, useContext, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from './LanguageContext';
import chatbotData from '../data/chatbotData.json';

// Translations for chatbot
const translations = {
  en: {
    greeting: "🕉 Jai Shree Ram! How can I help you today?",
    placeholder: "Ask about temple, events, team...",
    online: "Online",
    suggestions: "Suggested questions:",
    welcome: "Welcome to Shree Ramchandra Temple",
    templeAssistant: "Temple Assistant",
    typing: "Typing...",
    send: "Send",
    close: "Close",
    clearAll: "Clear all messages",
    clearConfirm: "Are you sure you want to clear all messages?",
    noResults: "I'm not sure about",
    hereAreTopics: "Here are some topics I can help with:",
    foundInfo: "I found this about",
    contactInfo: "Contact Information",
    donationInfo: "Donation Information",
    bookingInfo: "Booking Information",
    teamMembers: "Team Members",
    ourTeam: "Our Team Members",
    upcomingEvents: "Upcoming Events",
    templeHours: "Temple Darshan Hours",
    location: "Location",
    address: "Address",
    phone: "Phone",
    email: "Email",
    founder: "Founder",
    aboutTemple: "About Temple",
    askMe: "Ask about temple, events, team...",
    methods: "Methods",
    contact: "Contact",
    typeMessage: "Type a message...",
  },
  ne: {
    greeting: "🕉 जय श्री राम! आज म कसरी सहायता गर्न सक्छु?",
    placeholder: "मन्दिर, कार्यक्रम, टोलीको बारेमा सोध्नुहोस्...",
    online: "अनलाइन",
    suggestions: "सुझाव प्रश्नहरू:",
    welcome: "श्री रामचन्द्र मन्दिरमा स्वागत छ",
    templeAssistant: "मन्दिर सहायक",
    typing: "टाइप गर्दै...",
    send: "पठाउनुहोस्",
    close: "बन्द गर्नुहोस्",
    clearAll: "सबै सन्देश मेटाउनुहोस्",
    clearConfirm: "के तपाईं सबै सन्देश मेटाउन निश्चित हुनुहुन्छ?",
    noResults: "मलाई थाहा छैन",
    hereAreTopics: "यहाँ केही विषयहरू छन् जसमा म सहायता गर्न सक्छु:",
    foundInfo: "मैले यो बारेमा फेला पारे",
    contactInfo: "सम्पर्क जानकारी",
    donationInfo: "दान जानकारी",
    bookingInfo: "बुकिङ जानकारी",
    teamMembers: "टोली सदस्यहरू",
    ourTeam: "हाम्रो टोली सदस्यहरू",
    upcomingEvents: "आगामी कार्यक्रमहरू",
    templeHours: "मन्दिर दर्शन समय",
    location: "स्थान",
    address: "ठेगाना",
    phone: "फोन",
    email: "इमेल",
    founder: "संस्थापक",
    aboutTemple: "मन्दिरको बारेमा",
    askMe: "मन्दिर, कार्यक्रम, टोलीको बारेमा सोध्नुहोस्...",
    methods: "विधिहरू",
    contact: "सम्पर्क",
    typeMessage: "सन्देश टाइप गर्नुहोस्...",
  },
  hi: {
    greeting: "🕉 जय श्री राम! आज मैं कैसे सहायता कर सकता हूँ?",
    placeholder: "मंदिर, कार्यक्रम, टीम के बारे में पूछें...",
    online: "ऑनलाइन",
    suggestions: "सुझाव प्रश्न:",
    welcome: "श्री रामचंद्र मंदिर में आपका स्वागत है",
    templeAssistant: "मंदिर सहायक",
    typing: "टाइप कर रहे हैं...",
    send: "भेजें",
    close: "बंद करें",
    clearAll: "सभी संदेश हटाएं",
    clearConfirm: "क्या आप सभी संदेश हटाना चाहते हैं?",
    noResults: "मुझे नहीं पता",
    hereAreTopics: "यहाँ कुछ विषय हैं जिनमें मैं सहायता कर सकता हूँ:",
    foundInfo: "मुझे इसके बारे में मिला",
    contactInfo: "संपर्क जानकारी",
    donationInfo: "दान जानकारी",
    bookingInfo: "बुकिंग जानकारी",
    teamMembers: "टीम सदस्य",
    ourTeam: "हमारी टीम के सदस्य",
    upcomingEvents: "आगामी कार्यक्रम",
    templeHours: "मंदिर दर्शन समय",
    location: "स्थान",
    address: "पता",
    phone: "फोन",
    email: "ईमेल",
    founder: "संस्थापक",
    aboutTemple: "मंदिर के बारे में",
    askMe: "मंदिर, कार्यक्रम, टीम के बारे में पूछें...",
    methods: "तरीके",
    contact: "संपर्क",
    typeMessage: "संदेश टाइप करें...",
  },
  zh: {
    greeting: "🕉 贾伊·什里·拉姆！今天我能如何帮助您？",
    placeholder: "询问有关寺庙、活动、团队的信息...",
    online: "在线",
    suggestions: "建议问题：",
    welcome: "欢迎来到什里·拉姆钱德拉寺庙",
    templeAssistant: "寺庙助手",
    typing: "正在输入...",
    send: "发送",
    close: "关闭",
    clearAll: "清除所有消息",
    clearConfirm: "您确定要清除所有消息吗？",
    noResults: "我不确定",
    hereAreTopics: "以下是我可以帮助您的一些主题：",
    foundInfo: "我找到了关于",
    contactInfo: "联系信息",
    donationInfo: "捐赠信息",
    bookingInfo: "预订信息",
    teamMembers: "团队成员",
    ourTeam: "我们的团队成员",
    upcomingEvents: "即将举行的活动",
    templeHours: "寺庙参观时间",
    location: "位置",
    address: "地址",
    phone: "电话",
    email: "电子邮件",
    founder: "创始人",
    aboutTemple: "关于寺庙",
    askMe: "询问有关寺庙、活动、团队的信息...",
    methods: "方法",
    contact: "联系",
    typeMessage: "输入消息...",
  },
  ta: {
    greeting: "🕉 ஜெய் ஸ்ரீ ராம்! இன்று நான் எவ்வாறு உதவ முடியும்?",
    placeholder: "கோவில், நிகழ்வுகள், குழு பற்றி கேளுங்கள்...",
    online: "இணையத்தில்",
    suggestions: "பரிந்துரைக்கப்பட்ட கேள்விகள்:",
    welcome: "ஸ்ரீ ராம்சந்திரா கோவிலுக்கு வரவேற்கிறோம்",
    templeAssistant: "கோவில் உதவியாளர்",
    typing: "தட்டச்சு செய்கிறது...",
    send: "அனுப்பு",
    close: "மூடு",
    clearAll: "அனைத்து செய்திகளையும் நீக்கு",
    clearConfirm: "அனைத்து செய்திகளையும் நீக்க விரும்புகிறீர்களா?",
    noResults: "எனக்கு தெரியவில்லை",
    hereAreTopics: "நான் உதவக்கூடிய சில தலைப்புகள் இங்கே:",
    foundInfo: "இதைப் பற்றி நான் கண்டுபிடித்தேன்",
    contactInfo: "தொடர்பு தகவல்",
    donationInfo: "நன்கொடை தகவல்",
    bookingInfo: "முன்பதிவு தகவல்",
    teamMembers: "குழு உறுப்பினர்கள்",
    ourTeam: "எங்கள் குழு உறுப்பினர்கள்",
    upcomingEvents: "வரவிருக்கும் நிகழ்வுகள்",
    templeHours: "கோவில் தரிசன நேரம்",
    location: "இருப்பிடம்",
    address: "முகவரி",
    phone: "தொலைபேசி",
    email: "மின்னஞ்சல்",
    founder: "நிறுவனர்",
    aboutTemple: "கோவில் பற்றி",
    askMe: "கோவில், நிகழ்வுகள், குழு பற்றி கேளுங்கள்...",
    methods: "முறைகள்",
    contact: "தொடர்பு",
    typeMessage: "செய்தியை தட்டச்சு செய்க...",
  }
};

// Create the context
const ChatbotContext = createContext();

// Custom hook to use the chatbot context
export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};

// Provider component
export const ChatbotProvider = ({ children }) => {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);

  // Get current language translations
  const getTranslation = useCallback((key) => {
    return translations[lang]?.[key] || translations.en[key] || key;
  }, [lang]);

  // Initialize messages when language changes
  useEffect(() => {
    const greeting = getTranslation('greeting');
    setMessages([
      {
        id: 1,
        text: greeting,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      }
    ]);
    setSuggestions([
      getTranslation('templeHours'),
      getTranslation('location'),
      getTranslation('donationInfo'),
      getTranslation('bookingInfo'),
      getTranslation('aboutTemple'),
      getTranslation('teamMembers'),
      getTranslation('upcomingEvents'),
      getTranslation('contactInfo')
    ]);
  }, [lang, getTranslation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Search through all data
  const searchData = (query) => {
    const results = [];
    const searchTerm = query.toLowerCase().trim();

    if (chatbotData.temple) {
      const temple = chatbotData.temple;
      if (temple.name?.toLowerCase().includes(searchTerm) || 
          temple.description?.toLowerCase().includes(searchTerm) ||
          temple.location?.toLowerCase().includes(searchTerm) ||
          temple.hours?.toLowerCase().includes(searchTerm)) {
        results.push({ type: 'temple', data: temple, relevance: 10 });
      }
    }

    if (chatbotData.team) {
      chatbotData.team.forEach(member => {
        const searchableText = `${member.name} ${member.role} ${member.bio} ${member.email} ${member.phone}`.toLowerCase();
        if (searchableText.includes(searchTerm)) {
          results.push({ type: 'team', data: member, relevance: 8 });
        }
      });
    }

    if (chatbotData.events) {
      chatbotData.events.forEach(event => {
        const searchableText = `${event.title} ${event.description} ${event.date} ${event.location}`.toLowerCase();
        if (searchableText.includes(searchTerm)) {
          results.push({ type: 'event', data: event, relevance: 7 });
        }
      });
    }

    if (chatbotData.faqs) {
      chatbotData.faqs.forEach(faq => {
        const searchableText = `${faq.question} ${faq.answer}`.toLowerCase();
        if (searchableText.includes(searchTerm)) {
          results.push({ type: 'faq', data: faq, relevance: 9 });
        }
      });
    }

    if (chatbotData.gallery) {
      chatbotData.gallery.forEach(item => {
        const searchableText = `${item.title} ${item.description} ${item.category}`.toLowerCase();
        if (searchableText.includes(searchTerm)) {
          results.push({ type: 'gallery', data: item, relevance: 5 });
        }
      });
    }

    if (chatbotData.donations) {
      const donation = chatbotData.donations;
      const searchableText = `${donation.info} ${donation.methods?.join(' ')} ${donation.contact}`.toLowerCase();
      if (searchableText.includes(searchTerm)) {
        results.push({ type: 'donation', data: donation, relevance: 8 });
      }
    }

    if (chatbotData.booking) {
      const booking = chatbotData.booking;
      const searchableText = `${booking.info} ${booking.contact}`.toLowerCase();
      if (searchableText.includes(searchTerm)) {
        results.push({ type: 'booking', data: booking, relevance: 8 });
      }
    }

    results.sort((a, b) => b.relevance - a.relevance);
    return results;
  };

  // Generate response based on query
  const generateResponse = (query) => {
    const searchResults = searchData(query);
    const queryLower = query.toLowerCase().trim();
    const trans = getTranslation;

    const greetings = ['hello', 'hi', 'hey', 'नमस्ते', 'नमस्कार', 'हैलो', '你好', 'வணக்கம்'];
    if (greetings.some(g => queryLower.includes(g))) {
      return {
        text: `${trans('greeting')}`,
        suggestions: [trans('templeHours'), trans('location'), trans('donationInfo'), trans('bookingInfo')]
      };
    }

    if (queryLower.includes('hour') || queryLower.includes('timing') || queryLower.includes('open') || 
        queryLower.includes('darshan') || queryLower.includes('समय') || queryLower.includes('时间') || queryLower.includes('நேரம்')) {
      return {
        text: `🕐 ${trans('templeHours')}:\n${chatbotData.temple?.hours || '5:00 AM - 10:00 PM (Daily)'}\n\n📍 ${trans('location')}: ${chatbotData.temple?.location || 'Gaushala, Kathmandu'}`,
        suggestions: [trans('location'), trans('upcomingEvents'), trans('bookingInfo')]
      };
    }

    if (queryLower.includes('location') || queryLower.includes('address') || queryLower.includes('where') ||
        queryLower.includes('स्थान') || queryLower.includes('पता') || queryLower.includes('位置') || queryLower.includes('இருப்பிடம்')) {
      return {
        text: `📍 ${trans('address')}: ${chatbotData.temple?.address || 'Battisputali, Gaushala, Kathmandu, Nepal'}\n\n📞 ${trans('phone')}: ${chatbotData.temple?.phone || '+977-1-4XXXXXX'}\n📧 ${trans('email')}: ${chatbotData.temple?.email || 'info@ramchandratemple.org.np'}`,
        suggestions: [trans('templeHours'), trans('upcomingEvents'), trans('donationInfo')]
      };
    }

    if (queryLower.includes('founder') || queryLower.includes('found') || queryLower.includes('patron') ||
        queryLower.includes('संस्थापक') || queryLower.includes('创始人') || queryLower.includes('நிறுவனர்')) {
      return {
        text: `🙏 ${trans('founder')}:\n${chatbotData.founder?.name || 'Late Mr. Sanak Singh Tandon Lahuri Chhetri'}\n\n${chatbotData.founder?.bio || 'Founder of Shri Ramchandra Temple'}`,
        suggestions: [trans('teamMembers'), trans('aboutTemple'), 'History']
      };
    }

    if (queryLower.includes('team') || queryLower.includes('member') || queryLower.includes('coordinator') ||
        queryLower.includes('टीम') || queryLower.includes('团队') || queryLower.includes('குழு')) {
      const teamMembers = chatbotData.team || [];
      if (teamMembers.length > 0) {
        let response = `👥 ${trans('ourTeam')}:\n\n`;
        teamMembers.forEach(member => {
          response += `🔹 ${member.name} - ${member.role}\n`;
          if (member.bio) response += `   ${member.bio}\n`;
          if (member.email) response += `   📧 ${member.email}\n`;
          if (member.phone) response += `   📞 ${member.phone}\n`;
          response += '\n';
        });
        return {
          text: response,
          suggestions: [trans('aboutTemple'), trans('upcomingEvents'), trans('contactInfo')]
        };
      }
    }

    if (queryLower.includes('donate') || queryLower.includes('donation') || queryLower.includes('support') ||
        queryLower.includes('दान') || queryLower.includes('捐赠') || queryLower.includes('நன்கொடை')) {
      const donation = chatbotData.donations || {};
      return {
        text: `💰 ${trans('donationInfo')}:\n${donation.info || 'Support the temple through donations.'}\n\n${trans('methods')}: ${donation.methods?.join(', ') || 'Bank Transfer, Cash, Online'}\n\n📞 ${trans('contact')}: ${donation.contact || 'info@ramchandratemple.org.np'}`,
        suggestions: [trans('bookingInfo'), trans('upcomingEvents'), trans('templeHours')]
      };
    }

    if (queryLower.includes('booking') || queryLower.includes('book') || queryLower.includes('reserve') ||
        queryLower.includes('बुकिंग') || queryLower.includes('预订') || queryLower.includes('முன்பதிவு')) {
      const booking = chatbotData.booking || {};
      return {
        text: `📋 ${trans('bookingInfo')}:\n${booking.info || 'Bookings available for temple events and ceremonies.'}\n\n📞 ${trans('contact')}: ${booking.contact || 'info@ramchandratemple.org.np'}`,
        suggestions: [trans('templeHours'), trans('location'), trans('donationInfo')]
      };
    }

    if (queryLower.includes('event') || queryLower.includes('festival') || queryLower.includes('celebration') ||
        queryLower.includes('कार्यक्रम') || queryLower.includes('活动') || queryLower.includes('நிகழ்வு')) {
      const events = chatbotData.events || [];
      if (events.length > 0) {
        let response = `🎉 ${trans('upcomingEvents')}:\n\n`;
        events.forEach(event => {
          response += `📌 ${event.title}\n`;
          if (event.date) response += `   📅 ${event.date}\n`;
          if (event.description) response += `   ${event.description}\n`;
          if (event.location) response += `   📍 ${event.location}\n`;
          response += '\n';
        });
        return {
          text: response,
          suggestions: [trans('templeHours'), trans('donationInfo'), trans('teamMembers')]
        };
      }
    }

    if (queryLower.includes('history') || queryLower.includes('story') || queryLower.includes('about') ||
        queryLower.includes('इतिहास') || queryLower.includes('历史') || queryLower.includes('வரலாறு')) {
      return {
        text: `🏛️ ${chatbotData.temple?.name || 'Shree Ramchandra Temple'}\n\n${chatbotData.temple?.description || 'A sacred Vaishnava temple dedicated to Lord Ram, Sita, and Lakshman, serving devotees for generations on the banks of the Bagmati River.'}`,
        suggestions: [trans('founder'), trans('teamMembers'), trans('upcomingEvents')]
      };
    }

    if (queryLower.includes('contact') || queryLower.includes('phone') || queryLower.includes('email') ||
        queryLower.includes('संपर्क') || queryLower.includes('联系') || queryLower.includes('தொடர்பு')) {
      return {
        text: `📞 ${trans('contactInfo')}:\n\n📍 ${trans('address')}: ${chatbotData.temple?.address || 'Battisputali, Gaushala, Kathmandu, Nepal'}\n📞 ${trans('phone')}: ${chatbotData.temple?.phone || '+977-1-4XXXXXX'}\n📧 ${trans('email')}: ${chatbotData.temple?.email || 'info@ramchandratemple.org.np'}`,
        suggestions: [trans('templeHours'), trans('location'), trans('donationInfo')]
      };
    }

    if (searchResults.length > 0) {
      const topResult = searchResults[0];
      let response = `🔍 ${trans('foundInfo')} "${query}":\n\n`;
      
      if (topResult.type === 'temple') {
        response += `🏛️ ${topResult.data.name}\n${topResult.data.description}\n📍 ${topResult.data.location}`;
      } else if (topResult.type === 'team') {
        response += `👤 ${topResult.data.name}\n📋 ${topResult.data.role}\n${topResult.data.bio || ''}`;
      } else if (topResult.type === 'event') {
        response += `🎉 ${topResult.data.title}\n📅 ${topResult.data.date}\n${topResult.data.description}`;
      } else if (topResult.type === 'faq') {
        response += `❓ ${topResult.data.question}\n💡 ${topResult.data.answer}`;
      } else {
        response += `📌 ${topResult.data.title || topResult.data.name || 'Found information'}`;
      }
      
      const suggestionMap = {
        temple: [trans('templeHours'), trans('location'), trans('upcomingEvents')],
        team: [trans('teamMembers'), trans('contactInfo'), trans('aboutTemple')],
        event: [trans('upcomingEvents'), trans('templeHours'), trans('bookingInfo')],
        faq: [trans('templeHours'), trans('donationInfo'), trans('location')],
        donation: [trans('donationInfo'), trans('bookingInfo'), trans('upcomingEvents')],
        booking: [trans('bookingInfo'), trans('templeHours'), trans('location')]
      };
      
      return {
        text: response,
        suggestions: suggestionMap[topResult.type] || [trans('templeHours'), trans('location'), trans('contactInfo')]
      };
    }

    return {
      text: `🙏 ${trans('noResults')} "${query}". ${trans('hereAreTopics')}\n\n• ${trans('templeHours')}\n• ${trans('location')}\n• ${trans('teamMembers')}\n• ${trans('upcomingEvents')}\n• ${trans('donationInfo')}\n• ${trans('bookingInfo')}\n• ${trans('contactInfo')}\n\n${trans('askMe')}`,
      suggestions: [trans('templeHours'), trans('teamMembers'), trans('upcomingEvents'), trans('donationInfo'), trans('contactInfo')]
    };
  };

  const sendMessage = (text) => {
    if (!text || !text.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateResponse(text.trim());
      const botMessage = {
        id: Date.now() + 1,
        text: response.text,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }
    }, 500 + Math.random() * 500);
  };

  // Clear all messages function
  const clearAllMessages = useCallback(() => {
    const greeting = getTranslation('greeting');
    setMessages([
      {
        id: 1,
        text: greeting,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      }
    ]);
    setSuggestions([
      getTranslation('templeHours'),
      getTranslation('location'),
      getTranslation('donationInfo'),
      getTranslation('bookingInfo'),
      getTranslation('aboutTemple'),
      getTranslation('teamMembers'),
      getTranslation('upcomingEvents'),
      getTranslation('contactInfo')
    ]);
  }, [getTranslation]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    sendMessage(suggestion);
  };

  const value = {
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
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
};

export default ChatbotContext;