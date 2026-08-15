// pages/HistoryPage.jsx - Updated with Glowing Gas/Aura effects on photos and text-justify alignment
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import OmLoader from '../components/common/OmLoader';
import { Clock } from 'lucide-react';

// Helper to get localized text
const getLocalizedText = (obj, lang) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || '';
};

// ===== HISTORY HERO COMPONENT =====
function HistoryHero({ bannerImage, title, intro }) {
  const { lang } = useLanguage();
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const smooth = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });
  const imgScale = useTransform(smooth, [0, 1], [1, 1.16]);
  const overlayOp = useTransform(smooth, [0, 0.7], [0.32, 0.72]);
  const textY = useTransform(smooth, [0, 1], ["0%", "-26%"]);
  const textOpacity = useTransform(smooth, [0, 0.5], [1, 0]);

  const titleText = getLocalizedText(title, lang) || 'Our History';
  const introText = getLocalizedText(intro, lang) || 'A journey of faith, community, and unbroken tradition spanning generations.';
  const imageSrc = bannerImage || '';

  return (
    <div ref={ref} className="relative w-full overflow-hidden" style={{ height: "100svh", minHeight: 520 }}>
      {imageSrc ? (
        <motion.img
          src={imageSrc}
          alt=""
          aria-hidden
          style={{ scale: imgScale }}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none origin-center"
          onError={(e) => {
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            const fallback = document.createElement('div');
            fallback.className = 'absolute inset-0 bg-gradient-to-br from-maroon/80 to-maroon-deep/90';
            parent.appendChild(fallback);
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-maroon/80 to-maroon-deep/90" />
      )}
      
      <motion.div className="absolute inset-0" style={{ background: "rgba(0,0,0,1)", opacity: overlayOp }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.08) 45%, transparent 70%)" }} />
      
      <motion.div style={{ y: textY, opacity: textOpacity }} className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="font-serif text-5xl sm:text-6xl lg:text-7xl text-white font-light leading-tight drop-shadow-2xl mb-6"
        >
          {titleText}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55 }}
          className="text-white/70 text-base sm:text-lg max-w-xl leading-relaxed text-justify"
        >
          {introText}
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        style={{ opacity: textOpacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-white/40 text-xs uppercase tracking-widest" style={{ fontFamily: "serif" }}>scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          style={{ width: 1, height: 32, background: "linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)" }}
        />
      </motion.div>
    </div>
  );
}

// ===== FOUNDER SECTION =====
function FounderSection({ lang, settings }) {
  const [founderData, setFounderData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFounder = useCallback(async () => {
    try {
      const response = await api.get('/admin/team');
      const teamMembers = response.data || [];
      const founder = teamMembers.find(member => 
        member.roleType === 'founder' && member.enabled !== false
      );
      setFounderData(founder);
    } catch (error) {
      console.error('Error fetching founder:', error);
      setFounderData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFounder();
  }, [fetchFounder]);

  if (loading) {
    return (
      <div className="py-20 px-4 sm:px-6 bg-gradient-to-b from-white to-[#faf8f5]">
        <div className="max-w-6xl mx-auto text-center">
          <OmLoader size="md" color="maroon" className="mx-auto" />
        </div>
      </div>
    );
  }

  if (!founderData) {
    return null;
  }

  const nameText = getLocalizedText(founderData.name, lang);
  const titleText = getLocalizedText(founderData.role, lang) || 
    (lang === 'ne' ? 'निर्माणकर्ता / संरक्षक' :
     lang === 'hi' ? 'संस्थापक / संरक्षक' :
     lang === 'zh' ? '创始人 / 赞助人' :
     lang === 'ta' ? 'நிறுவனர் / புரவலர்' :
     'Founder / Patron');
  const bioText = getLocalizedText(founderData.bio, lang);
  const photoUrl = founderData.photo || '';

  const introAbove = settings?.founder?.intro || {
    en: 'The temple\'s rich history is woven with stories of devotion, community service, and unwavering faith. Generation after generation, this sacred place has been a beacon of hope and spiritual solace for countless devotees.',
    ne: 'मन्दिरको समृद्ध इतिहास भक्ति, समुदाय सेवा र अटल विश्वासका कथाहरूले बुनेको छ। पुस्ता पछि पुस्ता, यो पवित्र स्थान अनगिन्ती भक्तहरूको लागि आशा र आध्यात्मिक सान्त्वनाको प्रकाशस्तम्भ भएको छ।',
    hi: 'मंदिर का समृद्ध इतिहास भक्ति, सामुदायिक सेवा और अटूट विश्वास की कहानियों से बुना गया है। पीढ़ी दर पीढ़ी, यह पवित्र स्थान अनगिनत भक्तों के लिए आशा और आध्यात्मिक सांत्वना का प्रकाशस्तंभ रहा है।',
    zh: '寺庙丰富的历史由奉献、社区服务和坚定信仰的故事编织而成。一代又一代，这个神圣的地方一直是无数信徒希望和精神慰藉的灯塔。',
    ta: 'கோயிலின் வளமான வரலாறு பக்தி, சமூக சேவை மற்றும் உறுதியான நம்பிக்கையின் கதைகளால் பின்னப்பட்டுள்ளது. தலைமுறை தலைமுறையாக, இந்த புனித இடம் எண்ணற்ற பக்தர்களுக்கு நம்பிக்கை மற்றும் ஆன்மீக ஆறுதலின் ஒளிவிளக்காக இருந்து வருகிறது.'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-20 px-4 sm:px-6 bg-gradient-to-b from-white to-[#faf8f5]"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <p className="text-ink-soft text-base sm:text-lg leading-relaxed italic text-justify">
            "{getLocalizedText(introAbove, lang)}"
          </p>
          <div className="w-24 h-px bg-maroon/20 mx-auto mt-8" />
        </motion.div>

        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl text-maroon">
            {lang === 'ne' ? 'संस्थापक' :
             lang === 'hi' ? 'संस्थापक' :
             lang === 'zh' ? '创始人' :
             lang === 'ta' ? 'நிறுவனர்' :
             'Founder'}
          </h2>
          <div className="w-16 h-0.5 bg-maroon/30 mx-auto mt-3 rounded-full" />
        </div>

        <div className="cursor-default">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center bg-white rounded-2xl overflow-hidden shadow-xl border-2 border-[#8B3A3A]">
            <div className="relative aspect-square bg-gradient-to-br from-maroon/10 to-maroon-deep/10 overflow-hidden">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={nameText}
                  className="w-full h-full object-cover transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-maroon/5 to-maroon-deep/10">
                  <span className="text-8xl text-maroon/20 font-serif">🕉️</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="inline-block px-4 py-2 bg-maroon/90 text-white text-xs font-medium tracking-wider uppercase rounded-lg backdrop-blur-sm">
                  {lang === 'ne' ? 'संस्थापक / संरक्षक' :
                   lang === 'hi' ? 'संस्थापक / संरक्षक' :
                   lang === 'zh' ? '创始人 / 赞助人' :
                   lang === 'ta' ? 'நிறுவனர் / புரவலர்' :
                   'Founder / Patron'}
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-ink-soft/60 font-medium uppercase tracking-wider">
                  {lang === 'ne' ? 'संस्थापक' :
                   lang === 'hi' ? 'संस्थापक' :
                   lang === 'zh' ? '创始人' :
                   lang === 'ta' ? 'நிறுவனர்' :
                   'Founder'}
                </span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-maroon leading-tight">
                {nameText || 'Unknown'}
              </h3>

              {titleText && (
                <p className="text-ink-soft/70 text-base sm:text-lg font-medium">
                  {titleText}
                </p>
              )}

              {bioText && (
                <p className="text-ink-soft/80 leading-relaxed text-base sm:text-lg text-justify">
                  {bioText}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ===== TIMELINE COMPONENT =====
function TimelineSection({ items, lang }) {
  if (!items || items.length === 0) return null;

  const filteredItems = items.filter(item => item.enabled !== false);

  if (filteredItems.length === 0) return null;

  const timelineTitle = {
    en: 'The Temple Through the Ages',
    ne: 'युगौंयुगौंसम्म मन्दिर',
    hi: 'युगों-युगों तक मंदिर',
    zh: '穿越时代的寺庙',
    ta: 'காலங்கள் வழியாக கோயில்'
  };

  return (
    <div className="py-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-3xl sm:text-4xl text-ink">
            {getLocalizedText(timelineTitle, lang)}
          </h2>
        </motion.div>

        <div className="space-y-24">
          {filteredItems.map((item, index) => {
            const titleText = getLocalizedText(item.title, lang) || getLocalizedText(item.period, lang) || 'History';
            const descText = getLocalizedText(item.desc, lang) || '';
            const periodText = getLocalizedText(item.period, lang) || '';
            const imageSrc = item.photo || '';
            const formattedNumber = String(index + 1).padStart(2, '0');

            return (
              <motion.div
                key={item._id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                className={`grid md:grid-cols-2 gap-10 lg:gap-16 items-center ${
                  index % 2 !== 0 ? 'md:[&>*:first-child]:order-2' : ''
                }`}
              >
                <motion.div
                  className="rounded-xl overflow-hidden shadow-2xl relative min-h-[300px]"
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Glowing Gas/Aura effect container */}
                  <div className="relative w-full h-80 rounded-xl overflow-hidden">
                    {/* Outer glow layer - yellow/golden gas effect */}
                    <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-yellow-400/30 via-amber-400/40 to-yellow-500/30 blur-2xl animate-pulse" />
                    
                    {/* Second glow layer for more gas effect */}
                    <div className="absolute -inset-2 rounded-xl bg-gradient-to-tr from-amber-300/20 via-yellow-200/30 to-orange-300/20 blur-xl" />
                    
                    {/* Inner glow layer */}
                    <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-yellow-500/20 via-amber-400/20 to-yellow-600/20 blur-lg" />
                    
                    {/* Image container with border */}
                    <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-[#8B3A3A] shadow-[0_0_40px_rgba(255,200,0,0.15)]">
                      {imageSrc ? (
                        <img 
                          src={imageSrc} 
                          alt={titleText}
                          loading="lazy" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            const fallback = document.createElement('div');
                            fallback.className = 'w-full h-full flex items-center justify-center bg-gradient-to-br from-maroon/20 to-maroon-deep/20';
                            fallback.innerHTML = '<span class="text-ink-soft/30 text-4xl font-serif">🕉️</span>';
                            parent.appendChild(fallback);
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-maroon/10 to-maroon-deep/10">
                          <span className="text-4xl text-ink-soft/20">🕉️</span>
                        </div>
                      )}
                      {item.year && (
                        <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-lg text-xs font-bold z-10">
                          {item.year}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                <div className="flex flex-col justify-center space-y-4">
                  <div className="flex items-center gap-3">
                    <span 
                      className="text-4xl sm:text-5xl font-serif font-bold tracking-wider"
                      style={{ 
                        color: '#b8956a',
                        opacity: 0.5,
                        filter: 'blur(0.5px)',
                        textShadow: '0 1px 2px rgba(184, 149, 106, 0.1)'
                      }}
                    >
                      {formattedNumber}
                    </span>
                    <span className="w-12 h-px bg-maroon/20" />
                    <Clock size={16} className="text-ink-soft" />
                    {periodText && (
                      <span className="text-sm text-ink-soft font-medium">{periodText}</span>
                    )}
                  </div>
                  <h2 className="font-serif text-3xl sm:text-4xl text-maroon">
                    {titleText}
                  </h2>
                  {descText && (
                    <p className="text-ink-soft leading-relaxed text-base sm:text-lg text-justify">
                      {descText}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===== STATS COUNTER =====
const AnimatedCounter = ({ target, label, suffix = '', lang }) => {
  const [count, setCount] = useState(0);
  const counterRef = useRef(null);
  const animated = useRef(false);

  const formatNumber = (num, lang) => {
    if (lang === 'ne' || lang === 'hi') {
      const devanagari = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
      return String(num).replace(/\d/g, d => devanagari[parseInt(d)]);
    }
    if (lang === 'ta') {
      const tamil = ['௦', '௧', '௨', '௩', '௪', '௫', '௬', '௭', '௮', '௯'];
      return String(num).replace(/\d/g, d => tamil[parseInt(d)]);
    }
    return num;
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animated.current) {
            animated.current = true;
            let start = 0;
            const duration = 2000;
            const step = Math.max(1, Math.floor(target / 60));
            const interval = Math.floor(duration / 60);

            const timer = setInterval(() => {
              start += step;
              if (start >= target) {
                setCount(target);
                clearInterval(timer);
              } else {
                setCount(start);
              }
            }, interval);

            return () => clearInterval(timer);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => {
      if (counterRef.current) {
        observer.unobserve(counterRef.current);
      }
    };
  }, [target]);

  const displayCount = formatNumber(count, lang);
  const displaySuffix = lang === 'ne' || lang === 'hi' || lang === 'ta' ? suffix : suffix;

  return (
    <div ref={counterRef} className="text-center">
      <div className="text-2xl sm:text-3xl font-serif font-bold text-maroon">
        {displayCount}{displaySuffix}
      </div>
      <div className="text-xs text-ink-soft mt-1">{label}</div>
    </div>
  );
};

// ===== HISTORICAL TABLE COMPONENT =====
function HistoricalTable({ lang }) {
  const historicalData = [
    {
      year: '1871',
      nameOfShrine: {
        en: 'Rāmacandra temple with Rāma, Sītā, Lakṣmaṇa, Bharata and Śatrughna, along with Hanūmān and Pañcāyana',
        ne: 'राम, सीता, लक्ष्मण, भरत र शत्रुघ्न सहित रामचन्द्र मन्दिर, हनुमान र पञ्चायन सहित',
        hi: 'राम, सीता, लक्ष्मण, भरत और शत्रुघ्न के साथ रामचन्द्र मंदिर, हनुमान और पञ्चायन के साथ',
        zh: '罗摩钱德拉神庙，供奉罗摩、悉多、罗什曼那、巴拉塔和沙特鲁格纳，以及哈努曼和潘查亚那',
        ta: 'ராம, சீதா, லக்ஷ்மண, பரத மற்றும் சத்ருக்ன மற்றும் ஹனுமான் மற்றும் பாஞ்சாயன உடன் ராமச்சந்திர கோயில்'
      },
      founder: {
        en: 'Sanak Siṃha',
        ne: 'सनक सिंह',
        hi: 'सनक सिंह',
        zh: '萨纳克·辛哈',
        ta: 'சனக் சிம்ஹ'
      },
      remarks: {
        en: '',
        ne: '',
        hi: '',
        zh: '',
        ta: ''
      }
    },
    {
      year: '1876',
      nameOfShrine: {
        en: 'Sanaksimheśvara, Sāradēśvara, Santakumāreśvara and Bālakumāreśvara',
        ne: 'सनकसिम्हेश्वर, सारदेश्वर, सन्तकुमारेश्वर र बालकुमारेश्वर',
        hi: 'सनकसिम्हेश्वर, सारदेश्वर, सन्तकुमारेश्वर और बालकुमारेश्वर',
        zh: '萨纳克西姆赫什瓦拉、萨拉德什瓦拉、桑塔库玛雷什瓦拉和巴拉库玛雷什瓦拉',
        ta: 'சனக்சிம்ஹேஸ்வர, ஸாரதேஸ்வர, ஸந்தகுமாரேஸ்வர மற்றும் பாலகுமாரேஸ்வர'
      },
      founder: {
        en: 'The founder is not named in the inscription',
        ne: 'अभिलेखमा संस्थापकको नाम उल्लेख गरिएको छैन',
        hi: 'शिलालेख में संस्थापक का नाम नहीं दिया गया है',
        zh: '铭文中未提及创始人姓名',
        ta: 'கல்வெட்டில் நிறுவனர் பெயர் குறிப்பிடப்படவில்லை'
      },
      remarks: {
        en: 'Votive liṅgas for Sanak Siṃha and three of his wives. The fourth wife, Harṣa Kumārī, must still have been living in 1876.',
        ne: 'सनक सिंह र उनका तीन पत्नीहरूको लागि वोटिभ लिङ्गहरू। चौथी पत्नी, हर्ष कुमारी, 1876 मा अझै जीवित रहेकी हुनुपर्छ।',
        hi: 'सनक सिंह और उनकी तीन पत्नियों के लिए वोटिव लिंग। चौथी पत्नी, हर्ष कुमारी, 1876 में अभी भी जीवित रही होगी।',
        zh: '为萨纳克·辛哈和他的三位妻子供奉的还愿林伽。第四位妻子哈尔莎·库玛丽在1876年应该还活着。',
        ta: 'சனக் சிம்ஹ மற்றும் அவரது மூன்று மனைவிகளுக்கான வோட்டிவ லிங்கங்கள். நான்காவது மனைவி, ஹர்ஷ குமாரி, 1876 இல் இன்னும் உயிருடன் இருந்திருக்க வேண்டும்.'
      }
    },
    {
      year: '1894',
      nameOfShrine: {
        en: 'Harṣakumāreśvara, Yaśoddharādeśvara, Lakṣmīkumāreśvara and Nārāyaṇa',
        ne: 'हर्षकुमारेश्वर, यशोद्धरादेश्वर, लक्ष्मीकुमारेश्वर र नारायण',
        hi: 'हर्षकुमारेश्वर, यशोद्धरादेश्वर, लक्ष्मीकुमारेश्वर और नारायण',
        zh: '哈尔莎库玛雷什瓦拉、雅肖达拉德什瓦拉、拉克什米库玛雷什瓦拉和纳拉亚纳',
        ta: 'ஹர்ஷகுமாரேஸ்வர, யசோத்தராதேஸ்வர, லக்ஷ்மீகுமாரேஸ்வர மற்றும் நாராயண'
      },
      founder: {
        en: 'Mahendra Dhvaja, son of a daughter of Sanak Siṃha',
        ne: 'सनक सिंहकी छोरीका छोरा महेन्द्र ध्वज',
        hi: 'सनक सिंह की पुत्री के पुत्र महेन्द्र ध्वज',
        zh: '萨纳克·辛哈女儿之子马亨德拉·德瓦贾',
        ta: 'சனக் சிம்ஹவின் மகளின் மகன் மகேந்திர த்வஜ'
      },
      remarks: {
        en: 'Harṣa Kumārī is the wife of Sanak Siṃha. Lakṣmi Kumari is the sister of Mahendra Dhvaja. The kin relationship of the others is unknown.',
        ne: 'हर्ष कुमारी सनक सिंहकी पत्नी हुन्। लक्ष्मी कुमारी महेन्द्र ध्वजकी बहिनी हुन्। अरूको नाता अज्ञात छ।',
        hi: 'हर्ष कुमारी सनक सिंह की पत्नी हैं। लक्ष्मी कुमारी महेन्द्र ध्वज की बहन हैं। अन्य का रिश्ता अज्ञात है।',
        zh: '哈尔莎·库玛丽是萨纳克·辛哈的妻子。拉克什米·库玛丽是马亨德拉·德瓦贾的妹妹。其他人的亲属关系不详。',
        ta: 'ஹர்ஷ குமாரி சனக் சிம்ஹவின் மனைவி. லக்ஷ்மி குமாரி மகேந்திர த்வஜவின் சகோதரி. மற்றவர்களின் உறவு தெரியவில்லை.'
      }
    },
    {
      year: '1922',
      nameOfShrine: {
        en: 'Mahākumāreśvara and Koslendraśvara',
        ne: 'महाकुमारेश्वर र कोस्लेन्द्रेश्वर',
        hi: 'महाकुमारेश्वर और कोस्लेन्द्रेश्वर',
        zh: '马哈库玛雷什瓦拉和科斯伦德拉什瓦拉',
        ta: 'மஹாகுமாரேஸ்வர மற்றும் கோஸ்லேந்திரேஸ்வர'
      },
      founder: {
        en: 'Mahākumārī Devī, daughter of Sanak Siṃha',
        ne: 'सनक सिंहकी छोरी महाकुमारी देवी',
        hi: 'सनक सिंह की पुत्री महाकुमारी देवी',
        zh: '萨纳克·辛哈之女玛哈库玛丽·德维',
        ta: 'சனக் சிம்ஹவின் மகள் மஹாகுமாரி தேவி'
      },
      remarks: {
        en: '',
        ne: '',
        hi: '',
        zh: '',
        ta: ''
      }
    },
    {
      year: '1924',
      nameOfShrine: {
        en: 'Mahendradhvajamukteśvara, Indradhvaja-teśvara, Indradhvaja-mukteśvara and Padma-kumārīmukteśvara',
        ne: 'महेन्द्रध्वजमुक्तेश्वर, इन्द्रध्वज-तेश्वर, इन्द्रध्वज-मुक्तेश्वर र पद्म-कुमारीमुक्तेश्वर',
        hi: 'महेन्द्रध्वजमुक्तेश्वर, इन्द्रध्वज-तेश्वर, इन्द्रध्वज-मुक्तेश्वर और पद्म-कुमारीमुक्तेश्वर',
        zh: '马亨德拉德瓦贾穆克特什瓦拉、因德拉德瓦贾-特什瓦拉、因德拉德瓦贾-穆克特什瓦拉和帕德玛-库玛丽穆克特什瓦拉',
        ta: 'மகேந்திரத்வஜமுக்தேஸ்வர, இந்திரத்வஜ-தேஸ்வர, இந்திரத்வஜ-முக்தேஸ்வர மற்றும் பத்ம-குமாரிமுக்தேஸ்வர'
      },
      founder: {
        en: 'Nīla Dhvaja Varmaṇa, son of Mahendra Dhvaja and great-grandson of Indra Dhvaja',
        ne: 'महेन्द्र ध्वजका छोरा र इन्द्र ध्वजका परपौत्र नीला ध्वज वर्मण',
        hi: 'महेन्द्र ध्वज के पुत्र और इन्द्र ध्वज के परपौत्र नीला ध्वज वर्मण',
        zh: '马亨德拉·德瓦贾之子、因德拉·德瓦贾之曾孙尼拉·德瓦贾·瓦尔马纳',
        ta: 'மகேந்திர த்வஜவின் மகன் மற்றும் இந்திர த்வஜவின் கொள்ளுப்பேத்தி நீல த்வஜ வர்மண'
      },
      remarks: {
        en: 'Padma Kumārī is the wife of Indra Dhvaja',
        ne: 'पद्म कुमारी इन्द्र ध्वजकी पत्नी हुन्',
        hi: 'पद्म कुमारी इन्द्र ध्वज की पत्नी हैं',
        zh: '帕德玛·库玛丽是因德拉·德瓦贾的妻子',
        ta: 'பத்ம குமாரி இந்திர த்வஜவின் மனைவி'
      }
    }
  ];

  const tableHeaders = {
    year: {
      en: 'Year',
      ne: 'वर्ष',
      hi: 'वर्ष',
      zh: '年份',
      ta: 'ஆண்டு'
    },
    nameOfShrine: {
      en: 'Name of the Shrine',
      ne: 'मन्दिरको नाम',
      hi: 'मंदिर का नाम',
      zh: '神龛名称',
      ta: 'கோயில் பெயர்'
    },
    founder: {
      en: 'Founder',
      ne: 'संस्थापक',
      hi: 'संस्थापक',
      zh: '创始人',
      ta: 'நிறுவனர்'
    },
    remarks: {
      en: 'Remarks',
      ne: 'टिप्पणी',
      hi: 'टिप्पणी',
      zh: '备注',
      ta: 'குறிப்புகள்'
    }
  };

  return (
    <div className="py-20 px-4 sm:px-6 bg-gradient-to-b from-white to-[#faf8f5]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-3xl sm:text-4xl text-maroon mb-4">
            {lang === 'ne' ? 'बत्तीसपुतलीस्थित श्रीरामचन्द्रमन्दिरको इतिवृत्त' :
             lang === 'hi' ? 'बत्तीसपुतली स्थित श्रीरामचन्द्रमन्दिर का इतिवृत्त' :
             lang === 'zh' ? '巴蒂斯普蒂利室利罗摩钱德拉神庙的历史' :
             lang === 'ta' ? 'பத்தீஸ்புத்லியில் உள்ள ஸ்ரீ ராமச்சந்திர கோயிலின் வரலாறு' :
             'History of Shree Ramchandra Temple, Battisputali'}
          </h2>
          <p className="text-ink-soft text-sm">
            {lang === 'ne' ? 'वि.सं. १९२८ देखि १९८१ सम्मका अभिलेखहरू' :
             lang === 'hi' ? 'वि.सं. १९२८ से १९८१ तक के अभिलेख' :
             lang === 'zh' ? '公元1871年至1924年的记录' :
             lang === 'ta' ? 'கி.பி. 1871 முதல் 1924 வரையிலான பதிவுகள்' :
             'Records from 1871 to 1924 AD'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="overflow-x-auto shadow-xl rounded-xl bg-white border border-gray-100"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-maroon/10 to-maroon/5 border-b border-maroon/20">
                <th className="px-6 py-4 text-left font-serif text-maroon font-bold text-sm uppercase tracking-wider">
                  {getLocalizedText(tableHeaders.year, lang)}
                </th>
                <th className="px-6 py-4 text-left font-serif text-maroon font-bold text-sm uppercase tracking-wider min-w-[200px]">
                  {getLocalizedText(tableHeaders.nameOfShrine, lang)}
                </th>
                <th className="px-6 py-4 text-left font-serif text-maroon font-bold text-sm uppercase tracking-wider min-w-[150px]">
                  {getLocalizedText(tableHeaders.founder, lang)}
                </th>
                <th className="px-6 py-4 text-left font-serif text-maroon font-bold text-sm uppercase tracking-wider min-w-[200px]">
                  {getLocalizedText(tableHeaders.remarks, lang)}
                </th>
              </tr>
            </thead>
            <tbody>
              {historicalData.map((item, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className={`border-b border-gray-100 hover:bg-maroon/5 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-[#faf8f5]'
                  }`}
                >
                  <td className="px-6 py-4 font-bold text-ink whitespace-nowrap text-sm">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-maroon/40" />
                      {item.year}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-ink font-medium leading-relaxed text-sm text-justify">
                    {getLocalizedText(item.nameOfShrine, lang)}
                  </td>
                  <td className="px-6 py-4 text-ink font-medium leading-relaxed text-sm text-justify">
                    {getLocalizedText(item.founder, lang)}
                  </td>
                  <td className="px-6 py-4 text-ink font-medium leading-relaxed text-sm text-justify">
                    {getLocalizedText(item.remarks, lang) || '—'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}

// ===== MAIN HISTORY PAGE =====
const HistoryPage = () => {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState([]);
  const [settings, setSettings] = useState(null);
  const fetched = useRef(false);

  const heritageText = {
    title: {
      en: 'A Living Heritage',
      ne: 'जीवित सम्पदा',
      hi: 'एक जीवित विरासत',
      zh: '活遗产',
      ta: 'உயிருள்ள பாரம்பரியம்'
    },
    body: {
      en: 'Shree Ramchandra Temple stands as a testament to the enduring faith and devotion of the Nepali people. From its humble beginnings to its present grandeur, the temple continues to be a sanctuary of peace and spiritual fulfillment.',
      ne: 'श्री रामचन्द्र मन्दिर नेपाली जनताको अटल विश्वास र भक्तिको प्रतीकको रूपमा उभिएको छ। आफ्नो सामान्य सुरुवातदेखि वर्तमान भव्यतासम्म, मन्दिर शान्ति र आध्यात्मिक पूर्तिको अभयारण्यको रूपमा रहिरहेको छ।',
      hi: 'श्री रामचन्द्र मंदिर नेपाली जनता के अटूट विश्वास और भक्ति के प्रतीक के रूप में खड़ा है। अपनी सामान्य शुरुआत से लेकर वर्तमान भव्यता तक, मंदिर शांति और आध्यात्मिक पूर्ति का अभयारण्य बना हुआ है।',
      zh: '室利罗摩钱德拉神庙是尼泊尔人民坚定信仰和虔诚的见证。从 humble beginnings 到现在的宏伟，寺庙仍然是和平与精神满足的避难所。',
      ta: 'ஸ்ரீ ராமச்சந்திர கோயில் நேபாள மக்களின் உறுதியான நம்பிக்கை மற்றும் பக்திக்கு சான்றாக நிற்கிறது. அதன் தாழ்மையான தொடக்கத்திலிருந்து தற்போதைய பிரம்மாண்டம் வரை, கோயில் அமைதி மற்றும் ஆன்மீக நிறைவின் புகலிடமாக தொடர்கிறது.'
    },
    stats: {
      years: {
        en: 'Years of Service',
        ne: 'सेवाका वर्षहरू',
        hi: 'सेवा के वर्ष',
        zh: '服务年限',
        ta: 'சேவை ஆண்டுகள்'
      },
      devotees: {
        en: 'Devotees Served',
        ne: 'सेवा गरिएका भक्तजनहरू',
        hi: 'सेवा किए गए भक्त',
        zh: '服务信徒',
        ta: 'பக்தர்கள் சேவை'
      },
      aarti: {
        en: 'Days of Aarti',
        ne: 'आरतीका दिनहरू',
        hi: 'आरती के दिन',
        zh: '祈祷日数',
        ta: 'ஆரத்தி நாட்கள்'
      }
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [historyRes, settingsRes] = await Promise.all([
        api.get('/admin/history'),
        api.get('/admin/settings')
      ]);
      
      const historyItems = historyRes.data || [];
      const sorted = historyItems
        .filter(item => item.enabled !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setHistoryData(sorted);
      
      setSettings(settingsRes.data);
    } catch (error) {
      console.error('Error fetching history data:', error);
      setHistoryData([]);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <OmLoader size="lg" color="vermilion" className="mx-auto mb-4" />
          <p className="text-ink-soft text-sm">Loading history...</p>
        </div>
      </div>
    );
  }

  const bannerUrl = settings?.historyBanner || '';

  return (
    <div 
      className="w-full overflow-hidden"
      style={{ 
        background: 'linear-gradient(180deg, #faf8f5 0%, #ffffff 30%, #ffffff 70%, #faf8f5 100%)' 
      }}
    >
      {/* Hero */}
      <HistoryHero 
        bannerImage={bannerUrl}
        title={{ 
          en: 'Our History', 
          ne: 'हाम्रो इतिहास',
          hi: 'हमारा इतिहास',
          zh: '我们的历史',
          ta: 'எங்கள் வரலாறு'
        }}
        intro={{ 
          en: 'A journey of faith, community, and unbroken tradition spanning generations.',
          ne: 'पुस्तौंसम्म फैलिएको विश्वास, समुदाय र अटुट परम्पराको यात्रा।',
          hi: 'पीढ़ियों तक फैला विश्वास, समुदाय और अटूट परंपरा की यात्रा।',
          zh: '跨越世代的信仰、社区和不断传承的旅程。',
          ta: 'தலைமுறைகளாக பரவிய நம்பிக்கை, சமூகம் மற்றும் தொடர்ச்சியான பாரம்பரியத்தின் பயணம்.'
        }}
      />

      {/* Founder Section */}
      <FounderSection lang={lang} settings={settings} />

      {/* Timeline */}
      <TimelineSection items={historyData} lang={lang} />

      {/* Historical Table */}
      <HistoricalTable lang={lang} />

      {/* Heritage Section */}
      {historyData.length > 0 && (
        <div className="py-20 px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center space-y-6"
          >
            <h2 className="font-serif text-3xl sm:text-4xl text-maroon">
              {getLocalizedText(heritageText.title, lang)}
            </h2>
            <p className="text-ink-soft text-base sm:text-lg leading-relaxed text-justify">
              {getLocalizedText(heritageText.body, lang)}
            </p>
            
            <div className="pt-6 flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
              <AnimatedCounter 
                target={100} 
                label={getLocalizedText(heritageText.stats.years, lang)} 
                suffix="+"
                lang={lang}
              />
              <div className="w-px h-10 bg-gray-300 hidden sm:block" />
              <AnimatedCounter 
                target={50} 
                label={getLocalizedText(heritageText.stats.devotees, lang)} 
                suffix="K+"
                lang={lang}
              />
              <div className="w-px h-10 bg-gray-300 hidden sm:block" />
              <AnimatedCounter 
                target={365} 
                label={getLocalizedText(heritageText.stats.aarti, lang)} 
                suffix=""
                lang={lang}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;