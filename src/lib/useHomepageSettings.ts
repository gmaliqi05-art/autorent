import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import type { HeroSettings, LogoSettings, NavbarSettings, SectionsSettings } from './types';

const defaultHero: HeroSettings = {
  image_url: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
  image_url_mobile: '',
  image_position_mobile: '70% center',
  image_position_desktop: 'center',
  title_line1: 'Udhetoni me stil,',
  title_line2: 'rezervoni me lehte.',
  subtitle: 'Qindra automjete premium nga kompanite me te besueshme ne Kosove, Shqiperi dhe Maqedoni te Veriut.',
  badge_text: '',
  search_label_city: 'Ku deshironi te udhetoni?',
  search_label_pickup: 'Data e marrjes',
  search_label_return: 'Data e kthimit',
  search_button_text: 'Kerko',
  show_trust_badges: true,
  trust_badge_1: 'Anulim falas',
  trust_badge_2: 'Sigurim i plote',
  trust_badge_3: 'Konfirmim i shpejte',
  trust_badge_4: 'Mbeshtetje 24/7',
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
  vehicles_link_text: 'Automjetet',
  login_button_text: 'Kycu',
  register_button_text: 'Regjistrohu',
  register_button_color: 'primary',
};

const defaultSections: SectionsSettings = {
  show_categories: true,
  show_featured: true,
  show_how_it_works: true,
  show_testimonials: true,
  show_company_cta: true,
  show_trust_banner: true,
  categories_title: 'Gjeni automjetin qe ju pershtatet',
  categories_subtitle: 'Kategorite',
  featured_title: 'Automjete te rekomanduara',
  featured_subtitle: 'Te zgjedhura',
};

export interface HomepageSettings {
  hero: HeroSettings;
  logo: LogoSettings;
  navbar: NavbarSettings;
  sections: SectionsSettings;
  loading: boolean;
}

export function useHomepageSettings(): HomepageSettings {
  const [hero, setHero] = useState<HeroSettings>(defaultHero);
  const [logo, setLogo] = useState<LogoSettings>(defaultLogo);
  const [navbar, setNavbar] = useState<NavbarSettings>(defaultNavbar);
  const [sections, setSections] = useState<SectionsSettings>(defaultSections);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('homepage_settings')
      .select('key, value')
      .then(({ data }) => {
        if (data) {
          for (const row of data) {
            if (row.key === 'hero') setHero({ ...defaultHero, ...(row.value as Partial<HeroSettings>) });
            if (row.key === 'logo') setLogo({ ...defaultLogo, ...(row.value as Partial<LogoSettings>) });
            if (row.key === 'navbar') setNavbar({ ...defaultNavbar, ...(row.value as Partial<NavbarSettings>) });
            if (row.key === 'sections') setSections({ ...defaultSections, ...(row.value as Partial<SectionsSettings>) });
          }
        }
        setLoading(false);
      });
  }, []);

  return { hero, logo, navbar, sections, loading };
}

export { defaultHero, defaultLogo, defaultNavbar, defaultSections };
