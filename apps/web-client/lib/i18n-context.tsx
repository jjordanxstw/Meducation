'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// Translation type
type Translations = typeof import('../messages/en.json');

// Import translations
const translations: Record<'en' | 'th', Translations> = {
  en: require('../messages/en.json'),
  th: require('../messages/th.json'),
};

type Locale = 'en' | 'th';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('med:locale') as Locale | null;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'th')) {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('med:locale', newLocale);
  }, []);

  const value = {
    locale,
    setLocale,
    t: translations[locale],
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function useTranslations() {
  const { t } = useI18n();
  return t;
}

export function useLocale() {
  const { locale, setLocale } = useI18n();
  return { locale, setLocale };
}
