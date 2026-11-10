import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, TranslationKey } from '../i18n/translations';

interface LanguageContextType {
  language: 'bn' | 'en';
  setLanguage: (lang: 'bn' | 'en') => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<'bn' | 'en'>(() => {
    const saved = localStorage.getItem('pfm_lang');
    return saved === 'en' ? 'en' : 'bn'; // Bengali is default
  });

  const setLanguage = (lang: 'bn' | 'en') => {
    setLangState(lang);
    localStorage.setItem('pfm_lang', lang);
  };

  const t = (key: TranslationKey): string => {
    const currentDict = translations[language] || translations.bn;
    return (currentDict as any)[key] || (translations.en as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
