import { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Shield, Clock, ArrowRight, HeartHandshake, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FeaturedVehicles from '../components/home/FeaturedVehicles';
import { useHomepageSettings } from '../lib/useHomepageSettings';
import { supabase } from '../lib/supabase';
import { Helmet } from 'react-helmet-async';

const NearbyCompaniesMap = lazy(() => import('../components/map/NearbyCompaniesMap'));

type HeroCity = { id: string; name: string };

/**
 * Homepage e thjeshte qe fokusohet ne vizituesin qe kerkon nje vetur:
 *  - Hero me kerkim
 *  - Kategorite
 *  - Veturat e zgjedhura
 *  - Harta me kompani te afërt
 *
 * Info gjeneral per platformen, abonime, deshmi, etj. jane lëvizur ne /per-platformen.
 */
export default function HomePage() {
  const settings = useHomepageSettings();

  return (
    <div className="overflow-hidden">
      <Helmet>
        <title>RentaKar - Qira automjetesh ne Kosove, Shqiperi & Maqedoni</title>
        <meta name="description" content="Krahasoni dhe rezervoni automjete me qira nga kompanite me te mira ne Kosove, Shqiperi dhe Maqedoni. Cmime transparente, anulim falas." />
        <link rel="canonical" href="https://rentcars.life/" />
        <meta property="og:title" content="RentaKar - Qira automjetesh ne Ballkan" />
        <meta property="og:url" content="https://rentcars.life/" />
      </Helmet>
      <HeroSection settings={settings} />
      {settings.sections.show_categories && <CategoriesSection settings={settings} />}
      {settings.sections.show_featured && <FeaturedVehicles settings={settings} />}
      <MapSection />
    </div>
  );
}

function MapSection() {
  const { t } = useTranslation();
  return (
    <section className="py-24 bg-gray-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-4">
          <div>
            <p className="text-primary-600 font-semibold text-sm tracking-wide uppercase mb-2">{t('home.mapSubtitle')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-dark-950 leading-tight">
              {t('home.mapTitle')}
            </h2>
            <p className="text-dark-500 mt-3 max-w-lg">
              {t('home.mapDesc')}
            </p>
          </div>
          <Link to="/automjetet" className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors group shrink-0">
            {t('common.viewAll')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <Suspense fallback={
          <div className="h-[500px] bg-white rounded-2xl border border-gray-200 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        }>
          <NearbyCompaniesMap />
        </Suspense>
      </div>
    </section>
  );
}

function HeroSection({ settings }: { settings: ReturnType<typeof useHomepageSettings> }) {
  const navigate = useNavigate();
  const [cityId, setCityId] = useState('');
  const [cities, setCities] = useState<HeroCity[]>([]);
  const today = new Date().toISOString().split('T')[0];
  const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [pickupDate, setPickupDate] = useState(today);
  const [returnDate, setReturnDate] = useState(threeDaysLater);
  const { hero } = settings;

  useEffect(() => {
    supabase
      .from('cities')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setCities((data || []) as HeroCity[]));
  }, []);

  function handleSearch() {
    const params = new URLSearchParams();
    if (cityId) params.set('city', cityId);
    if (pickupDate) params.set('pickup', pickupDate);
    if (returnDate) params.set('return', returnDate);
    const qs = params.toString();
    navigate('/automjetet' + (qs ? '?' + qs : ''));
  }

  const opacity = hero.overlay_opacity ?? 70;

  return (
    <section className="relative min-h-[100svh] flex items-center">
      <div className="absolute inset-0">
        <picture>
          {hero.image_url_mobile && (
            <source media="(max-width: 1023px)" srcSet={hero.image_url_mobile} />
          )}
          <img
            src={hero.image_url || 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'}
            alt="Premium car"
            className="w-full h-full object-cover hero-image-responsive"
            style={{
              ['--hero-pos-mobile' as string]: hero.image_position_mobile || '70% center',
              ['--hero-pos-desktop' as string]: hero.image_position_desktop || 'center',
            }}
          />
        </picture>
        <div className="absolute inset-0 bg-dark-950" style={{ opacity: Math.max((opacity / 100) - 0.15, 0.35) }} />
        <div className="absolute inset-0 hero-gradient" />
      </div>
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-3xl">
          {hero.badge_text && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-xs sm:text-sm font-medium mb-4 sm:mb-6 animate-slide-up">
              {hero.badge_text}
            </div>
          )}
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-white mb-3 sm:mb-6 leading-[1.1] tracking-tight animate-slide-up">
            {hero.title_line1}
            <br />
            <span className="gradient-text">{hero.title_line2}</span>
          </h1>

          <p className="text-sm sm:text-lg text-gray-300/90 mb-6 sm:mb-12 max-w-xl leading-relaxed font-light animate-slide-up-delay-1 line-clamp-3 sm:line-clamp-none">
            {hero.subtitle}
          </p>
        </div>

        <div className="animate-slide-up-delay-2 max-w-4xl">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 sm:p-3 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative group">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none z-10" />
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 sm:py-4 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-sm text-white focus:ring-2 focus:ring-primary-400 focus:bg-white/20 transition-colors appearance-none cursor-pointer font-medium [&>option]:text-dark-900"
                >
                  <option value="">{hero.search_label_city}</option>
                  {cities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 sm:contents gap-2">
                <div className="flex-1 relative group">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none z-10" />
                  <input
                    type="date"
                    min={today}
                    value={pickupDate}
                    onChange={e => setPickupDate(e.target.value)}
                    placeholder={hero.search_label_pickup}
                    className="w-full pl-10 pr-2 py-3 sm:py-4 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-sm text-white focus:ring-2 focus:ring-primary-400 focus:bg-white/20 transition-colors font-medium [color-scheme:dark]"
                  />
                </div>
                <div className="flex-1 relative group">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none z-10" />
                  <input
                    type="date"
                    min={pickupDate || today}
                    value={returnDate}
                    onChange={e => setReturnDate(e.target.value)}
                    placeholder={hero.search_label_return}
                    className="w-full pl-10 pr-2 py-3 sm:py-4 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-sm text-white focus:ring-2 focus:ring-primary-400 focus:bg-white/20 transition-colors font-medium [color-scheme:dark]"
                  />
                </div>
              </div>
              <button
                onClick={handleSearch}
                className="flex items-center justify-center gap-2 px-6 py-3 sm:py-4 bg-primary-600 text-white font-semibold text-sm rounded-xl hover:bg-primary-700 active:scale-[0.98] transition-all shadow-lg shadow-primary-600/25"
              >
                <Search className="w-4 h-4 shrink-0" />
                <span>{hero.search_button_text}</span>
              </button>
            </div>
          </div>

          {hero.show_trust_badges && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-4 sm:mt-8 animate-fade-in-delay-3">
              {hero.trust_badge_1 && (
                <div className="flex items-center gap-1.5 text-white/70">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 shrink-0" />
                  <span className="text-xs sm:text-sm">{hero.trust_badge_1}</span>
                </div>
              )}
              {hero.trust_badge_2 && (
                <div className="flex items-center gap-1.5 text-white/70">
                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-400 shrink-0" />
                  <span className="text-xs sm:text-sm">{hero.trust_badge_2}</span>
                </div>
              )}
              {hero.trust_badge_3 && (
                <div className="flex items-center gap-1.5 text-white/70">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-400 shrink-0" />
                  <span className="text-xs sm:text-sm">{hero.trust_badge_3}</span>
                </div>
              )}
              {hero.trust_badge_4 && (
                <div className="hidden sm:flex items-center gap-1.5 text-white/70">
                  <HeartHandshake className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 shrink-0" />
                  <span className="text-xs sm:text-sm">{hero.trust_badge_4}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}

type CategoryStat = {
  key: string;
  label_sq: string;
  label_en: string;
  label_de: string;
  image_url: string | null;
  default_min_price: number | string;
  min_price: number | string | null;
  vehicle_count: number;
};

const categoryFallbackImages: Record<string, string> = {
  ekonomike: 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=400&h=260&fit=crop',
  kompakte: 'https://images.pexels.com/photos/100656/pexels-photo-100656.jpeg?auto=compress&cs=tinysrgb&w=400&h=260&fit=crop',
  sedan: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=400&h=260&fit=crop',
  suv: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=400&h=260&fit=crop',
  luksoz: 'https://images.pexels.com/photos/120049/pexels-photo-120049.jpeg?auto=compress&cs=tinysrgb&w=400&h=260&fit=crop',
  minivan: 'https://images.pexels.com/photos/14674670/pexels-photo-14674670.jpeg?auto=compress&cs=tinysrgb&w=400&h=260&fit=crop',
  furgon: 'https://images.pexels.com/photos/2533092/pexels-photo-2533092.jpeg?auto=compress&cs=tinysrgb&w=400&h=260&fit=crop',
};

function CategoriesSection({ settings }: { settings: ReturnType<typeof useHomepageSettings> }) {
  const { t, i18n } = useTranslation();
  const { sections } = settings;
  const [categories, setCategories] = useState<CategoryStat[]>([]);

  useEffect(() => {
    supabase
      .from('vehicle_categories_with_stats')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setCategories((data || []) as CategoryStat[]));
  }, []);

  const lang = i18n.language || 'sq';
  const labelOf = (c: CategoryStat) => (lang === 'en' ? c.label_en : lang === 'de' ? c.label_de : c.label_sq);

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-14 gap-4">
          <div>
            <p className="text-primary-600 font-semibold text-sm tracking-wide uppercase mb-2">{sections.categories_subtitle || t('home.categoriesSubtitle')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-dark-950 leading-tight">
              {sections.categories_title || t('home.categoriesTitle')}
            </h2>
          </div>
          <Link to="/automjetet" className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors group">
            {t('common.viewAll')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {categories.map((cat) => {
            const displayPrice = Math.round(Number(cat.min_price ?? cat.default_min_price ?? 0));
            const image = cat.image_url || categoryFallbackImages[cat.key] || categoryFallbackImages.sedan;
            return (
              <Link
                key={cat.key}
                to={'/automjetet?category=' + cat.key}
                className="group relative rounded-2xl overflow-hidden aspect-[3/2] lg:aspect-[16/10]"
              >
                <img
                  src={image}
                  alt={labelOf(cat)}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-dark-950/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="text-lg lg:text-xl font-bold text-white mb-0.5">{labelOf(cat)}</h3>
                      <p className="text-sm text-white/70">{t('home.categoryFromPrice', { price: displayPrice })}</p>
                    </div>
                    {cat.vehicle_count > 0 && (
                      <div className="glass rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-xs font-semibold text-white">{cat.vehicle_count}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
