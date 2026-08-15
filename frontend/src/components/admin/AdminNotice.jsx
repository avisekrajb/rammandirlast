import React, { useState } from 'react';
import { Save, Eye, EyeOff, Edit, X, QrCode, Upload } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import api from '../../services/api';
import OmLoader from '../../components/common/OmLoader';

const AdminNotice = ({ settings, updateSettings, t }) => {
  const { showToast } = useToast();
  const [activeLang, setActiveLang] = useState('en');
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Initialize notice state with settings or defaults
  const [notice, setNotice] = useState(settings?.notice || {
    enabled: true,
    title: { 
      en: 'Heartfelt Request', 
      ne: 'हार्दिक अनुरोध', 
      hi: 'हार्दिक अनुरोध', 
      zh: '诚挚请求', 
      ta: 'மனமார்ந்த வேண்டுகோள்' 
    },
    banner: { 
      en: "Let's participate in installing the 'Lift'.", 
      ne: "'लिफ्ट' राख्ने कार्यमा सहभागी बनौं ।", 
      hi: "'लिफ्ट' रखने कार्य में सहभागी बनें ।", 
      zh: "让我们参与安装'电梯'。", 
      ta: "'லிஃப்ட்' அமைப்பதில் பங்கேற்போம்." 
    },
    body: { 
      en: 'To make it easier for the elderly and differently-abled to visit and move around at the Shree Ramchandra Temple, we are installing a lift on the eastern side of the temple that can accommodate up to 8 people. The work is expected to be completed within 6 months.',
      ne: 'भगवान् श्रीरामचन्द्रको मन्दिरमा वृद्ध-वृद्धा एवं विकलाङ्गहरूलाई दर्शन एवं आउ-जाउ गर्न सजिलो होस् भनी मन्दिरको ठिक पूर्वपट्टि ८ जनासम्म अटाउने लिफ्टको स्थापना ६ महीनाभित्र सक्ने गरी कार्य अगाडि बढिरहेको सन्दर्भमा यहाँहरूको सहयोगको अपेक्षासाथ यो सूचना जनसमक्ष जारी गरिएको छ ।',
      hi: 'श्रीरामचन्द्र मंदिर में बुजुर्गों और दिव्यांगों को दर्शन और आने-जाने में सुविधा हो, इसके लिए मंदिर के ठीक पूर्व की ओर 8 लोगों तक की क्षमता वाली लिफ्ट स्थापित की जा रही है, जो 6 महीने के भीतर पूरी हो जाएगी।',
      zh: '为了方便老年人和残障人士在室利罗摩钱德拉神庙参观和活动，我们正在神庙东侧安装一部可容纳8人的电梯，预计在6个月内完工。',
      ta: 'ஸ்ரீ ராமச்சந்திர கோயிலில் முதியவர்கள் மற்றும் ஊனமுற்றோர் எளிதில் வந்து செல்லும் வகையில், கோயிலின் கிழக்குப் பக்கத்தில் 8 பேர் பயணிக்கும் வகையில் உள்ள லிஃப்ட் அமைக்கும் பணி 6 மாதங்களில் முடிக்க திட்டமிடப்பட்டுள்ளது.'
    },
    cost: { 
      en: 'The estimated cost for the lift structure is approximately Rs. 55,00,000/- (Fifty-five lakh).',
      ne: 'लिफ्टसहितको संरचनाको लागि करिब रु. ५५,००,०००/- (पचपन्न लाख) पर्ने अनुमान गरिएको छ ।',
      hi: 'लिफ्ट सहित की संरचना के लिए लगभग रु. ५५,००,०००/- (पचपन्न लाख) खर्च होने का अनुमान है।',
      zh: '电梯结构的估计成本约为550万卢比。',
      ta: 'லிஃப்ட் கட்டமைப்பிற்கான மதிப்பீடு ரூ. 55,00,000/- (ஐம்பத்தி ஐந்து லட்சம்) ஆகும்.'
    },
    donors: { 
      en: 'The names of generous donors contributing Rs. 15,000/- (Fifteen thousand) and above will be prominently engraved on a stone plaque on the left side of the lift entrance.',
      ne: 'यस कार्यमा रु. १५,०००/- (पन्ध्र हजार) देखि माथि सहयोग गर्ने उदारमना दाताहरूको नाम लिफ्टको प्रवेशद्वारको वायाँपट्टि आकर्षक रूपले शिलापत्रमा उत्कीर्ण गरी राखिने जानकारी गराउँदछौं ।',
      hi: 'इस कार्य में रु. १५,०००/- (पंद्रह हजार) से अधिक सहयोग करने वाले उदार दाताओं के नाम लिफ्ट के प्रवेश द्वार के बाईं ओर आकर्षक रूप से शिलापत्र पर उत्कीर्ण किए जाएंगे।',
      zh: '捐赠15,000卢比及以上的慷慨捐助者姓名将刻在电梯入口左侧的石碑上。',
      ta: 'ரூ. 15,000/- (பதினைந்து ஆயிரம்) மற்றும் அதற்கு மேல் நன்கொடை அளிக்கும் தாராள மனம் கொண்ட தானியர்களின் பெயர்கள் லிஃப்ட் நுழைவாயிலின் இடது பக்கத்தில் கல்வெட்டில் பொறிக்கப்படும்.'
    },
    applicant: { 
      en: 'Applicant', 
      ne: 'प्रार्थी', 
      hi: 'प्रार्थी', 
      zh: '申请人', 
      ta: 'விண்ணப்பதாரர்' 
    },
    committee: { 
      en: 'Shree Ramchandra Temple Renovation & Development Committee',
      ne: 'श्रीरामचन्द्रमन्दिर जीर्णोद्धार एवं संवर्द्धन समिति',
      hi: 'श्रीरामचन्द्र मंदिर जीर्णोद्धार एवं संवर्द्धन समिति',
      zh: '室利罗摩钱德拉神庙修缮与发展委员会',
      ta: 'ஸ்ரீ ராமச்சந்திர கோயில் புனரமைப்பு மற்றும் மேம்பாட்டுக் குழு'
    },
    location: { 
      en: 'Battisputali, Kathmandu, Nepal', 
      ne: 'बत्तीसपुतली, काठमाडौं, नेपाल', 
      hi: 'बत्तीसपुतली, काठमाडौं, नेपाल', 
      zh: '尼泊尔加德满都巴提斯普塔利', 
      ta: 'பட்டீஸ்புதாலி, காத்மாண்டு, நேபாளம்' 
    },
    contactNo: { 
      en: 'Contact No.', 
      ne: 'सम्पर्क नं.', 
      hi: 'सम्पर्क नं.', 
      zh: '联系电话', 
      ta: 'தொடர்பு எண்' 
    },
    contactDetails: { 
      en: '01-4598526, 9851154432', 
      ne: '01-4598526, 9851154432', 
      hi: '01-4598526, 9851154432', 
      zh: '01-4598526, 9851154432', 
      ta: '01-4598526, 9851154432' 
    },
    qrLabel: { 
      en: 'QR Code', 
      ne: 'क्यू आर कोड', 
      hi: 'क्यू आर कोड', 
      zh: '二维码', 
      ta: 'கியூ ஆர் குறியீடு' 
    },
    donateBtn: { 
      en: 'Donate Now', 
      ne: 'सहयोग गर्नुहोस्', 
      hi: 'सहयोग करें', 
      zh: '立即捐赠', 
      ta: 'தானம் செய்யுங்கள்' 
    },
  });

  // QR Code state
  const [qrPhoto, setQrPhoto] = useState(settings?.donate?.qrPhoto || null);

  const handleSave = async () => {
    try {
      // Save notice settings
      await updateSettings({ notice });
      
      // Save QR photo if changed
      if (qrPhoto !== settings?.donate?.qrPhoto) {
        await updateSettings({ donate: { ...settings?.donate, qrPhoto } });
      }
      
      showToast('Notice settings saved successfully', 'success');
      setEditing(false);
    } catch (error) {
      console.error('Save notice error:', error);
      showToast(error.response?.data?.message || 'Failed to save notice settings', 'error');
    }
  };

  const handleToggle = async () => {
    const newEnabled = !notice.enabled;
    setNotice({ ...notice, enabled: newEnabled });
    try {
      await updateSettings({ notice: { ...notice, enabled: newEnabled } });
      showToast(newEnabled ? 'Notice enabled' : 'Notice disabled', 'success');
    } catch (error) {
      console.error('Toggle notice error:', error);
      showToast('Failed to update notice status', 'error');
      setNotice({ ...notice, enabled: !newEnabled });
    }
  };

  const handleQrUpload = async (e) => {
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

    try {
      const response = await api.post('/admin/upload/qr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setQrPhoto(response.data.url);
      showToast('QR Code uploaded successfully', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      showToast(error.response?.data?.message || 'Failed to upload QR Code', 'error');
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  };

  const handleRemoveQr = async () => {
    if (!window.confirm('Remove QR Code?')) return;
    setQrPhoto(null);
    try {
      await updateSettings({ donate: { ...settings?.donate, qrPhoto: null } });
      showToast('QR Code removed', 'success');
    } catch (error) {
      console.error('Remove QR error:', error);
      showToast('Failed to remove QR Code', 'error');
    }
  };

  const getCurrentValue = (obj) => {
    if (!obj) return '';
    return obj[activeLang] || obj.en || '';
  };

  const updateField = (field, value) => {
    setNotice({
      ...notice,
      [field]: {
        ...notice[field],
        [activeLang]: value,
      },
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-serif font-semibold text-ink">Notice Modal</h4>
          <p className="text-xs text-ink-soft mt-0.5">Manage the notice that appears on website load</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${notice.enabled ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
            {notice.enabled ? 'Active' : 'Disabled'}
          </span>
          <button
            onClick={handleToggle}
            className={`p-2 rounded-lg transition-all ${
              notice.enabled ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {notice.enabled ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button
            onClick={() => setEditing(!editing)}
            className="p-2 rounded-lg bg-vermilion/10 text-vermilion hover:bg-vermilion/20 transition-all"
          >
            {editing ? <X size={18} /> : <Edit size={18} />}
          </button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-4">
          {/* QR Code Upload Section */}
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">QR Code Image</label>
            <div
              className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden h-32 flex items-center justify-center cursor-pointer bg-gray-50 hover:border-vermilion transition-colors"
            >
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleQrUpload} 
                className="hidden" 
                id="qr-upload" 
              />
              <label htmlFor="qr-upload" className="absolute inset-0 flex items-center justify-center cursor-pointer">
                {qrPhoto ? (
                  <img src={qrPhoto} alt="QR" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-ink-soft">
                    <QrCode size={32} />
                    <span className="text-sm font-medium">Click to upload QR Code</span>
                    <span className="text-xs text-ink-soft/60">JPG, PNG, WEBP • Max 5MB</span>
                  </div>
                )}
              </label>
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <OmLoader size="md" color="white" />
                </div>
              )}
              {qrPhoto && !uploading && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs font-bold py-1.5 flex items-center justify-center gap-1.5">
                  <Upload size={13} /> Click to change QR Code
                </div>
              )}
            </div>
            {qrPhoto && (
              <button
                onClick={handleRemoveQr}
                className="mt-2 text-xs text-red-500 hover:text-red-600 transition-colors bg-transparent border-0"
              >
                Remove QR Code
              </button>
            )}
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher active={activeLang} onChange={setActiveLang} t={t} />
          </div>

          {/* All Notice Fields */}
          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Title</label>
            <input
              type="text"
              value={getCurrentValue(notice.title)}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Banner Text</label>
            <input
              type="text"
              value={getCurrentValue(notice.banner)}
              onChange={(e) => updateField('banner', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Body</label>
            <textarea
              rows={4}
              value={getCurrentValue(notice.body)}
              onChange={(e) => updateField('body', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Cost Information</label>
            <textarea
              rows={2}
              value={getCurrentValue(notice.cost)}
              onChange={(e) => updateField('cost', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-ink block mb-1.5">Donor Information</label>
            <textarea
              rows={2}
              value={getCurrentValue(notice.donors)}
              onChange={(e) => updateField('donors', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">Applicant</label>
              <input
                type="text"
                value={getCurrentValue(notice.applicant)}
                onChange={(e) => updateField('applicant', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">Committee</label>
              <input
                type="text"
                value={getCurrentValue(notice.committee)}
                onChange={(e) => updateField('committee', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">Location</label>
              <input
                type="text"
                value={getCurrentValue(notice.location)}
                onChange={(e) => updateField('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">Contact Details</label>
              <input
                type="text"
                value={getCurrentValue(notice.contactDetails)}
                onChange={(e) => updateField('contactDetails', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">QR Label</label>
              <input
                type="text"
                value={getCurrentValue(notice.qrLabel)}
                onChange={(e) => updateField('qrLabel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">Donate Button Text</label>
              <input
                type="text"
                value={getCurrentValue(notice.donateBtn)}
                onChange={(e) => updateField('donateBtn', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-vermilion focus:outline-none text-sm"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-vermilion text-white font-semibold text-sm hover:bg-[#a83a0c] transition-all"
          >
            <Save size={15} /> Save Notice
          </button>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-xs text-ink-soft">Title</span>
              <p className="font-medium">{getCurrentValue(notice.title)}</p>
            </div>
            <div>
              <span className="text-xs text-ink-soft">Status</span>
              <p className={`font-medium ${notice.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                {notice.enabled ? 'Active' : 'Disabled'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-xs text-ink-soft">Banner</span>
              <p className="font-medium">{getCurrentValue(notice.banner)}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-xs text-ink-soft">QR Code</span>
              <div className="flex items-center gap-2 mt-1">
                {qrPhoto ? (
                  <img src={qrPhoto} alt="QR" className="w-12 h-12 rounded object-cover border border-gray-200" />
                ) : (
                  <span className="text-ink-soft text-xs">No QR Code uploaded</span>
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <span className="text-xs text-ink-soft">Contact</span>
              <p className="font-medium">{getCurrentValue(notice.contactDetails)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotice;