import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import api from '../services/api';
import OmLoader from '../components/common/OmLoader';
import { 
  AlertCircle, 
  Check, 
  User, 
  Phone, 
  Calendar, 
  Tag, 
  FileText, 
  Clock, 
  Shield, 
  CalendarDays, 
  Lock, 
  Download, 
  FileDown,
  Printer, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  CheckCircle,
  XCircle
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


const BookingPage = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [bookingAvailable, setBookingAvailable] = useState(true);
  const [availabilityMessage, setAvailabilityMessage] = useState('Bookings are currently unavailable. Please check back later.');
  const [pujaTypesFromAdmin, setPujaTypesFromAdmin] = useState([]);
  const [dateLimits, setDateLimits] = useState({});
  const [dateLimitMessage, setDateLimitMessage] = useState('');
  const [isDateValidForBooking, setIsDateValidForBooking] = useState(true);
  const [bookingBgPhoto, setBookingBgPhoto] = useState('/4.jpg');
  const [stats, setStats] = useState({
    pujaTypes: 5,
    secureBooking: '100%',
    support: '24/7'
  });
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const bookingRefs = useRef({});
  const bookingsSectionRef = useRef(null);
  
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    date: '',
    type: '',
    description: '',
  });

  // Multi-language puja types (fallback)
  const pujaTypesFallback = {
    en: ['Ram Puja', 'Satyanarayan Puja', 'Griha Pravesh Puja', 'Birthday Puja', 'General Darshan Booking'],
    ne: ['राम पूजा', 'सत्यनारायण पूजा', 'गृह प्रवेश पूजा', 'जन्मदिन पूजा', 'साधारण दर्शन बुकिङ'],
    hi: ['राम पूजा', 'सत्यनारायण पूजा', 'गृह प्रवेश पूजा', 'जन्मदिन पूजा', 'सामान्य दर्शन बुकिंग'],
    zh: ['罗摩祈福', '萨蒂亚那罗延祈福', '乔迁祈福', '生日祈福', '普通参拜预约'],
    ta: ['ராம பூஜை', 'சத்யநாராயண பூஜை', 'கிரக பிரவேச பூஜை', 'பிறந்தநாள் பூஜை', 'பொது தரிசன பதிவு'],
  };

  // Get puja types from admin or fallback
  const getPujaTypes = () => {
    if (pujaTypesFromAdmin && pujaTypesFromAdmin.length > 0) {
      return pujaTypesFromAdmin;
    }
    return pujaTypesFallback[lang] || pujaTypesFallback.en;
  };

  // Multi-language stats labels
  const statsLabels = {
    en: {
      pujaTypes: 'Puja Types',
      secureBooking: 'Secure Booking',
      support: 'Support'
    },
    ne: {
      pujaTypes: 'पूजा प्रकारहरू',
      secureBooking: 'सुरक्षित बुकिङ',
      support: 'सहायता'
    },
    hi: {
      pujaTypes: 'पूजा प्रकार',
      secureBooking: 'सुरक्षित बुकिंग',
      support: 'सहायता'
    },
    zh: {
      pujaTypes: '法会类型',
      secureBooking: '安全预订',
      support: '支持'
    },
    ta: {
      pujaTypes: 'பூஜை வகைகள்',
      secureBooking: 'பாதுகாப்பான முன்பதிவு',
      support: 'ஆதரவு'
    }
  };

  // Multi-language form labels
  const labels = {
    en: {
      title: 'Schedule Your Puja',
      subtitle: 'Fill in the details below to book your puja',
      name: 'Full Name',
      phone: 'Phone Number',
      date: 'Preferred Date',
      pujaType: 'Puja Type',
      description: 'Special Instructions',
      descriptionPlaceholder: 'Add any special requests or details about your puja...',
      optional: 'Optional',
      bookNow: 'Book Puja Now',
      unavailable: 'Unavailable',
      booking: 'Booking...',
      secure: 'Your booking is secure and confirmed via email',
      loginRequired: 'Login Required',
      loginMsg: 'Please log in to book a puja at the temple.',
      loginContinue: 'Log In to Continue',
      selectPuja: 'Select Puja Type',
      bookYourPuja: 'Book Your Sacred Puja',
      templeDesc: 'Experience divine blessings at Shree Ramchandra Temple. Fill in the details to book your puja.',
      bookNowLabel: 'Book Now',
      thankYou: 'Thank you for booking! You will be redirected shortly.',
      unavailableMsg: 'Bookings are currently unavailable. Please check back later.',
      dateLimitMsg: 'Booking limit reached for this date. Please select another date.',
      pastDateMsg: 'Please select a future date for booking.',
      limitReached: 'Limit Reached',
      available: 'Available',
      noSlots: 'No slots available',
      slotsAvailable: 'slots available',
      myBookings: 'My Bookings',
      viewMyBookings: 'View My Bookings',
      hideBookings: 'Hide Bookings',
      downloadBooking: 'Download Booking',
      noBookings: 'You have no bookings yet',
      makeBooking: 'Make your first booking',
      bookingDetails: 'Booking Details',
      download: 'Download'
    },
    ne: {
      title: 'पूजा बुक गर्नुहोस्',
      subtitle: 'पूजा बुक गर्न तलको विवरण भर्नुहोस्',
      name: 'पूरा नाम',
      phone: 'फोन नम्बर',
      date: 'रुचाइएको मिति',
      pujaType: 'पूजाको प्रकार',
      description: 'विशेष निर्देशनहरू',
      descriptionPlaceholder: 'तपाईंको पूजाको बारेमा कुनै विशेष अनुरोध वा विवरण थप्नुहोस्...',
      optional: 'वैकल्पिक',
      bookNow: 'पूजा बुक गर्नुहोस्',
      unavailable: 'उपलब्ध छैन',
      booking: 'बुक गर्दै...',
      secure: 'तपाईंको बुकिङ सुरक्षित छ र इमेल मार्फत पुष्टि गरिन्छ',
      loginRequired: 'लगइन आवश्यक',
      loginMsg: 'कृपया मन्दिरमा पूजा बुक गर्न लगइन गर्नुहोस्।',
      loginContinue: 'जारी राख्न लगइन गर्नुहोस्',
      selectPuja: 'पूजाको प्रकार चयन गर्नुहोस्',
      bookYourPuja: 'आफ्नो पूजा बुक गर्नुहोस्',
      templeDesc: 'श्री रामचन्द्र मन्दिरमा दिव्य आशीर्वाद प्राप्त गर्नुहोस्। पूजा बुक गर्न विवरण भर्नुहोस्।',
      bookNowLabel: 'अहिले बुक गर्नुहोस्',
      thankYou: 'बुकिङको लागि धन्यवाद! तपाईंलाई चाँडै पुनःनिर्देशित गरिनेछ।',
      unavailableMsg: 'बुकिङ हाल उपलब्ध छैन। कृपया पछि फेरि प्रयास गर्नुहोस्।',
      dateLimitMsg: 'यस मितिको लागि बुकिङ सीमा पुगेको छ। कृपया अर्को मिति चयन गर्नुहोस्।',
      pastDateMsg: 'कृपया बुकिङको लागि भविष्यको मिति चयन गर्नुहोस्।',
      limitReached: 'सीमा पुग्यो',
      available: 'उपलब्ध',
      noSlots: 'कुनै स्लट उपलब्ध छैन',
      slotsAvailable: 'स्लटहरू उपलब्ध',
      myBookings: 'मेरो बुकिङहरू',
      viewMyBookings: 'मेरो बुकिङहरू हेर्नुहोस्',
      hideBookings: 'बुकिङहरू लुकाउनुहोस्',
      downloadBooking: 'बुकिङ डाउनलोड गर्नुहोस्',
      noBookings: 'तपाईंको कुनै बुकिङ छैन',
      makeBooking: 'आफ्नो पहिलो बुकिङ गर्नुहोस्',
      bookingDetails: 'बुकिङ विवरण',
      download: 'डाउनलोड'
    },
    hi: {
      title: 'पूजा बुक करें',
      subtitle: 'पूजा बुक करने के लिए नीचे विवरण भरें',
      name: 'पूरा नाम',
      phone: 'फोन नंबर',
      date: 'पसंदीदा तारीख',
      pujaType: 'पूजा का प्रकार',
      description: 'विशेष निर्देश',
      descriptionPlaceholder: 'अपनी पूजा के बारे में कोई विशेष अनुरोध या विवरण जोड़ें...',
      optional: 'वैकल्पिक',
      bookNow: 'पूजा बुक करें',
      unavailable: 'अनुपलब्ध',
      booking: 'बुक हो रहा है...',
      secure: 'आपकी बुकिंग सुरक्षित है और ईमेल द्वारा पुष्टि की जाती है',
      loginRequired: 'लॉगिन आवश्यक',
      loginMsg: 'कृपया मंदिर में पूजा बुक करने के लिए लॉगिन करें।',
      loginContinue: 'जारी रखने के लिए लॉगिन करें',
      selectPuja: 'पूजा का प्रकार चुनें',
      bookYourPuja: 'अपनी पूजा बुक करें',
      templeDesc: 'श्री रामचन्द्र मंदिर में दिव्य आशीर्वाद प्राप्त करें। पूजा बुक करने के लिए विवरण भरें।',
      bookNowLabel: 'अभी बुक करें',
      thankYou: 'बुकिंग के लिए धन्यवाद! आपको जल्द ही पुनर्निर्देशित किया जाएगा।',
      unavailableMsg: 'बुकिंग वर्तमान में उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।',
      dateLimitMsg: 'इस तारीख के लिए बुकिंग सीमा पूरी हो गई है। कृपया दूसरी तारीख चुनें।',
      pastDateMsg: 'कृपया बुकिंग के लिए भविष्य की तारीख चुनें।',
      limitReached: 'सीमा पूरी हुई',
      available: 'उपलब्ध',
      noSlots: 'कोई स्लॉट उपलब्ध नहीं',
      slotsAvailable: 'स्लॉट उपलब्ध',
      myBookings: 'मेरी बुकिंग्स',
      viewMyBookings: 'मेरी बुकिंग्स देखें',
      hideBookings: 'बुकिंग्स छिपाएं',
      downloadBooking: 'बुकिंग डाउनलोड करें',
      noBookings: 'आपकी कोई बुकिंग नहीं है',
      makeBooking: 'अपनी पहली बुकिंग करें',
      bookingDetails: 'बुकिंग विवरण',
      download: 'डाउनलोड'
    },
    zh: {
      title: '预订法会',
      subtitle: '填写以下详细信息以预订法会',
      name: '全名',
      phone: '电话号码',
      date: '首选日期',
      pujaType: '法会类型',
      description: '特别说明',
      descriptionPlaceholder: '添加关于法会的任何特殊要求或详情...',
      optional: '可选',
      bookNow: '预订法会',
      unavailable: '不可用',
      booking: '预订中...',
      secure: '您的预订是安全的，并通过电子邮件确认',
      loginRequired: '需要登录',
      loginMsg: '请登录以预订寺庙的法会。',
      loginContinue: '登录继续',
      selectPuja: '选择法会类型',
      bookYourPuja: '预订您的法会',
      templeDesc: '在室利罗摩钱德拉神庙体验神圣祝福。填写详细信息以预订法会。',
      bookNowLabel: '立即预订',
      thankYou: '感谢您的预订！您将被重定向。',
      unavailableMsg: '预订目前不可用。请稍后再试。',
      dateLimitMsg: '此日期的预订限制已达到。请选择其他日期。',
      pastDateMsg: '请选择未来的日期进行预订。',
      limitReached: '已达限制',
      available: '可用',
      noSlots: '无可用名额',
      slotsAvailable: '名额可用',
      myBookings: '我的预订',
      viewMyBookings: '查看我的预订',
      hideBookings: '隐藏预订',
      downloadBooking: '下载预订',
      noBookings: '您还没有预订',
      makeBooking: '进行您的首次预订',
      bookingDetails: '预订详情',
      download: '下载'
    },
    ta: {
      title: 'உங்கள் பூஜையை முன்பதிவு செய்யுங்கள்',
      subtitle: 'பூஜையை முன்பதிவு செய்ய கீழே உள்ள விவரங்களை நிரப்பவும்',
      name: 'முழு பெயர்',
      phone: 'தொலைபேசி எண்',
      date: 'விருப்பமான தேதி',
      pujaType: 'பூஜையின் வகை',
      description: 'சிறப்பு வழிமுறைகள்',
      descriptionPlaceholder: 'உங்கள் பூஜையைப் பற்றிய சிறப்பு கோரிக்கைகள் அல்லது விவரங்களைச் சேர்க்கவும்...',
      optional: 'விருப்பத்தேர்வு',
      bookNow: 'பூஜையை முன்பதிவு செய்யுங்கள்',
      unavailable: 'கிடைக்கவில்லை',
      booking: 'முன்பதிவு செய்யப்படுகிறது...',
      secure: 'உங்கள் முன்பதிவு பாதுகாப்பானது மற்றும் மின்னஞ்சல் மூலம் உறுதிப்படுத்தப்படுகிறது',
      loginRequired: 'உள்நுழைவு தேவை',
      loginMsg: 'கோயிலில் பூஜையை முன்பதிவு செய்ய உள்நுழையவும்.',
      loginContinue: 'தொடர உள்நுழையவும்',
      selectPuja: 'பூஜையின் வகையைத் தேர்ந்தெடுக்கவும்',
      bookYourPuja: 'உங்கள் பூஜையை முன்பதிவு செய்யுங்கள்',
      templeDesc: 'ஸ்ரீ ராமச்சந்திர கோயிலில் தெய்வீக ஆசீர்வாதங்களை அனுபவிக்கவும். பூஜையை முன்பதிவு செய்ய விவரங்களை நிரப்பவும்.',
      bookNowLabel: 'இப்போது முன்பதிவு செய்யுங்கள்',
      thankYou: 'முன்பதிவு செய்ததற்கு நன்றி! நீங்கள் விரைவில் திருப்பிவிடப்படுவீர்கள்.',
      unavailableMsg: 'முன்பதிவுகள் தற்போது கிடைக்கவில்லை. தயவுசெய்து பின்னர் முயற்சிக்கவும்.',
      dateLimitMsg: 'இந்த தேதிக்கான முன்பதிவு வரம்பு எட்டப்பட்டுள்ளது. தயவுசெய்து வேறு தேதியை தேர்ந்தெடுக்கவும்.',
      pastDateMsg: 'முன்பதிவுக்கு எதிர்கால தேதியை தேர்ந்தெடுக்கவும்.',
      limitReached: 'வரம்பு எட்டப்பட்டது',
      available: 'கிடைக்கும்',
      noSlots: 'ஸ்லாட்கள் இல்லை',
      slotsAvailable: 'ஸ்லாட்கள் கிடைக்கும்',
      myBookings: 'என் முன்பதிவுகள்',
      viewMyBookings: 'என் முன்பதிவுகளைப் பார்க்கவும்',
      hideBookings: 'முன்பதிவுகளை மறைக்கவும்',
      downloadBooking: 'முன்பதிவை பதிவிறக்கவும்',
      noBookings: 'உங்களுக்கு முன்பதிவுகள் இல்லை',
      makeBooking: 'உங்கள் முதல் முன்பதிவை செய்யுங்கள்',
      bookingDetails: 'முன்பதிவு விவரங்கள்',
      download: 'பதிவிறக்கவும்'
    }
  };

  const currentLabels = labels[lang] || labels.en;
  const currentStatsLabels = statsLabels[lang] || statsLabels.en;
  const types = getPujaTypes();

  // Get today's date for min date validation
  const today = new Date().toISOString().split('T')[0];

  // Check if a date is fully booked (limit is 0 or less)
  const isDateFullyBooked = (date) => {
    if (!dateLimits || dateLimits[date] === undefined) return false;
    return dateLimits[date] <= 0;
  };

  // Get remaining slots for a date
  const getRemainingSlots = (date) => {
    if (!dateLimits || dateLimits[date] === undefined) return null;
    return dateLimits[date];
  };

  // Check if date is in the past
  const isPastDate = (date) => {
    return date < today;
  };

  // Check if date is valid for booking (not past, not fully booked)
  const checkDateValidity = (date) => {
    if (!date) return { valid: true, message: '' };
    
    if (isPastDate(date)) {
      return { valid: false, message: currentLabels.pastDateMsg };
    }
    
    if (isDateFullyBooked(date)) {
      const remaining = getRemainingSlots(date);
      if (remaining === 0) {
        return { valid: false, message: currentLabels.noSlots };
      }
      return { valid: false, message: currentLabels.dateLimitMsg };
    }
    
    return { valid: true, message: '' };
  };

  // Fetch user's bookings
  const fetchMyBookings = async () => {
    if (!user) return;
    
    setLoadingBookings(true);
    try {
      const response = await api.get('/bookings/my');
      setMyBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Toggle my bookings view with scroll
  const toggleMyBookings = () => {
    const newShowState = !showMyBookings;
    setShowMyBookings(newShowState);
    
    if (newShowState) {
      // Fetch bookings first
      fetchMyBookings().then(() => {
        // Scroll to bookings section after a small delay to allow render
        setTimeout(() => {
          if (bookingsSectionRef.current) {
            bookingsSectionRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }
        }, 300);
      });
    } else {
      // If hiding, just close it
      setShowMyBookings(false);
    }
  };

  // Download individual booking as PDF
  const downloadBookingPDF = async (bookingId) => {
    const element = bookingRefs.current[bookingId];
    if (!element) return;
    
    setDownloadingId(bookingId);
    try {
      // Clone the element for better rendering
      const clone = element.cloneNode(true);
      clone.style.transform = 'scale(1)';
      clone.style.width = '100%';
      clone.style.background = 'white';
      clone.style.padding = '20px';
      clone.style.borderRadius = '12px';
      clone.style.position = 'relative';
      
      // Add watermark
      const watermarkCanvas = document.createElement('canvas');
      watermarkCanvas.width = 400;
      watermarkCanvas.height = 400;
      const ctx = watermarkCanvas.getContext('2d');
      ctx.clearRect(0, 0, watermarkCanvas.width, watermarkCanvas.height);
      ctx.font = '28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.translate(watermarkCanvas.width / 2, watermarkCanvas.height / 2);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = 'rgba(122, 0, 0, 0.08)';
      ctx.fillText('Shree Ramchandra Temple', 0, 0);
      const watermarkImg = watermarkCanvas.toDataURL('image/png');
      
      const watermarkDiv = document.createElement('div');
      watermarkDiv.style.position = 'absolute';
      watermarkDiv.style.top = '0';
      watermarkDiv.style.left = '0';
      watermarkDiv.style.width = '100%';
      watermarkDiv.style.height = '100%';
      watermarkDiv.style.pointerEvents = 'none';
      watermarkDiv.style.backgroundImage = `url(${watermarkImg})`;
      watermarkDiv.style.backgroundRepeat = 'repeat';
      watermarkDiv.style.backgroundSize = '200px 200px';
      watermarkDiv.style.backgroundPosition = 'center';
      watermarkDiv.style.opacity = '0.4';
      watermarkDiv.style.zIndex = '10';
      
      // Create container
      const container = document.createElement('div');
      container.style.position = 'relative';
      container.style.width = '500px';
      container.style.background = 'white';
      container.style.padding = '20px';
      container.style.borderRadius = '12px';
      
      // Add header
      const header = document.createElement('div');
      header.style.textAlign = 'center';
      header.style.marginBottom = '15px';
      header.style.padding = '15px';
      header.style.background = 'linear-gradient(135deg, #7A0000, #5A0000)';
      header.style.borderRadius = '8px';
      header.style.color = 'white';
      header.innerHTML = `
        <div style="font-size: 28px;">🛕</div>
        <div style="font-size: 18px; font-weight: bold;">Booking Confirmation</div>
        <div style="font-size: 12px; opacity: 0.9;">Shree Ramchandra Temple</div>
        <div style="font-size: 10px; opacity: 0.7; margin-top: 5px;">${new Date().toLocaleString()}</div>
      `;
      
      container.appendChild(header);
      container.appendChild(clone);
      container.appendChild(watermarkDiv);
      
      // Add footer
      const footer = document.createElement('div');
      footer.style.textAlign = 'center';
      footer.style.marginTop = '15px';
      footer.style.padding = '10px';
      footer.style.borderTop = '1px solid #e0dcd5';
      footer.style.fontSize = '9px';
      footer.style.color = '#999';
      footer.innerHTML = `
        <div>This is an official booking confirmation document.</div>
        <div style="margin-top: 3px;">Document ID: ${bookingId.slice(-8).toUpperCase()}</div>
      `;
      container.appendChild(footer);
      
      // Temporarily append to body
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '500px';
      document.body.appendChild(container);
      
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 500,
        height: container.scrollHeight
      });
      
      document.body.removeChild(container);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`booking-${bookingId.slice(-8)}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to download booking. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return 'text-green-600 bg-green-50 border-green-200';
      case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'confirmed': return <CheckCircle size={14} className="text-green-500" />;
      case 'completed': return <CheckCircle size={14} className="text-blue-500" />;
      case 'cancelled': return <AlertCircle size={14} className="text-red-500" />;
      default: return <Clock size={14} className="text-yellow-500" />;
    }
  };

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/admin/settings');
        const settings = response.data;
        
        if (settings.bookingAvailable !== undefined) {
          setBookingAvailable(settings.bookingAvailable);
        }
        
        if (settings.availabilityMessage) {
          setAvailabilityMessage(settings.availabilityMessage);
        }
        
        if (settings.pujaTypes && settings.pujaTypes.length > 0) {
          setPujaTypesFromAdmin(settings.pujaTypes);
        }
        
        if (settings.dateLimits) {
          setDateLimits(settings.dateLimits);
        }
        
        if (settings.bookingStats) {
          setStats({
            pujaTypes: settings.bookingStats.pujaTypes || 5,
            secureBooking: settings.bookingStats.secureBooking || '100%',
            support: settings.bookingStats.support || '24/7'
          });
        }
        
        if (settings.bookingBgPhoto) {
          setBookingBgPhoto(settings.bookingBgPhoto);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Validate date when it changes
  useEffect(() => {
    if (form.date) {
      const validation = checkDateValidity(form.date);
      setDateLimitMessage(validation.message);
      setIsDateValidForBooking(validation.valid);
    } else {
      setDateLimitMessage('');
      setIsDateValidForBooking(true);
    }
  }, [form.date, dateLimits, currentLabels]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!bookingAvailable) {
      showToast(availabilityMessage || currentLabels.unavailableMsg, 'error');
      return;
    }
    
    if (!form.name || !form.phone || !form.date || !form.type) {
      showToast(t.fillAll);
      return;
    }

    const validation = checkDateValidity(form.date);
    if (!validation.valid) {
      showToast(validation.message, 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/bookings', form);
      setDone(true);
      showToast(currentLabels.thankYou || t.thankYouBooking);
      // Refresh bookings if showing
      if (showMyBookings) {
        fetchMyBookings();
      }
      setTimeout(() => {
        navigate('/mybookings');
      }, 2000);
    } catch (error) {
      console.error('Booking error:', error);
      showToast(error.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen" style={{ background: 'linear-gradient(180deg, #faf8f5 0%, #ffffff 50%, #faf8f5 100%)' }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2">
              <div className="hidden lg:block relative min-h-[500px] bg-[#7A0000]">
                <img 
                  src={bookingBgPhoto || '/4.jpg'} 
                  alt="Temple" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/4.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#7A0000]/80 via-transparent to-transparent" />
                <div className="absolute bottom-10 left-10 right-10">
                  <h3 className="text-white text-2xl font-serif font-bold">Shree Ramchandra Temple</h3>
                  <p className="text-white/70 text-sm">{currentLabels.bookYourPuja}</p>
                </div>
              </div>
              <div className="p-8 md:p-12 text-center">
                <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={26} />
                </div>
                <h3 className="text-xl font-serif font-semibold">{currentLabels.loginRequired}</h3>
                <p className="text-sm text-gray-500 mt-2">{currentLabels.loginMsg}</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#7A0000] text-white font-semibold text-sm hover:bg-[#5A0000] transition-all shadow-lg shadow-[#7A0000]/20"
                >
                  {currentLabels.loginContinue}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(180deg, #faf8f5 0%, #ffffff 50%, #faf8f5 100%)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100/50">
          <div className={`h-1.5 ${bookingAvailable ? 'bg-gradient-to-r from-[#7A0000] via-[#A00000] to-[#7A0000]' : 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-400'}`} />
          
          <div className="grid lg:grid-cols-2">
            {/* Left Side - Image 50% */}
            <div className="relative min-h-[400px] lg:min-h-[600px] bg-[#7A0000]">
              <img 
                src={bookingBgPhoto || '/4.jpg'} 
                alt="Temple Booking" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/4.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#7A0000]/90 via-[#7A0000]/40 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                <div className={`inline-flex items-center gap-2 backdrop-blur-sm px-4 py-1.5 rounded-full text-white text-xs font-semibold mb-4 ${
                  bookingAvailable ? 'bg-white/20' : 'bg-gray-500/50'
                }`}>
                  {bookingAvailable ? <CalendarDays size={14} /> : <Lock size={14} />}
                  {bookingAvailable ? currentLabels.bookNowLabel : currentLabels.unavailable}
                </div>
                <h2 className="text-white text-2xl md:text-3xl font-serif font-bold leading-tight">
                  {currentLabels.bookYourPuja}
                </h2>
                <p className="text-white/80 text-sm mt-2 max-w-sm">
                  {currentLabels.templeDesc}
                </p>
                
                <div className="grid grid-cols-3 gap-3 mt-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10 hover:bg-white/20 transition-all duration-300">
                    <div className="text-white text-lg font-bold">{stats.pujaTypes}+</div>
                    <div className="text-white/60 text-[10px] font-medium tracking-wide">
                      {currentStatsLabels.pujaTypes}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10 hover:bg-white/20 transition-all duration-300">
                    <div className="text-white text-lg font-bold">{stats.secureBooking}</div>
                    <div className="text-white/60 text-[10px] font-medium tracking-wide">
                      {currentStatsLabels.secureBooking}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10 hover:bg-white/20 transition-all duration-300">
                    <div className="text-white text-lg font-bold">{stats.support}</div>
                    <div className="text-white/60 text-[10px] font-medium tracking-wide">
                      {currentStatsLabels.support}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Form 50% */}
            <div className="p-6 md:p-8 lg:p-10 overflow-y-auto max-h-[600px] lg:max-h-[700px] scrollbar-hide">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-0.5 rounded-full ${bookingAvailable ? 'bg-[#7A0000]' : 'bg-gray-400'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${bookingAvailable ? 'text-[#7A0000]' : 'text-gray-400'}`}>
                      {bookingAvailable ? currentLabels.bookNowLabel : currentLabels.unavailable}
                    </span>
                  </div>
                  
                  {/* View My Bookings Button */}
                  <button
                    onClick={toggleMyBookings}
                    className="flex items-center gap-1.5 text-xs text-[#7A0000] hover:text-[#5A0000] font-medium bg-[#7A0000]/10 px-3 py-1.5 rounded-full transition-all hover:bg-[#7A0000]/20"
                  >
                    {showMyBookings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {showMyBookings ? currentLabels.hideBookings : currentLabels.viewMyBookings}
                    <span className="bg-[#7A0000] text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center">
                      {myBookings.length}
                    </span>
                  </button>
                </div>
                <h2 className={`text-xl md:text-2xl font-serif font-bold ${bookingAvailable ? 'text-[#7A0000]' : 'text-gray-400'}`}>
                  {currentLabels.title}
                </h2>
                <p className="text-gray-500 text-xs mt-1">
                  {bookingAvailable ? currentLabels.subtitle : availabilityMessage}
                </p>
              </div>

              {done && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 mb-5 border border-green-200">
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check size={16} className="text-green-600" />
                  </div>
                  <span>{currentLabels.thankYou}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1 flex items-center gap-1.5">
                    <User size={13} className="text-[#7A0000]" />
                    {currentLabels.name} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={!bookingAvailable}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#7A0000] focus:ring-2 focus:ring-[#7A0000]/10 focus:outline-none transition-all text-sm bg-gray-50/50 hover:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder={currentLabels.name}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1 flex items-center gap-1.5">
                    <Phone size={13} className="text-[#7A0000]" />
                    {currentLabels.phone} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    disabled={!bookingAvailable}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#7A0000] focus:ring-2 focus:ring-[#7A0000]/10 focus:outline-none transition-all text-sm bg-gray-50/50 hover:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="98XXXXXXXX"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1 flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#7A0000]" />
                      {currentLabels.date} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      min={today}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      disabled={!bookingAvailable}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none transition-all text-sm bg-gray-50/50 hover:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        form.date && !isDateValidForBooking 
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
                          : form.date && isDateValidForBooking
                          ? 'border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                          : 'border-gray-200 focus:border-[#7A0000] focus:ring-2 focus:ring-[#7A0000]/10'
                      }`}
                      required
                    />
                    {form.date && dateLimitMessage && (
                      <p className={`text-xs mt-1 flex items-center gap-1 ${
                        !isDateValidForBooking ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {!isDateValidForBooking ? (
                          <AlertCircle size={12} />
                        ) : (
                          <Check size={12} />
                        )}
                        {dateLimitMessage}
                      </p>
                    )}
                    {form.date && isDateValidForBooking && dateLimits[form.date] !== undefined && dateLimits[form.date] > 0 && (
                      <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                        <Check size={12} />
                        {dateLimits[form.date]} {currentLabels.slotsAvailable}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1 flex items-center gap-1.5">
                      <Tag size={13} className="text-[#7A0000]" />
                      {currentLabels.pujaType} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      disabled={!bookingAvailable}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#7A0000] focus:ring-2 focus:ring-[#7A0000]/10 focus:outline-none transition-all text-sm bg-gray-50/50 hover:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="">{currentLabels.selectPuja}</option>
                      {types.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1 flex items-center gap-1.5">
                    <FileText size={13} className="text-[#7A0000]" />
                    {currentLabels.description} <span className="text-gray-400 text-[10px]">({currentLabels.optional})</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    disabled={!bookingAvailable}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#7A0000] focus:ring-2 focus:ring-[#7A0000]/10 focus:outline-none transition-all text-sm bg-gray-50/50 hover:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                    placeholder={currentLabels.descriptionPlaceholder}
                    rows={2}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || done || !bookingAvailable || (form.date && !isDateValidForBooking)}
                  className={`w-full py-3 rounded-xl text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all ${
                    bookingAvailable && (!form.date || isDateValidForBooking)
                      ? 'bg-[#7A0000] hover:bg-[#5A0000] shadow-lg shadow-[#7A0000]/20 hover:shadow-xl hover:shadow-[#7A0000]/30' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {currentLabels.booking}
                    </span>
                  ) : (
                    <>
                      {bookingAvailable ? (
                        <>
                          {form.date && !isDateValidForBooking ? (
                            <>
                              <Lock size={16} />
                              {isPastDate(form.date) ? currentLabels.pastDateMsg : currentLabels.limitReached}
                            </>
                          ) : (
                            <>
                              <CalendarDays size={16} />
                              {currentLabels.bookNow}
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <Lock size={16} />
                          {currentLabels.unavailable}
                        </>
                      )}
                    </>
                  )}
                </button>

                {!bookingAvailable && (
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-600 bg-gray-50 py-3 rounded-xl border border-gray-200">
                    <Lock size={13} className="text-gray-400" />
                    <span>{availabilityMessage}</span>
                  </div>
                )}

                {bookingAvailable && form.date && !isDateValidForBooking && (
                  <div className={`flex items-center justify-center gap-2 text-xs py-2 rounded-xl border ${
                    isPastDate(form.date) ? 'text-red-500 bg-red-50 border-red-200' : 'text-red-500 bg-red-50 border-red-200'
                  }`}>
                    <AlertCircle size={13} className="text-red-500" />
                    <span>{dateLimitMessage}</span>
                  </div>
                )}

                {bookingAvailable && (
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Shield size={13} className="text-[#7A0000]" />
                    <span>{currentLabels.secure}</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* My Bookings Section - Downside with ref for scrolling */}
        <div ref={bookingsSectionRef}>
          {showMyBookings && (
            <div className="mt-8 animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100/50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#7A0000]/10 flex items-center justify-center">
                      <CalendarDays size={20} className="text-[#7A0000]" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-gray-800">
                      {currentLabels.myBookings}
                    </h3>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                      {myBookings.length}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => navigate('/mybookings')}
                    className="flex items-center gap-1.5 text-xs text-[#7A0000] hover:text-[#5A0000] font-medium bg-[#7A0000]/10 px-3 py-1.5 rounded-full transition-all hover:bg-[#7A0000]/20"
                  >
                    <ExternalLink size={14} />
                    {t.viewAll || 'View All'}
                  </button>
                </div>

                {loadingBookings ? (
                  <div className="text-center py-8">
                    <OmLoader size="md" color="maroon" className="mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Loading your bookings...</p>
                  </div>
                ) : myBookings.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Calendar size={28} className="text-gray-400" />
                    </div>
                    <h4 className="text-lg font-serif font-semibold text-gray-700">{currentLabels.noBookings}</h4>
                    <p className="text-sm text-gray-400 mt-1">{currentLabels.makeBooking}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myBookings.map((booking) => (
                      <div
                        key={booking._id}
                        ref={(el) => (bookingRefs.current[booking._id] = el)}
                        className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-[#7A0000]/20 group"
                      >
                        <div className={`h-1 w-full ${
                          booking.status === 'confirmed' ? 'bg-green-500' :
                          booking.status === 'completed' ? 'bg-blue-500' :
                          booking.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </div>
                            <span className="text-[8px] text-gray-400 font-mono">
                              #{booking._id.slice(-6)}
                            </span>
                          </div>

                          <div className="mb-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#7A0000] bg-[#7A0000]/10 px-2 py-0.5 rounded-full">
                              <Tag size={10} />
                              {booking.type}
                            </span>
                          </div>

                          <h4 className="text-sm font-semibold text-gray-800 truncate">
                            {booking.name}
                          </h4>

                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                            <Phone size={11} className="text-[#7A0000]" />
                            <span>{booking.phone}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                            <Calendar size={11} className="text-[#7A0000]" />
                            <span>{booking.date}</span>
                          </div>

                          {booking.description && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <p className="text-[10px] text-gray-500 line-clamp-1">
                                {booking.description}
                              </p>
                            </div>
                          )}

                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-[8px] text-gray-400">
                              {formatDate(booking.createdAt)}
                            </span>
                            <button
                              onClick={() => downloadBookingPDF(booking._id)}
                              disabled={downloadingId === booking._id}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                                downloadingId === booking._id
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-[#7A0000]/10 text-[#7A0000] hover:bg-[#7A0000] hover:text-white'
                              }`}
                            >
                              {downloadingId === booking._id ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Download size={12} />
                                  {currentLabels.download}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          width: 0;
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </main>
  );
};

// Helper function for date formatting
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default BookingPage;