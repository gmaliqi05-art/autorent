import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import sq from './locales/sq.json';
import en from './locales/en.json';
import de from './locales/de.json';

export const SUPPORTED_LANGUAGES = ['sq', 'en', 'de'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, { native: string; flag: string; english: string }> = {
  sq: { native: 'Shqip', flag: 'AL', english: 'Albanian' },
  en: { native: 'English', flag: 'GB', english: 'English' },
  de: { native: 'Deutsch', flag: 'DE', english: 'German' },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      sq: { translation: sq },
      en: { translation: en },
      de: { translation: de },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'app_language',
      caches: ['localStorage'],
    },
  });

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.resolvedLanguage || i18n.language || 'en';
  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
  });
}

export default i18n;

export function changeLanguage(lang: SupportedLanguage) {
  i18n.changeLanguage(lang);
  try { localStorage.setItem('app_language', lang); } catch { /* ignore */ }
  document.documentElement.lang = lang;
}

export function getDateLocale(lang: string): string {
  if (lang.startsWith('en')) return 'en-GB';
  if (lang.startsWith('de')) return 'de-DE';
  return 'sq-AL';
}
