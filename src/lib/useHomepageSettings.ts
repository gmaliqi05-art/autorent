import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from './supabase';
import type { HeroSettings, LogoSettings, NavbarSettings, SectionsSettings } from './types';
import { pickLocalized } from './i18nHelpers';

const defaultHero: HeroSettings = {
  image_url: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
  image_url_mobile: '',
  image_position_mobile: '70% center',
  image_position_desktop: 'center',
  title_line1: '',
  title_line2: '',
  subtitle: '',
  badge_text: '',
  search_label_city: '',
  search_label_pickup: '',
  search_label_return: '',
  search_button_text: '',
  show_trust_badges: true,
  trust_badge_1: '',
  trust_badge_2: '',
  trust_badge_3: '',
  trust_badge_4: '',
  overlay_opacity: 70,
};

const defaultLogo: LogoSettings = {
  logo_url: '',
  site_name: 'RentaKar',
  show_text: true,
  show_icon: true,
};

const defaultNavbar: NavbarSettings = {
  show_vehicles_link: true,
  vehicles_link_text: '',
  login_button_text: '',
  register_button_text: '',
  register_button_color: 'primary',
};

const defaultSections: SectionsSettings = {
  show_categories: true,
  show_featured: true,
  show_how_it_works: true,
  show_testimonials: true,
  show_company_cta: true,
  show_trust_banner: true,
  categories_title: '',
  categories_subtitle: '',
  featured_title: '',
  featured_subtitle: '',
};

export interface HomepageSettings {
  hero: HeroSettings;
  logo: LogoSettings;
  navbar: NavbarSettings;
  sections: SectionsSettings;
  loading: boolean;
}

interface RawSettings {
  hero: Partial<HeroSettings>;
  logo: Partial<LogoSettings>;
  navbar: Partial<NavbarSettings>;
  sections: Partial<SectionsSettings>;
}

export function useHomepageSettings(): HomepageSettings {
  const { t, i18n } = useTranslation();
  const [raw, setRaw] = useState<RawSettings>({ hero: {}, logo: {}, navbar: {}, sections: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('homepage_settings')
      .select('key, value')
      .then(({ data }) => {
        if (data) {
          const next: RawSettings = { hero: {}, logo: {}, navbar: {}, sections: {} };
          for (const row of data) {
            if (row.key === 'hero') next.hero = row.value as Partial<HeroSettings>;
            if (row.key === 'logo') next.logo = row.value as Partial<LogoSettings>;
            if (row.key === 'navbar') next.navbar = row.value as Partial<NavbarSettings>;
            if (row.key === 'sections') next.sections = row.value as Partial<SectionsSettings>;
          }
          setRaw(next);
        }
        setLoading(false);
      });
  }, []);

  const lang = i18n.language;

  return useMemo(() => {
    void lang;
    const hero: HeroSettings = {
      ...defaultHero,
      ...raw.hero,
      title_line1: pickLocalized(raw.hero.title_line1, 'hero.titleLine1') || t('hero.titleLine1'),
      title_line2: pickLocalized(raw.hero.title_line2, 'hero.titleLine2') || t('hero.titleLine2'),
      subtitle: pickLocalized(raw.hero.subtitle, 'hero.subtitle') || t('hero.subtitle'),
      badge_text: pickLocalized(raw.hero.badge_text),
      search_label_city: pickLocalized(raw.hero.search_label_city, 'hero.searchCity') || t('hero.searchCity'),
      search_label_pickup: pickLocalized(raw.hero.search_label_pickup, 'hero.pickupDate') || t('hero.pickupDate'),
      search_label_return: pickLocalized(raw.hero.search_label_return, 'hero.returnDate') || t('hero.returnDate'),
      search_button_text: pickLocalized(raw.hero.search_button_text, 'hero.searchButton') || t('hero.searchButton'),
      trust_badge_1: pickLocalized(raw.hero.trust_badge_1, 'hero.freeCancel') || t('hero.freeCancel'),
      trust_badge_2: pickLocalized(raw.hero.trust_badge_2, 'hero.fullSecurity') || t('hero.fullSecurity'),
      trust_badge_3: pickLocalized(raw.hero.trust_badge_3, 'hero.fastConfirm') || t('hero.fastConfirm'),
      trust_badge_4: pickLocalized(raw.hero.trust_badge_4, 'hero.support247') || t('hero.support247'),
    };
    const logo: LogoSettings = { ...defaultLogo, ...raw.logo };
    const navbar: NavbarSettings = {
      ...defaultNavbar,
      ...raw.navbar,
      vehicles_link_text: pickLocalized(raw.navbar.vehicles_link_text, 'nav.vehicles') || t('nav.vehicles'),
      login_button_text: pickLocalized(raw.navbar.login_button_text, 'nav.login') || t('nav.login'),
      register_button_text: pickLocalized(raw.navbar.register_button_text, 'nav.register') || t('nav.register'),
    };
    const sections: SectionsSettings = {
      ...defaultSections,
      ...raw.sections,
      categories_title: pickLocalized(raw.sections.categories_title, 'home.categoriesTitle') || t('home.categoriesTitle'),
      categories_subtitle: pickLocalized(raw.sections.categories_subtitle, 'home.categoriesSubtitle') || t('home.categoriesSubtitle'),
      featured_title: pickLocalized(raw.sections.featured_title, 'home.featuredTitle') || t('home.featuredTitle'),
      featured_subtitle: pickLocalized(raw.sections.featured_subtitle, 'home.featuredSubtitle') || t('home.featuredSubtitle'),
    };
    return { hero, logo, navbar, sections, loading };
  }, [raw, lang, loading, t]);
}

export { defaultHero, defaultLogo, defaultNavbar, defaultSections };
