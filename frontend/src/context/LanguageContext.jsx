import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';
import { getLanguage, setLanguage } from '../services/auth';

const LanguageContext = createContext(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => getLanguage() || 'en');

  useEffect(() => {
    setLanguage(lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};