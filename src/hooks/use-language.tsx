"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserPreferencesAction, saveUserPreferencesAction } from '@/lib/actions';

// Define the shape of the context
interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string, options?: Record<string, string | number>) => string;
}

// Create the context with a default value
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Define the props for the provider
interface LanguageProviderProps {
  children: React.ReactNode;
}

// Create a provider component
export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    void (async () => {
      const remote = await getUserPreferencesAction();
      if (remote.data?.language) {
        setLanguage(remote.data.language);
        return;
      }

      const storedLanguage = window.localStorage.getItem('earth-insights.language');
      if (storedLanguage) {
        setLanguage(storedLanguage);
      }
    })();
  }, []);

  const fetchTranslations = useCallback(async (lang: string) => {
    try {
      const response = await import(`@/locales/${lang}.json`);
      setTranslations(response.default);
    } catch (error) {
      console.error(`Could not load translations for ${lang}`, error);
      // Fallback to English if the selected language fails to load
      const fallback = await import(`@/locales/en.json`);
      setTranslations(fallback.default);
    }
  }, []);

  useEffect(() => {
    fetchTranslations(language);
  }, [language, fetchTranslations]);

  const t = (key: string, options?: Record<string, string | number>): string => {
    let translation = translations[key] || key;
    if (options) {
      Object.keys(options).forEach(placeholder => {
        translation = translation.replace(`{{${placeholder}}}`, String(options[placeholder]));
      });
    }
    return translation;
  };
  
  const handleSetLanguage = (lang: string) => {
    setLanguage(lang);
    window.localStorage.setItem('earth-insights.language', lang);
    void saveUserPreferencesAction({ language: lang });
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Create a custom hook to use the language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
