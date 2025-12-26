'use client';

import { useState, useEffect } from 'react';
import { t, getLanguage, setLanguage, type Language } from './i18n';

// Hook for React components
// This hook should only be used in client components ('use client')
export function useTranslation() {
  const [lang, setLangState] = useState<Language>(getLanguage());
  
  useEffect(() => {
    // Sync with localStorage changes
    const handleStorageChange = () => {
      setLangState(getLanguage());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const changeLanguage = (newLang: Language) => {
    setLanguage(newLang);
    setLangState(newLang);
    // Force re-render by updating state
    window.dispatchEvent(new Event('languagechange'));
  };
  
  return {
    t,
    language: lang,
    setLanguage: changeLanguage,
  };
}

