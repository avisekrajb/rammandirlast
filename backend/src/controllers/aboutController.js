const About = require('../models/About');

// Get About content
exports.getAbout = async (req, res) => {
  try {
    let about = await About.findOne();
    
    if (!about) {
      // Create default about data
      about = await About.create({
        hero: {
          image: '/aboutusphoto.jpeg',
          title: {
            en: 'About Us',
            ne: 'हाम्रो बारेमा',
            hi: 'हमारे बारे में',
            zh: '关于我们',
            ta: 'எங்களைப் பற்றி'
          }
          // Removed intro from hero - it will be separate
        },
        // NEW: Intro text field - below hero banner
        introText: {
          en: 'Welcome to Shree Ramchandra Temple, a sacred place of worship and spiritual solace. Discover the rich history, architectural beauty, and divine presence that makes this temple a cherished heritage of Nepal.',
          ne: 'श्री रामचन्द्र मन्दिरमा स्वागत छ, पूजा र आध्यात्मिक शान्तिको पवित्र स्थान। समृद्ध इतिहास, वास्तुकलाको सौन्दर्य, र दिव्य उपस्थिति पत्ता लगाउनुहोस् जसले यस मन्दिरलाई नेपालको मूल्यवान सम्पदा बनाउँछ।',
          hi: 'श्री रामचन्द्र मंदिर में आपका स्वागत है, पूजा और आध्यात्मिक शांति का पवित्र स्थान। समृद्ध इतिहास, वास्तुकला की सुंदरता और दिव्य उपस्थिति को जानें जो इस मंदिर को नेपाल की एक मूल्यवान विरासत बनाती है।',
          zh: '欢迎来到室利罗摩钱德拉神庙，一个礼拜和心灵慰藉的神圣之地。探索丰富的历史、建筑之美和神圣的存在，使这座寺庙成为尼泊尔珍贵的遗产。',
          ta: 'ஸ்ரீ ராமச்சந்திர கோயிலுக்கு வருக, வழிபாடு மற்றும் ஆன்மீக ஆறுதலின் புனித இடம். வளமான வரலாறு, கட்டிடக்கலை அழகு, மற்றும் தெய்வீக இருப்பு ஆகியவற்றைக் கண்டறியுங்கள், இது இந்த கோயிலை நேபாளத்தின் விலைமதிப்பற்ற பாரம்பரியமாக ஆக்குகிறது.'
        },
        sections: [
          {
            key: 'architecture',
            title: {
              en: 'Temple Architecture',
              ne: 'मन्दिरको वास्तुकला',
              hi: 'मंदिर की वास्तुकला',
              zh: '寺庙建筑',
              ta: 'கோயில் கட்டிடக்கலை'
            },
            body: {
              en: 'The temple showcases traditional Nepali architecture with intricate wood carvings, ancient stone sculptures, and a beautiful pagoda-style structure that reflects the rich cultural heritage of the Kathmandu Valley.',
              ne: 'मन्दिरले परम्परागत नेपाली वास्तुकलालाई जटिल काठको नक्काशी, प्राचीन ढुङ्गाका मूर्तिहरू, र सुन्दर प्यागोडा-शैलीको संरचनाको साथ प्रदर्शन गर्दछ जसले काठमाडौं उपत्यकाको समृद्ध सांस्कृतिक सम्पदालाई प्रतिबिम्बित गर्दछ।',
              hi: 'मंदिर पारंपरिक नेपाली वास्तुकला को प्रदर्शन करता है जिसमें जटिल लकड़ी की नक्काशी, प्राचीन पत्थर की मूर्तियाँ, और एक सुंदर पगोडा-शैली की संरचना है जो काठमांडू घाटी की समृद्ध सांस्कृतिक विरासत को दर्शाती है।',
              zh: '寺庙展示了传统的尼泊尔建筑风格，包括精美的木雕、古老的石雕和美丽的宝塔式结构，反映了加德满都谷地丰富的文化遗产。',
              ta: 'கோயில் பாரம்பரிய நேபாள கட்டிடக்கலையை வெளிப்படுத்துகிறது, இதில் சிக்கலான மர வேலைப்பாடுகள், பண்டைய கல் சிற்பங்கள், மற்றும் அழகான பகோடா-பாணி கட்டமைப்பு ஆகியவை அடங்கும், இது காத்மாண்டு பள்ளத்தாக்கின் வளமான கலாச்சார பாரம்பரியத்தை பிரதிபலிக்கிறது.'
            },
            image: '/1.jpg',
            order: 0,
            enabled: true
          },
          {
            key: 'deity',
            title: {
              en: 'The Deity',
              ne: 'देवता',
              hi: 'देवता',
              zh: '神像',
              ta: 'கடவுள்'
            },
            body: {
              en: 'Lord Ram, along with Sita and Lakshman, is enshrined in the sanctum sanctorum. The temple also houses other deities including Lord Hanuman, Lord Ganesha, and Goddess Durga, creating a divine atmosphere of spiritual devotion.',
              ne: 'भगवान राम, सीता र लक्ष्मणसहित, गर्भगृहमा विराजमान छन्। मन्दिरमा भगवान हनुमान, भगवान गणेश, र देवी दुर्गालगायत अन्य देवी-देवताहरू पनि छन्, जसले आध्यात्मिक भक्तिको दिव्य वातावरण सिर्जना गर्दछ।',
              hi: 'भगवान राम, सीता और लक्ष्मण के साथ, गर्भगृह में विराजमान हैं। मंदिर में भगवान हनुमान, भगवान गणेश और देवी दुर्गा सहित अन्य देवी-देवता भी हैं, जो आध्यात्मिक भक्ति का दिव्य वातावरण बनाते हैं।',
              zh: '罗摩神与悉多和拉克什曼一同供奉在圣殿中。寺庙还供奉着哈努曼神、象头神和杜尔迦女神等其他神祇，营造出神圣的虔诚氛围。',
              ta: 'ராமர், சீதை மற்றும் லக்ஷ்மணருடன் கருவறையில் எழுந்தருளியுள்ளார். கோயிலில் அனுமான், விநாயகர் மற்றும் துர்கை தேவி உள்ளிட்ட பிற தெய்வங்களும் உள்ளன, இது ஆன்மீக பக்தியின் தெய்வீக சூழ்நிலையை உருவாக்குகிறது.'
            },
            image: '/2.jpg',
            order: 1,
            enabled: true
          },
          {
            key: 'location',
            title: {
              en: 'Sacred Location',
              ne: 'पवित्र स्थान',
              hi: 'पवित्र स्थान',
              zh: '神圣地点',
              ta: 'புனித இடம்'
            },
            body: {
              en: 'Located in the heart of Gaushala, Kathmandu, the temple is situated on the sacred banks of the Bagmati River. This serene location provides a peaceful retreat from the hustle and bustle of city life.',
              ne: 'गौशाला, काठमाडौंको हृदयमा अवस्थित, मन्दिर बागमती नदीको पवित्र किनारमा अवस्थित छ। यो शान्त स्थानले सहरको कोलाहलबाट शान्तिपूर्ण विश्राम प्रदान गर्दछ।',
              hi: 'गौशाला, काठमाडौं के हृदय में स्थित, मंदिर बागमती नदी के पवित्र तट पर स्थित है। यह शांत स्थान शहर की हलचल से शांतिपूर्ण विश्राम प्रदान करता है।',
              zh: '寺庙位于加德满都高沙拉的中心，坐落在巴格马蒂河的圣河畔。这个宁静的地方为城市生活的喧嚣提供了一个宁静的避风港。',
              ta: 'கௌஷாலா, காத்மாண்டுவின் இதயத்தில் அமைந்துள்ள கோயில், பாக்மதி நதியின் புனித கரையில் அமைந்துள்ளது. இந்த அமைதியான இடம் நகர வாழ்க்கையின் சந்தடியில் இருந்து அமைதியான தஞ்சத்தை வழங்குகிறது.'
            },
            image: '/3.jpg',
            order: 2,
            enabled: true
          }
        ],
        activities: [
          {
            key: 'daily',
            title: {
              en: 'Daily Puja (Nitya Puja)',
              ne: 'दैनिक पूजा (नित्य पूजा)',
              hi: 'दैनिक पूजा (नित्य पूजा)',
              zh: '日常礼拜',
              ta: 'தினசரி பூஜை'
            },
            desc: {
              en: 'The daily rituals and worship ceremonies at the temple',
              ne: 'मन्दिरमा दैनिक अनुष्ठान र पूजा समारोहहरू',
              hi: 'मंदिर में दैनिक अनुष्ठान और पूजा समारोह',
              zh: '寺庙的日常仪式和礼拜',
              ta: 'கோயிலில் தினசரி சடங்குகள் மற்றும் வழிபாட்டு விழாக்கள்'
            },
            paragraphs: {
              p1: {
                en: 'The daily activities at Shree Ramchandra Temple begin at 5:00 AM with the morning aarti and Mangal Dhun. The temple echoes with the sounds of bells, conch shells, and devotional hymns.',
                ne: 'श्री रामचन्द्र मन्दिरका दैनिक कार्यक्रमहरू बिहान ५ बजे बिहानको आरती र मंगल धुनको साथ शुरु हुन्छन्। मन्दिर घण्टी, शंख, र भक्तिमय भजनका ध्वनिहरूले प्रतिध्वनित हुन्छ।',
                hi: 'श्री रामचन्द्र मंदिर की दैनिक गतिविधियाँ सुबह 5:00 बजे सुबह की आरती और मंगल धुन के साथ शुरू होती हैं। मंदिर घंटियों, शंख और भक्ति भजनों की आवाज़ से गूंजता है।',
                zh: '室利罗摩钱德拉神庙的日常活动从早上5点开始，清晨的祈祷和吉祥旋律。寺庙回荡着钟声、海螺声和虔诚的赞美诗。',
                ta: 'ஸ்ரீ ராமச்சந்திர கோயிலில் தினசரி நடவடிக்கைகள் அதிகாலை 5:00 மணிக்கு காலை ஆரத்தி மற்றும் மங்கள துன் உடன் தொடங்கும். கோயில் மணிகள், சங்குகள் மற்றும் பக்தி பாடல்களின் ஒலிகளுடன் எதிரொலிக்கிறது.'
              },
              p2: {
                en: 'Multiple rituals are performed throughout the day including Abhishek, Shringar, and Bhog. Devotees can participate in these rituals and receive blessings.',
                ne: 'दिनभरि अभिषेक, शृंगार, र भोग सहित धेरै अनुष्ठानहरू गरिन्छन्। भक्तजनहरूले यी अनुष्ठानहरूमा सहभागी हुन सक्छन् र आशीर्वाद प्राप्त गर्न सक्छन्।',
                hi: 'दिन भर अभिषेक, श्रृंगार और भोग सहित कई अनुष्ठान किए जाते हैं। भक्त इन अनुष्ठानों में भाग ले सकते हैं और आशीर्वाद प्राप्त कर सकते हैं।',
                zh: '全天进行多项仪式，包括灌顶、装饰和供奉。信徒可以参与这些仪式并接受祝福。',
                ta: 'அபிஷேகம், ஸ்ரிங்காரம் மற்றும் போக் உள்ளிட்ட பல சடங்குகள் நாள் முழுவதும் நடத்தப்படுகின்றன. பக்தர்கள் இந்த சடங்குகளில் பங்கேற்று ஆசீர்வாதங்களைப் பெறலாம்.'
              }
            },
            order: 0,
            enabled: true
          },
          {
            key: 'festivals',
            title: {
              en: 'Festivals & Celebrations',
              ne: 'चाडपर्व र उत्सवहरू',
              hi: 'त्योहार और उत्सव',
              zh: '节日与庆典',
              ta: 'திருவிழாக்கள் மற்றும் கொண்டாட்டங்கள்'
            },
            desc: {
              en: 'Special celebrations during major Hindu festivals',
              ne: 'प्रमुख हिन्दू चाडपर्वहरूमा विशेष उत्सवहरू',
              hi: 'प्रमुख हिंदू त्योहारों के दौरान विशेष उत्सव',
              zh: '主要印度教节日期间的特别庆祝活动',
              ta: 'பெரிய இந்து திருவிழாக்களின் போது சிறப்பு கொண்டாட்டங்கள்'
            },
            paragraphs: {
              p1: {
                en: 'The temple celebrates all major Hindu festivals with great enthusiasm. During Ram Navami, the birth anniversary of Lord Ram, special processions and cultural programs are organized.',
                ne: 'मन्दिरले सबै प्रमुख हिन्दू चाडपर्वहरू ठूलो उत्साहका साथ मनाउँछ। राम नवमीको अवसरमा, भगवान रामको जन्म जयन्तीमा, विशेष शोभायात्रा र सांस्कृतिक कार्यक्रमहरू आयोजना गरिन्छन्।',
                hi: 'मंदिर सभी प्रमुख हिंदू त्योहारों को बड़े उत्साह के साथ मनाता है। राम नवमी के दौरान, भगवान राम की जयंती पर, विशेष जुलूस और सांस्कृतिक कार्यक्रम आयोजित किए जाते हैं।',
                zh: '寺庙以极大的热情庆祝所有主要的印度教节日。在罗摩诞辰节期间，罗摩神的诞辰纪念日，会组织特别的游行和文化活动。',
                ta: 'கோயில் அனைத்து பெரிய இந்து திருவிழாக்களையும் மிகுந்த உற்சாகத்துடன் கொண்டாடுகிறது. ராம் நவமியின் போது, ராமரின் பிறந்த நாளில், சிறப்பு ஊர்வலங்கள் மற்றும் கலாச்சார நிகழ்ச்சிகள் ஏற்பாடு செய்யப்படுகின்றன.'
              },
              p2: {
                en: 'Other major festivals like Dashain, Tihar, and Shivaratri are also celebrated with traditional rituals, prayers, and community feasts.',
                ne: 'दशैं, तिहार, र शिवरात्रि जस्ता अन्य प्रमुख चाडपर्वहरू पनि परम्परागत अनुष्ठान, पूजा, र सामुदायिक भोजको साथ मनाइन्छन्।',
                hi: 'दशैं, तिहार और शिवरात्रि जैसे अन्य प्रमुख त्योहार भी पारंपरिक अनुष्ठानों, पूजा और सामुदायिक भोज के साथ मनाए जाते हैं।',
                zh: '其他主要节日如达赛节、提哈尔节和湿婆节也以传统仪式、祈祷和社区盛宴庆祝。',
                ta: 'தசை, திஹார் மற்றும் சிவராத்திரி போன்ற பிற பெரிய திருவிழாக்களும் பாரம்பரிய சடங்குகள், பிரார்த்தனைகள் மற்றும் சமூக விருந்துகளுடன் கொண்டாடப்படுகின்றன.'
              }
            },
            order: 1,
            enabled: true
          }
        ]
      });
    }
    
    res.json({ success: true, data: about });
  } catch (error) {
    console.error('Error fetching about:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update About content
exports.updateAbout = async (req, res) => {
  try {
    const { hero, introText, sections, activities } = req.body;
    
    console.log('Received update data:', req.body); // Debug log
    
    let about = await About.findOne();
    
    if (!about) {
      about = new About();
    }
    
    // Update fields if they exist in request
    if (hero) {
      about.hero = {
        title: hero.title || {},
        image: hero.image || ''
      };
    }
    
    // IMPORTANT: Handle introText field
    if (introText !== undefined) {
      about.introText = introText;
    }
    
    if (sections) {
      about.sections = sections;
    }
    
    if (activities) {
      about.activities = activities;
    }
    
    await about.save();
    console.log('Saved about data:', about); // Debug log
    
    res.json({ 
      success: true, 
      data: about, 
      message: 'About page updated successfully' 
    });
  } catch (error) {
    console.error('Error updating about:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};