import React, { createContext, useState, useContext, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import api from '../services/api';
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
    loginRequired: "Please login to use the temple assistant",
    loginToChat: "Login to chat with the assistant",
    developer: "This website and the temple assistant were developed by Abhishek Rajbanshi of zeroinfinitytechnology.",
    aartiInfo: "Aarti Schedule",
    galleryInfo: "Gallery & Videos",
    calendarInfo: "Festival Calendar",
    historyInfo: "Temple History",
    visitingInfo: "Visiting Guide",
    blogsInfo: "News & Blogs",
    privacyInfo: "Privacy Policy",
    termsInfo: "Terms & Conditions",
    related: "Related questions",
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
    loginRequired: "मन्दिर सहायक प्रयोग गर्न कृपया लगइन गर्नुहोस्",
    loginToChat: "सहायकसँग कुरा गर्न लगइन गर्नुहोस्",
    developer: "यो वेबसाइट र मन्दिर सहायक Abhishek Rajbanshi (zeroinfinitytechnology) द्वारा विकास गरिएको हो।",
    aartiInfo: "आरती तालिका",
    galleryInfo: "ग्यालरी र भिडियोहरू",
    calendarInfo: "चाडपर्व पात्रो",
    historyInfo: "मन्दिरको इतिहास",
    visitingInfo: "भ्रमण गाइड",
    blogsInfo: "समाचार र ब्लगहरू",
    privacyInfo: "गोपनीयता नीति",
    termsInfo: "सर्त र शर्तहरू",
    related: "सम्बन्धित प्रश्नहरू",
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
    loginRequired: "मंदिर सहायक का उपयोग करने के लिए कृपया लॉगिन करें",
    loginToChat: "सहायक से बात करने के लिए लॉगिन करें",
    developer: "इस वेबसाइट और मंदिर सहायक को Abhishek Rajbanshi (zeroinfinitytechnology) ने विकसित किया है।",
    aartiInfo: "आरती समय सारणी",
    galleryInfo: "गैलरी और वीडियो",
    calendarInfo: "त्योहार कैलेंडर",
    historyInfo: "मंदिर का इतिहास",
    visitingInfo: "दर्शन गाइड",
    blogsInfo: "समाचार और ब्लॉग",
    privacyInfo: "गोपनीयता नीति",
    termsInfo: "नियम और शर्तें",
    related: "संबंधित प्रश्न",
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
    loginRequired: "请登录以使用寺庙助手",
    loginToChat: "登录后与助手聊天",
    developer: "此网站和寺庙助手由 Abhishek Rajbanshi（zeroinfinitytechnology）开发。",
    aartiInfo: "阿尔蒂时间表",
    galleryInfo: "画廊和视频",
    calendarInfo: "节日日历",
    historyInfo: "寺庙历史",
    visitingInfo: "参观指南",
    blogsInfo: "新闻和博客",
    privacyInfo: "隐私政策",
    termsInfo: "条款和条件",
    related: "相关问题",
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
    loginRequired: "கோவில் உதவியாளரைப் பயன்படுத்த தயவுசெய்து உள்நுழையவும்",
    loginToChat: "உதவியாளருடன் அரட்டையடிக்க உள்நுழையவும்",
    developer: "இந்த இணையதளம் மற்றும் கோவில் உதவியாளரை Abhishek Rajbanshi (zeroinfinitytechnology) உருவாக்கினார்.",
    aartiInfo: "ஆரத்தி அட்டவணை",
    galleryInfo: "கேலரி மற்றும் வீடியோக்கள்",
    calendarInfo: "பண்டிகை நாட்காட்டி",
    historyInfo: "கோவில் வரலாறு",
    visitingInfo: "பார்வையாளர் வழிகாட்டி",
    blogsInfo: "செய்திகள் மற்றும் வலைப்பதிவுகள்",
    privacyInfo: "தனியுரிமைக் கொள்கை",
    termsInfo: "விதிமுறைகள் மற்றும் நிபந்தனைகள்",
    related: "தொடர்புடைய கேள்விகள்",
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
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);

  // Live data fetched from backend (fallback to static JSON)
  const [liveData, setLiveData] = useState(null);

  const getLocalizedText = useCallback((obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj.en || '';
  }, [lang]);

  // Fetch real data from the backend
  useEffect(() => {
    let mounted = true;
    const fetchLiveData = async () => {
      try {
        const [settingsRes, teamRes, eventsRes] = await Promise.all([
          api.get('/admin/settings'),
          api.get('/admin/team'),
          api.get('/events'),
        ]);
        if (!mounted) return;

        const settings = settingsRes.data || {};
        const team = (teamRes.data || []).filter(m => m.enabled !== false);
        const events = ((eventsRes.data?.data || eventsRes.data) || []).filter(e => e.upcoming);

        setLiveData({
          ...chatbotData,
          temple: {
            ...chatbotData.temple,
            name: getLocalizedText(settings.templeName) || chatbotData.temple?.name,
            description: getLocalizedText(settings.about?.intro) || chatbotData.temple?.description,
            hours: settings.dailyAarti?.templeInfo?.openingHours
              ? (typeof settings.dailyAarti.templeInfo.openingHours === 'object'
                  ? getLocalizedText(settings.dailyAarti.templeInfo.openingHours)
                  : settings.dailyAarti.templeInfo.openingHours)
              : chatbotData.temple?.hours,
            phone: settings.contact?.phone || settings.notice?.contactDetails?.en || chatbotData.temple?.phone,
            email: settings.contact?.email || chatbotData.temple?.email,
          },
          team: team.map(m => ({
            name: getLocalizedText(m.name),
            role: getLocalizedText(m.role),
            bio: getLocalizedText(m.bio),
            email: m.email,
            phone: m.phone,
            roleType: m.roleType,
          })),
          events: events.map(e => ({
            title: getLocalizedText(e.title),
            date: getLocalizedText(e.dateNepali) || e.date,
            description: getLocalizedText(e.desc),
            location: getLocalizedText(e.location) || 'Shree Ramchandra Temple',
          })),
        });
      } catch (error) {
        console.error('Error fetching chatbot data:', error);
        setLiveData(null);
      }
    };
    fetchLiveData();
    return () => { mounted = false; };
  }, [lang, getLocalizedText]);

  const data = liveData || chatbotData;

  // Get current language translations
  const getTranslation = useCallback((key) => {
    return translations[lang]?.[key] || translations.en[key] || key;
  }, [lang]);

  // Initialize with greeting only when there are no messages yet
  useEffect(() => {
    const greeting = getTranslation('greeting');
    setMessages(prev => {
      if (prev.length > 0) return prev;
      return [{
        id: 'greeting',
        text: greeting,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      }];
    });
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

  // Load persisted messages from the database for the logged-in user
  useEffect(() => {
    if (!isAuthenticated()) return;
    let mounted = true;
    const loadMessages = async () => {
      try {
        const res = await api.get('/chatbot/messages');
        if (!mounted) return;
        const stored = res.data?.data || [];
        if (stored.length > 0) {
          setMessages(stored.map(m => ({
            id: m._id,
            text: m.text,
            sender: m.sender,
            timestamp: m.createdAt,
          })));
        } else {
          // No saved messages - show the localized greeting
          setMessages([{
            id: 'greeting',
            text: getTranslation('greeting'),
            sender: 'bot',
            timestamp: new Date().toISOString(),
          }]);
        }
      } catch (error) {
        console.error('Error loading chat messages:', error);
        if (mounted) {
          setMessages([{
            id: 'greeting',
            text: getTranslation('greeting'),
            sender: 'bot',
            timestamp: new Date().toISOString(),
          }]);
        }
      }
    };
    loadMessages();
    return () => { mounted = false; };
  }, [isAuthenticated, lang, getTranslation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Score how well a query matches a piece of text (word-level, multilingual aware)
  const wordScore = (query, text) => {
    if (!text) return 0;
    const q = String(query).toLowerCase().trim();
    const t = String(text).toLowerCase();
    if (!q) return 0;
    if (t.includes(q)) return 12;
    const stopWords = new Set(['what', 'which', 'when', 'where', 'who', 'how', 'the', 'and', 'are', 'for', 'our', 'any', 'about', 'can', 'you', 'tell', 'me', 'like', 'is', 'of', 'in', 'on', 'to', 'a', 'an', 'do', 'does', 'did', 'at', 'from', 'नि', 'को', 'का', 'मा', 'हो']);
    const words = q.split(/[\s?.,!]+/).filter(w => w.replace(/[^A-Za-z0-9\u0900-\u097F\u3040-\u30FF\u0B80-\u0BFF\u4E00-\u9FFF]/gi, '').length > 1 && !stopWords.has(w));
    let score = 0;
    words.forEach(w => {
      if (t.includes(w)) score += 3;
    });
    return score;
  };

  const pushIf = (results, type, data, query, searchableText, boost = 0) => {
    const score = wordScore(query, searchableText) + boost;
    if (score > 0) {
      results.push({ type, data, relevance: score });
    }
  };

  // Search through every section of the website knowledge base
  const searchData = (query) => {
    const results = [];

    if (data.temple) {
      const temple = data.temple;
      pushIf(results, 'temple', temple, query,
        `${temple.name} ${temple.description} ${temple.location} ${temple.address} ${temple.hours} ${temple.phone} ${temple.email} darshan pray worship temple open`, 1);
    }

    if (data.about) {
      const about = data.about;
      pushIf(results, 'about', about, query,
        `${about.deities} ${about.significance} ${about.established} ${about.aartiTimings} deities god ram sita lakshman significance`, 1);
    }

    if (data.history) {
      const history = data.history;
      pushIf(results, 'history', history, query,
        `${history.title} ${history.summary} ${history.timeline?.map(x => `${x.year} ${x.event}`).join(' ')} old past tradition origin`, 1);
    }

    if (data.team) {
      data.team.forEach(member => {
        const searchableText = `${member.name} ${member.role} ${member.bio} ${member.email} ${member.phone}`;
        pushIf(results, 'team', member, query, searchableText, 1);
      });
    }

    if (data.events) {
      data.events.forEach(event => {
        const searchableText = `${event.title} ${event.description} ${event.date} ${event.location}`;
        pushIf(results, 'event', event, query, searchableText, 1);
      });
    }

    if (data.aarti) {
      const aarti = data.aarti;
      const scheduleText = aarti.schedule?.map(s => `${s.name} ${s.time}`).join(' ');
      pushIf(results, 'aarti', aarti, query,
        `${aarti.info} ${scheduleText} ${aarti.prasad} aarti arati darshan mangala sandhya shayan morning evening`, 1);
    }

    if (data.visiting) {
      const visiting = data.visiting;
      pushIf(results, 'visiting', visiting, query,
        `${visiting.info} ${visiting.howToReach} ${visiting.guidelines} ${visiting.bestTime} reach direction travel parking dress visit`, 1);
    }

    if (data.calendar) {
      const calendar = data.calendar;
      const festivalsText = calendar.festivals?.map(f => `${f.name} ${f.date} ${f.note}`).join(' ');
      pushIf(results, 'calendar', calendar, query,
        `${calendar.info} ${festivalsText} festival calendar months dates occasions`, 1);
    }

    if (data.videos) {
      data.videos.forEach(video => {
        const searchableText = `${video.title} ${video.description} ${video.category}`;
        pushIf(results, 'video', video, query, searchableText, 1);
      });
    }

    if (data.blogs) {
      data.blogs.forEach(blog => {
        const searchableText = `${blog.title} ${blog.description} ${blog.date}`;
        pushIf(results, 'blog', blog, query, searchableText, 1);
      });
    }

    if (data.faqs) {
      data.faqs.forEach(faq => {
        const searchableText = `${faq.question} ${faq.answer}`;
        pushIf(results, 'faq', faq, query, searchableText, 3);
      });
    }

    if (data.gallery) {
      data.gallery.forEach(item => {
        const searchableText = `${item.title} ${item.description} ${item.category}`;
        pushIf(results, 'gallery', item, query, searchableText, 1);
      });
    }

    if (data.donations) {
      const donation = data.donations;
      const searchableText = `${donation.info} ${donation.methods?.join(' ')} ${donation.contact} ${donation.bankDetails?.bankName} ${donation.bankDetails?.accountName}`;
      pushIf(results, 'donation', donation, query, searchableText, 1);
    }

    if (data.booking) {
      const booking = data.booking;
      const searchableText = `${booking.info} ${booking.contact} ${booking.phone}`;
      pushIf(results, 'booking', booking, query, searchableText, 1);
    }

    results.sort((a, b) => b.relevance - a.relevance);
    return results;
  };

  const suggestionMap = {
    temple: ['templeHours', 'location', 'upcomingEvents'],
    about: ['historyInfo', 'founder', 'aartiInfo'],
    history: ['founder', 'aboutTemple', 'upcomingEvents'],
    team: ['teamMembers', 'contactInfo', 'aboutTemple'],
    event: ['upcomingEvents', 'templeHours', 'bookingInfo'],
    aarti: ['aartiInfo', 'templeHours', 'location'],
    visiting: ['visitingInfo', 'templeHours', 'upcomingEvents'],
    calendar: ['calendarInfo', 'upcomingEvents', 'templeHours'],
    video: ['galleryInfo', 'upcomingEvents', 'bookingInfo'],
    blog: ['blogsInfo', 'upcomingEvents', 'contactInfo'],
    faq: ['templeHours', 'donationInfo', 'location'],
    gallery: ['galleryInfo', 'upcomingEvents', 'aboutTemple'],
    donation: ['donationInfo', 'bookingInfo', 'upcomingEvents'],
    booking: ['bookingInfo', 'templeHours', 'location'],
  };

  // Format a search result into a nice chat answer
  const formatResult = (result, query, trans) => {
    const d = result.data;
    switch (result.type) {
      case 'temple':
        return `🏛️ ${trans('aboutTemple')}\n\n${d.name || 'Shree Ramchandra Temple'}\n${d.description || ''}\n📍 ${d.address || d.location || ''}`;
      case 'about':
        return `🏛️ ${trans('aboutTemple')}\n\n🙏 ${trans('founder')}: ${d.established || ''}\n\n✨ ${d.significance || ''}\n⏰ ${d.aartiTimings || ''}`;
      case 'history':
        return `📜 ${trans('historyInfo')}\n\n${d.summary || ''}\n\n${(d.timeline || []).map(x => `• ${x.year}: ${x.event}`).join('\n')}`;
      case 'team':
        return `👤 ${d.name}\n📋 ${d.role}\n${d.bio || ''}\n${d.email ? `📧 ${d.email}\n` : ''}${d.phone ? `📞 ${d.phone}` : ''}`;
      case 'event':
        return `🎉 ${d.title}\n📅 ${d.date}\n${d.description || ''}\n📍 ${d.location || ''}`;
      case 'aarti':
        return `🕉️ ${trans('aartiInfo')}:\n\n${(d.schedule || []).map(s => `• ${s.name}: ${s.time}`).join('\n')}\n\n${d.info || ''}`;
      case 'visiting':
        return `🚶 ${trans('visitingInfo')}:\n\n📍 ${d.howToReach || ''}\n\n🕐 ${d.bestTime || ''}\n\n📋 ${d.guidelines || ''}`;
      case 'calendar':
        return `📅 ${trans('calendarInfo')}:\n\n${(d.festivals || []).map(f => `• ${f.name} — ${f.date}\n   ${f.note || ''}`).join('\n')}`;
      case 'video':
        return `🎬 ${d.title}\n${d.description || ''}\n\n👀 Visit the Videos section on our website to watch.`;
      case 'blog':
        return `📰 ${d.title}\n${d.description || ''}\n\n📖 Visit the Blogs section on our website to read more.`;
      case 'faq':
        return `💡 ${d.answer || ''}`;
      case 'gallery':
        return `🖼️ ${d.title}\n${d.description || ''}\n\n📷 Visit the Gallery section on our website to see photos.`;
      case 'donation':
        return `💰 ${trans('donationInfo')}:\n${d.info || ''}\n\n${trans('methods')}: ${(d.methods || []).join(', ')}\n\n${d.bankDetails?.bankName ? `🏦 ${d.bankDetails.bankName}\n👤 ${d.bankDetails.accountName}\n🔢 ${d.bankDetails.accountNumber}\n\n` : ''}📞 ${trans('contact')}: ${d.contact || ''}`;
      case 'booking':
        return `📋 ${trans('bookingInfo')}:\n${d.info || ''}\n\n📞 ${trans('contact')}: ${d.contact || ''}\n📞 ${trans('phone')}: ${d.phone || ''}`;
      default:
        return `📌 ${d.title || d.name || trans('foundInfo')} ${query}`;
    }
  };

  // Generate response based on query
  const generateResponse = (query) => {
    const searchResults = searchData(query);
    const queryLower = query.toLowerCase().trim();
    const trans = getTranslation;
    const transKey = (k) => getTranslation(k);

    const greetings = ['hello', 'hi', 'hey', 'नमस्ते', 'नमस्कार', 'हैलो', 'नमो', '你好', 'வணக்கம்'];
    if (greetings.some(g => queryLower.includes(g)) && !queryLower.includes('history')) {
      return {
        text: `${trans('greeting')}`,
        suggestions: [transKey('templeHours'), transKey('location'), transKey('donationInfo'), transKey('bookingInfo')]
      };
    }

    const thanks = ['thank', 'thanks', 'धन्यवाद', '谢谢', 'நன்றி', 'धन्यवाद्'];
    if (thanks.some(x => queryLower.includes(x))) {
      return {
        text: `🙏 Jai Shree Ram! You are most welcome. Is there anything else I can help you with?`,
        suggestions: [transKey('templeHours'), transKey('upcomingEvents'), transKey('donationInfo')]
      };
    }

    if (queryLower.includes('developer') || queryLower.includes('developed') ||
        queryLower.includes('who made') || queryLower.includes('made this') ||
        queryLower.includes('who created') || queryLower.includes('creator') ||
        queryLower.includes('विकास') || queryLower.includes('बनाएको') || queryLower.includes('बनायो') ||
        queryLower.includes('开发') || queryLower.includes('开发者') || queryLower.includes('உருவாக்க')) {
      return {
        text: `👨‍💻 ${trans('developer')}`,
        suggestions: [transKey('aboutTemple'), transKey('teamMembers'), transKey('contactInfo')]
      };
    }

    if (queryLower.includes('privacy') || queryLower.includes('data') || queryLower.includes('information use') ||
        queryLower.includes('गोपनीयता') || queryLower.includes('隐私') || queryLower.includes('தனியுரிமை') ||
        queryLower.includes('personal information')) {
      return {
        text: `🔒 ${trans('privacyInfo')}:\n\n${data.privacy || 'We respect your privacy and never share your data.'}`,
        suggestions: [transKey('termsInfo'), transKey('contactInfo'), transKey('aboutTemple')]
      };
    }

    if (queryLower.includes('term') || queryLower.includes('condition') || queryLower.includes('rules') ||
        queryLower.includes('rule') || queryLower.includes('नियम') || queryLower.includes('条款') || queryLower.includes('விதிமுறை')) {
      return {
        text: `📄 ${trans('termsInfo')}:\n\n${data.terms || 'Please use our services responsibly.'}`,
        suggestions: [transKey('privacyInfo'), transKey('bookingInfo'), transKey('contactInfo')]
      };
    }

    if (queryLower.includes('hour') || queryLower.includes('timing') || queryLower.includes('open') ||
        queryLower.includes('darshan') || queryLower.includes('समय') || queryLower.includes('时间') || queryLower.includes('நேரம்')) {
      return {
        text: `🕐 ${trans('templeHours')}:\n${data.temple?.hours || '5:00 AM - 10:00 PM (Daily)'}\n\n🌟 ${transKey('aartiInfo')}:\n${(data.aarti?.schedule || []).map(s => `• ${s.name}: ${s.time}`).join('\n')}\n\n📍 ${trans('location')}: ${data.temple?.location || 'Gaushala, Kathmandu'}`,
        suggestions: [transKey('aartiInfo'), transKey('location'), transKey('upcomingEvents')]
      };
    }

    if (queryLower.includes('aarti') || queryLower.includes('arati') || queryLower.includes('भजन') ||
        queryLower.includes('आरती') || queryLower.includes('阿尔蒂') || queryLower.includes('ஆரத்தி') ||
        queryLower.includes('pray') || queryLower.includes(' chant') || queryLower.includes('puja schedule')) {
      return {
        text: `🕉️ ${trans('aartiInfo')}:\n\n${(data.aarti?.schedule || []).map(s => `• ${s.name}: ${s.time}`).join('\n')}\n\n${data.aarti?.info || ''}${data.aarti?.prasad || ''}`,
        suggestions: [transKey('templeHours'), transKey('location'), transKey('visitingInfo')]
      };
    }

    if (queryLower.includes('location') || queryLower.includes('address') || queryLower.includes('where') ||
        queryLower.includes('स्थान') || queryLower.includes('पता') || queryLower.includes('位置') || queryLower.includes('இருப்பிடம்')) {
      return {
        text: `📍 ${trans('address')}: ${data.temple?.address || 'Battisputali, Gaushala, Kathmandu, Nepal'}\n\n📞 ${trans('phone')}: ${data.temple?.phone || '+977-1-4598526'}\n📧 ${trans('email')}: ${data.temple?.email || 'shreramchandra@gmail.com'}`,
        suggestions: [transKey('visitingInfo'), transKey('templeHours'), transKey('upcomingEvents')]
      };
    }

    if (queryLower.includes('reach') || queryLower.includes('visit') || queryLower.includes('direction') ||
        queryLower.includes('travel') || queryLower.includes('guide') || queryLower.includes('car') ||
        queryLower.includes('पुग्न') || queryLower.includes('कसरी') || queryLower.includes('参观') || queryLower.includes('வழி')) {
      return {
        text: `🚶 ${trans('visitingInfo')}:\n\n📍 ${data.visiting?.howToReach || 'Located at Battisputali, Gaushala, Kathmandu, easily reachable from any part of the city.'}\n\n🕐 ${data.visiting?.bestTime || ''}\n\n📋 ${data.visiting?.guidelines || ''}`,
        suggestions: [transKey('templeHours'), transKey('location'), transKey('upcomingEvents')]
      };
    }

    if (queryLower.includes('founder') || queryLower.includes('found') || queryLower.includes('patron') ||
        queryLower.includes('संस्थापक') || queryLower.includes('创始人') || queryLower.includes('நிறுவனர்')) {
      return {
        text: `🙏 ${trans('founder')}:\n${data.founder?.name || 'Late Mr. Sanak Singh Tandon Lahuri Chhetri'}\n\n${data.founder?.bio || 'Founder of Shri Ramchandra Temple'}`,
        suggestions: [transKey('teamMembers'), transKey('aboutTemple'), transKey('historyInfo')]
      };
    }

    if (queryLower.includes('team') || queryLower.includes('member') || queryLower.includes('coordinator') ||
        queryLower.includes('committee') || queryLower.includes('टीम') || queryLower.includes('团队') || queryLower.includes('குழு')) {
      const teamMembers = data.team || [];
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
          suggestions: [transKey('aboutTemple'), transKey('upcomingEvents'), transKey('contactInfo')]
        };
      }
    }

    if (queryLower.includes('donate') || queryLower.includes('donation') || queryLower.includes('support') ||
        queryLower.includes('दान') || queryLower.includes('捐赠') || queryLower.includes('நன்கொடை') ||
        queryLower.includes('घर') || queryLower.includes('bel') || queryLower.includes('seva')) {
      const donation = data.donations || {};
      return {
        text: `💰 ${trans('donationInfo')}:\n${donation.info || 'Support the temple through donations.'}\n\n${trans('methods')}: ${donation.methods?.join(', ') || 'Bank Transfer, Cash, Online'}\n\n${donation.bankDetails?.bankName ? `🏦 ${donation.bankDetails.bankName}\n👤 ${donation.bankDetails.accountName}\n🔢 ${donation.bankDetails.accountNumber}\n\n` : ''}📞 ${trans('contact')}: ${donation.contact || 'info@ramchandratemple.org.np'}`,
        suggestions: [transKey('bookingInfo'), transKey('upcomingEvents'), transKey('templeHours')]
      };
    }

    if (queryLower.includes('booking') || queryLower.includes('book') || queryLower.includes('reserve') ||
        queryLower.includes('hall') || queryLower.includes('ceremony') || queryLower.includes('booking') ||
        queryLower.includes('बुकिंग') || queryLower.includes('预订') || queryLower.includes('முன்பதிவு')) {
      const booking = data.booking || {};
      return {
        text: `📋 ${trans('bookingInfo')}:\n${booking.info || 'Bookings available for temple events and ceremonies.'}\n\n📞 ${trans('contact')}: ${booking.contact || 'info@ramchandratemple.org.np'}\n📞 ${trans('phone')}: ${booking.phone || '+977-1-4598526'}`,
        suggestions: [transKey('templeHours'), transKey('location'), transKey('donationInfo')]
      };
    }

    if (queryLower.includes('event') || queryLower.includes('festival') || queryLower.includes('celebration') ||
        queryLower.includes('कार्यक्रम') || queryLower.includes('活动') || queryLower.includes('நிகழ்வு')) {
      const events = data.events || [];
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
          suggestions: [transKey('calendarInfo'), transKey('templeHours'), transKey('teamMembers')]
        };
      }
    }

    if (queryLower.includes('calendar') || queryLower.includes('occasions') || queryLower.includes('dates') ||
        queryLower.includes('पात्रो') || queryLower.includes('日历') || queryLower.includes('நாட்காட்டி')) {
      const calendar = data.calendar || {};
      return {
        text: `📅 ${trans('calendarInfo')}:\n\n${(calendar.festivals || []).map(f => `• ${f.name} — ${f.date}\n   ${f.note || ''}`).join('\n')}`,
        suggestions: [transKey('upcomingEvents'), transKey('templeHours'), transKey('bookingInfo')]
      };
    }

    if (queryLower.includes('gallery') || queryLower.includes('photo') || queryLower.includes('picture') ||
        queryLower.includes('image') || queryLower.includes('video') || queryLower.includes('फोटो') ||
        queryLower.includes('照片') || queryLower.includes('கேலரி') || queryLower.includes('videos')) {
      const gallery = data.gallery || [];
      const videos = data.videos || [];
      let response = `📷 ${trans('galleryInfo')}:\n\n`;
      gallery.forEach(item => {
        response += `🖼️ ${item.title}\n   ${item.description || ''}\n\n`;
      });
      videos.forEach(video => {
        response += `🎬 ${video.title}\n   ${video.description || ''}\n\n`;
      });
      return {
        text: response,
        suggestions: [transKey('upcomingEvents'), transKey('aboutTemple'), transKey('bookingInfo')]
      };
    }

    if (queryLower.includes('history') || queryLower.includes('story') || queryLower.includes('about') ||
        queryLower.includes('established') || queryLower.includes('origin') ||
        queryLower.includes('इतिहास') || queryLower.includes('历史') || queryLower.includes('வரலாறு') ||
        queryLower.includes('temple about')) {
      const history = data.history || {};
      return {
        text: `🏛️ ${data.temple?.name || 'Shree Ramchandra Temple'}\n\n${data.temple?.description || ''}\n\n📜 ${trans('historyInfo')}:\n${history.summary || ''}\n\n${(history.timeline || []).map(x => `• ${x.year}: ${x.event}`).join('\n')}\n\n${data.about?.significance || ''}`,
        suggestions: [transKey('founder'), transKey('teamMembers'), transKey('upcomingEvents')]
      };
    }

    if (queryLower.includes('news') || queryLower.includes('blog') || queryLower.includes('article') ||
        queryLower.includes('समाचार') || queryLower.includes('博客') || queryLower.includes('செய்தி') ||
        queryLower.includes('update')) {
      const blogs = data.blogs || [];
      return {
        text: `📰 ${trans('blogsInfo')}:\n\n${(blogs.length ? blogs : [{ title: 'Blogs section', description: 'Visit the Blogs section on our website for the latest news and spiritual articles.', date: '' }]).map(b => `• ${b.title}\n   ${b.description || ''}`).join('\n')}`,
        suggestions: [transKey('upcomingEvents'), transKey('aboutTemple'), transKey('contactInfo')]
      };
    }

    if (queryLower.includes('contact') || queryLower.includes('phone') || queryLower.includes('email') ||
        queryLower.includes('call') || queryLower.includes('संपर्क') || queryLower.includes('联系') || queryLower.includes('தொடர்பு')) {
      return {
        text: `📞 ${trans('contactInfo')}:\n\n📍 ${trans('address')}: ${data.temple?.address || 'Battisputali, Gaushala, Kathmandu, Nepal'}\n📞 ${trans('phone')}: ${data.temple?.phone || '+977-1-4598526'}\n📧 ${trans('email')}: ${data.temple?.email || 'shreramchandra@gmail.com'}`,
        suggestions: [transKey('templeHours'), transKey('location'), transKey('donationInfo')]
      };
    }

    if (searchResults.length > 0) {
      const topResult = searchResults[0];
      let response = `🔍 ${trans('foundInfo')} "${query}":\n\n`;
      response += formatResult(topResult, query, trans);
      return {
        text: response,
        suggestions: (suggestionMap[topResult.type] || ['templeHours', 'location', 'contactInfo']).map(transKey)
      };
    }

    return {
      text: `🙏 ${trans('noResults')} "${query}". ${trans('hereAreTopics')}\n\n• ${trans('templeHours')}\n• ${trans('aartiInfo')}\n• ${trans('location')}\n• ${trans('teamMembers')}\n• ${trans('upcomingEvents')}\n• ${trans('calendarInfo')}\n• ${trans('donationInfo')}\n• ${trans('bookingInfo')}\n• ${trans('visitingInfo')}\n• ${trans('galleryInfo')}\n• ${trans('historyInfo')}\n• ${trans('contactInfo')}\n\n${trans('askMe')}`,
      suggestions: [transKey('templeHours'), transKey('teamMembers'), transKey('upcomingEvents'), transKey('donationInfo'), transKey('contactInfo')]
    };
  };

  const sendMessage = async (text) => {
    if (!text || !text.trim()) return;
    const trimmed = text.trim();
    const userTempId = `temp-user-${Date.now()}`;

    const userMessage = {
      id: userTempId,
      text: trimmed,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Persist user message to the database
    if (isAuthenticated()) {
      try {
        const res = await api.post('/chatbot/messages', { sender: 'user', text: trimmed, language: lang });
        const saved = res.data?.data;
        if (saved?._id) {
          setMessages(prev => prev.map(m => m.id === userTempId
            ? { ...m, id: saved._id, timestamp: saved.createdAt || m.timestamp }
            : m));
        }
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }

    setTimeout(async () => {
      const response = generateResponse(trimmed);
      const botTempId = `temp-bot-${Date.now()}`;
      const botMessage = {
        id: botTempId,
        text: response.text,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }

      // Persist bot message to the database
      if (isAuthenticated()) {
        try {
          const res = await api.post('/chatbot/messages', { sender: 'bot', text: response.text, language: lang });
          const saved = res.data?.data;
          if (saved?._id) {
            setMessages(prev => prev.map(m => m.id === botTempId
              ? { ...m, id: saved._id, timestamp: saved.createdAt || m.timestamp }
              : m));
          }
        } catch (error) {
          console.error('Error saving bot message:', error);
        }
      }
    }, 500 + Math.random() * 500);
  };

  // Clear all messages function
  const clearAllMessages = useCallback(() => {
    const greeting = getTranslation('greeting');
    setMessages([
      {
        id: 'greeting',
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
    if (isAuthenticated()) {
      api.delete('/chatbot/messages').catch((error) => {
        console.error('Error clearing chat messages:', error);
      });
    }
  }, [getTranslation, isAuthenticated]);

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