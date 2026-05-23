import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import sq from './locales/sq.json';
import en from './locales/en.json';
import de from './locales/de.json';
import it from './locales/it.json';
import fr from './locales/fr.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';

export const SUPPORTED_LANGUAGES = ['sq', 'en', 'de', 'it', 'fr', 'nl', 'pl'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, { native: string; flag: string; english: string }> = {
  sq: { native: 'Shqip', flag: 'AL', english: 'Albanian' },
  en: { native: 'English', flag: 'GB', english: 'English' },
  de: { native: 'Deutsch', flag: 'DE', english: 'German' },
  it: { native: 'Italiano', flag: 'IT', english: 'Italian' },
  fr: { native: 'Français', flag: 'FR', english: 'French' },
  nl: { native: 'Nederlands', flag: 'NL', english: 'Dutch' },
  pl: { native: 'Polski', flag: 'PL', english: 'Polish' },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      sq: { translation: sq },
      en: { translation: en },
      de: { translation: de },
      it: { translation: it },
      fr: { translation: fr },
      nl: { translation: nl },
      pl: { translation: pl },
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

const DATE_LOCALES: Record<SupportedLanguage, string> = {
  sq: 'sq-AL',
  en: 'en-GB',
  de: 'de-DE',
  it: 'it-IT',
  fr: 'fr-FR',
  nl: 'nl-NL',
  pl: 'pl-PL',
};

export function getDateLocale(lang: string): string {
  const base = lang.split('-')[0] as SupportedLanguage;
  return DATE_LOCALES[base] ?? 'en-GB';
}
