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
    fallbackLng: 'sq',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'app_language',
      caches: ['localStorage'],
    },
  });

export default i18n;

export function changeLanguage(lang: SupportedLanguage) {
  i18n.changeLanguage(lang);
  try { localStorage.setItem('app_language', lang); } catch { /* ignore */ }
  document.documentElement.lang = lang;
}
