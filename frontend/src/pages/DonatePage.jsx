import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import OmLoader from '../components/common/OmLoader';
import PageHero from '../components/common/PageHero';
import DonationReceipt from '../components/common/DonationReceipt';
import { 
  QrCode, 
  Users, 
  Gift, 
  AlertCircle, 
  Check, 
  Hand,
  Building2,
  Smartphone,
  Wallet,
  User,
  Calendar,
  Clock,
  Heart,
  Loader2,
  Shield,
  Lock,
  Sparkles,
  ArrowRight,
  Banknote,
  Send,
  MessageCircle,
  FileText,
  Download,
  Printer,
  RefreshCw
} from 'lucide-react';

// Payment icons from public folder
const PaymentIcons = {
  esewa: '/esewa.jpeg',
  khalti: '/khalti.jpeg',
  ips: 'https://login.connectips.com/static/media/newLogo.ed7f73c800e12259be50.png',
  bank: 'https://cdn-icons-png.flaticon.com/512/1011/1011876.png',
};

const DonatePage = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [settings, setSettings] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('esewa');
  const [amount, setAmount] = useState(501);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showRedirect, setShowRedirect] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentDonation, setCurrentDonation] = useState(null);
  const [qrPhoto, setQrPhoto] = useState(null);
  const [qrLoading, setQrLoading] = useState(true);

  const tiers = [108, 501, 1100, 2100, 5100, 11000];

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  // Fetch QR photo from public settings endpoint
  useEffect(() => {
    const fetchQR = async () => {
      try {
        const response = await api.get('/admin/settings');
        const qrUrl = response.data?.donate?.qrPhoto || null;
        setQrPhoto(qrUrl);
        setQrLoading(false);
        console.log('QR Photo URL (public):', qrUrl);
      } catch (error) {
        console.error('Error fetching QR:', error);
        setQrLoading(false);
      }
    };
    fetchQR();
  }, []);

  // Fetch settings only
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

  // Helper to get full Cloudinary URL
  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/')) {
      const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dibusz4ag';
      return `https://res.cloudinary.com/${cloudName}/image/upload/${url}`;
    }
    return url;
  };

  const displayQrPhoto = getFullImageUrl(qrPhoto);

  const handleEsewaPayment = async () => {
    if (!user) {
      showToast(t.loginRequiredDonate || 'Please login to donate', 'warning');
      navigate('/');
      return;
    }

    if (!amount || Number(amount) < 1) {
      showToast(t.validAmount || 'Please enter a valid amount', 'error');
      return;
    }

    setPaymentProcessing(true);
    setShowRedirect(true);

    try {
      const response = await api.post('/payment/esewa/initiate', {
        amount: Number(amount),
        name: name || user.name,
        email: email || user.email,
        phone: phone || user.phone,
        message: message || '',
      });

      if (!response.data.success) {
        showToast(response.data.message || 'Payment initiation failed', 'error');
        setPaymentProcessing(false);
        setShowRedirect(false);
        return;
      }

      const { data, url, donationId } = response.data;

      localStorage.setItem('pendingDonationId', donationId);
      localStorage.setItem('pendingDonationAmount', amount);

      setTimeout(() => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url;

        Object.entries(data).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        setPaymentProcessing(false);
        setShowRedirect(false);
      }, 3000);

    } catch (error) {
      console.error('Payment initiation error:', error);
      showToast(error.response?.data?.message || 'Payment initiation failed', 'error');
      setPaymentProcessing(false);
      setShowRedirect(false);
    }
  };

  const handleDonate = async () => {
    if (!user) {
      showToast(t.loginRequiredDonate || 'Please login to donate', 'warning');
      navigate('/');
      return;
    }

    if (selectedMethod === 'esewa') {
      await handleEsewaPayment();
      return;
    }

    if (selectedMethod === 'khalti' || selectedMethod === 'ips') {
      showToast(`${selectedMethod.toUpperCase()} coming soon!`, 'info');
      return;
    }

    if (!amount || Number(amount) < 1) {
      showToast(t.validAmount || 'Please enter a valid amount', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/donations', { 
        amount: Number(amount),
        paymentMethod: selectedMethod,
        name: name || user?.name || 'Anonymous',
        email: email || user?.email || '',
        phone: phone || user?.phone || '',
        message: message || '',
      });
      
      setDone(true);
      
      // Set current donation for receipt
      setCurrentDonation(response.data);
      setShowReceipt(true);
      
      showToast(t.donateThanks || `NPR ${amount} — Thank you for your generous donation!`, 'success');
      
      // Send email with PDF receipt
      try {
        await api.post('/donations/send-email-with-pdf', {
          donationId: response.data._id,
          email: email || user?.email,
          name: name || user?.name,
          amount: Number(amount)
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }
      
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (error) {
      console.error('Donation error:', error);
      showToast(error.response?.data?.message || 'Donation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    {
      id: 'esewa',
      name: 'eSewa',
      icon: <img src={PaymentIcons.esewa} alt="eSewa" className="w-8 h-8 object-contain" />,
      color: '#60BB46',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      description: 'Pay with eSewa wallet',
      available: true
    },
    {
      id: 'khalti',
      name: 'Khalti',
      icon: <img src={PaymentIcons.khalti} alt="Khalti" className="w-8 h-8 object-contain" />,
      color: '#5C2D91',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300',
      description: 'Coming Soon',
      available: false
    },
    {
      id: 'ips',
      name: 'IPS',
      icon: <img src={PaymentIcons.ips} alt="IPS" className="w-8 h-8 object-contain" />,
      color: '#1a56db',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      description: 'Coming Soon',
      available: false
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: <Banknote size={24} className="text-gray-600" />,
      color: '#059669',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-300',
      description: 'Direct bank transfer',
      available: true
    }
  ];

  // Redirect overlay
  if (showRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(180deg, #faf8f5 0%, #ffffff 50%, #faf8f5 100%)" }}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <OmLoader size="lg" color="green" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-ink mb-2">Redirecting to eSewa...</h2>
          <p className="text-ink-soft">Please wait while we redirect you to the payment gateway.</p>
          <div className="mt-4 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full animate-[progress_3s_ease-in-out]" />
          </div>
          <p className="text-xs text-ink-soft/60 mt-3">You will be redirected in a moment...</p>
        </div>
        <style>{`
          @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #faf8f5 0%, #ffffff 50%, #faf8f5 100%)" }}>
      
      <PageHero 
        title={t.donateTitle || 'Support the Temple'} 
        sub={t.donateIntro || 'Your contribution helps preserve this sacred place'} 
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid lg:grid-cols-5 gap-8 items-start">

          {/* Left Column - Donation Form */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-10"
          >
            {done && (
              <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 mb-6 border border-green-200">
                <Check size={16} /> {t.donateThanks || 'Thank you for your generous donation!'}
              </div>
            )}

            <h2 className="font-serif text-2xl sm:text-3xl mb-6" style={{ color: "#7A0000" }}>
              {t.donateTitle || 'Make a Donation'}
            </h2>

            {/* eSewa Secure Badge */}
            {selectedMethod === 'esewa' && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <Lock size={14} className="text-green-600" />
                <span className="text-xs text-green-700 font-medium">Secured by eSewa</span>
                <span className="text-xs text-green-600 ml-auto">Test Mode</span>
              </div>
            )}

            <p className="text-xs font-medium text-mute mb-3 uppercase tracking-wider">
              {t.quickAmounts || 'Quick Amounts'}
            </p>
            
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {tiers.map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className="py-3 px-2 rounded-lg border text-sm font-semibold transition-all duration-200 hover:shadow-md"
                  style={{
                    background: amount === v ? "#7A0000" : "#fff",
                    color: amount === v ? "#fff" : "#333",
                    borderColor: amount === v ? "#7A0000" : "#e5e5e5",
                  }}
                >
                  NPR {v.toLocaleString()}
                </button>
              ))}
            </div>

            <p className="text-xs text-mute text-center mb-4">{t.or || 'or'}</p>

            <div className="mb-6">
              <label className="block text-xs font-medium text-mute mb-1.5 uppercase tracking-wider">
                {t.customAmount || 'Custom Amount'} (NPR)
              </label>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#7A0000] focus:ring-2 focus:ring-[#7A0000]/20 outline-none transition-all"
                placeholder="Enter amount"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-mute mb-1.5 uppercase tracking-wider">
                  {t.yourName || 'Your Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#7A0000] focus:ring-2 focus:ring-[#7A0000]/20 outline-none transition-all"
                  placeholder="Your Name"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-mute mb-1.5 uppercase tracking-wider">
                  {t.yourEmail || 'Your Email'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#7A0000] focus:ring-2 focus:ring-[#7A0000]/20 outline-none transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-mute mb-1.5 uppercase tracking-wider">
                  {t.phoneNumber || 'Phone Number'}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#7A0000] focus:ring-2 focus:ring-[#7A0000]/20 outline-none transition-all"
                  placeholder="98XXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-mute mb-1.5 uppercase tracking-wider">
                  Message (Optional)
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#7A0000] focus:ring-2 focus:ring-[#7A0000]/20 outline-none transition-all"
                  placeholder="Your message..."
                />
              </div>
            </div>

            <button
              onClick={handleDonate}
              disabled={loading || done || paymentProcessing}
              className="w-full px-8 py-3.5 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: selectedMethod === 'esewa' ? '#60BB46' : '#7A0000' }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.background = selectedMethod === 'esewa' ? '#4CAF50' : '#5a0000'; 
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.background = selectedMethod === 'esewa' ? '#60BB46' : '#7A0000'; 
              }}
            >
              {loading || paymentProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t.processing || 'Processing...'}
                </>
              ) : (
                <>
                  {selectedMethod === 'esewa' && <img src={PaymentIcons.esewa} alt="eSewa" className="w-5 h-5 object-contain" />}
                  {selectedMethod === 'khalti' && <img src={PaymentIcons.khalti} alt="Khalti" className="w-5 h-5 object-contain" />}
                  {selectedMethod === 'ips' && <img src={PaymentIcons.ips} alt="IPS" className="w-5 h-5 object-contain" />}
                  {selectedMethod === 'bank' && <Banknote size={16} />}
                  {selectedMethod === 'esewa' ? 'Pay with eSewa' : 
                   selectedMethod === 'khalti' ? 'Coming Soon' :
                   selectedMethod === 'ips' ? 'Coming Soon' :
                   t.donateBtn || 'Donate Now'}
                </>
              )}
            </button>
            
            {!user && (
              <p className="text-xs text-ink-soft mt-3 text-center">
                <AlertCircle size={12} className="inline mr-1" />
                {t.loginRequiredDonate || 'Please login to record your donation'}
              </p>
            )}

            {selectedMethod === 'esewa' && (
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-700 text-center">
                  <Shield size={12} className="inline mr-1" />
                  Test eSewa: 9806800001 / 123456 / MPIN: 1122
                </p>
                <p className="text-xs text-amber-600 text-center mt-1">
                  Use these credentials to test the payment
                </p>
              </div>
            )}

            {(selectedMethod === 'khalti' || selectedMethod === 'ips') && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 text-center">
                  <Clock size={12} className="inline mr-1" />
                  {selectedMethod.toUpperCase()} integration coming soon. Please use eSewa or Bank Transfer.
                </p>
              </div>
            )}
          </motion.div>

          {/* Right Column */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Payment Methods */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
              <h3 className="font-serif text-lg mb-4" style={{ color: "#7A0000" }}>
                {t.paymentMethods || 'Payment Methods'}
              </h3>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div 
                    key={method.id}
                    onClick={() => method.available && setSelectedMethod(method.id)}
                    className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedMethod === method.id 
                        ? `${method.bgColor} ${method.borderColor} border-2` 
                        : method.available ? 'border-gray-100 hover:border-gray-300' : 'border-gray-100 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-white border border-gray-100">
                      {method.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-ink">{method.name}</span>
                        {selectedMethod === method.id && (
                          <Check size={16} className="text-green-500" />
                        )}
                        {!method.available && (
                          <span className="text-[10px] font-semibold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Soon</span>
                        )}
                      </div>
                      <p className="text-xs text-mute truncate">{method.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Code - Publicly visible */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 text-center">
              <h3 className="font-serif text-lg mb-4" style={{ color: "#7A0000" }}>
                {t.scanQR || 'Scan to Pay'}
              </h3>
              <div className="mx-auto w-44 h-44 bg-gray-50 rounded-xl grid place-items-center border border-gray-200 overflow-hidden relative">
                {qrLoading ? (
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    <OmLoader size="md" color="maroon" />
                    <p className="text-xs text-gray-400 mt-2">Loading QR...</p>
                  </div>
                ) : displayQrPhoto ? (
                  <img 
                    src={displayQrPhoto} 
                    alt="QR Code" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('QR image failed to load:', displayQrPhoto);
                      e.target.style.display = 'none';
                      const parent = e.target.parentElement;
                      const fallback = document.createElement('div');
                      fallback.className = 'flex flex-col items-center justify-center w-full h-full';
                      fallback.innerHTML = `
                        <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h-2m2 0h2M4 12v1m4 0h4m-4 0v4m0-4h-2" />
                        </svg>
                        <p class="text-xs text-gray-400 mt-1">QR Code not available</p>
                        <button class="mt-2 text-xs text-[#7A0000] hover:underline flex items-center gap-1" onclick="window.location.reload()">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh
                        </button>
                      `;
                      parent.appendChild(fallback);
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    <QrCode size={48} className="text-gray-300" />
                    <p className="text-xs text-gray-400 mt-2">No QR Code uploaded</p>
                    <p className="text-[10px] text-gray-300 mt-1">Please check back later</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-mute mt-3">eSewa / Khalti / IPS / FonePay</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Donation Receipt Modal */}
      {showReceipt && currentDonation && (
        <DonationReceipt
          donation={currentDonation}
          onClose={() => {
            setShowReceipt(false);
            setCurrentDonation(null);
          }}
          settings={settings}
        />
      )}
    </div>
  );
};

export default DonatePage;