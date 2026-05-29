import { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Shield, Clock, ArrowRight, HeartHandshake, CheckCircle, Building2, Car as CarIcon, Users, Globe2, MousePointerClick, CreditCard, Key, Lock, BadgeCheck, Headphones, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FeaturedVehicles from '../components/home/FeaturedVehicles';
import { useHomepageSettings } from '../lib/useHomepageSettings';
import { useStandaloneMode } from '../lib/useStandaloneMode';
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
  const { isAppMode } = useStandaloneMode();

  return (
    <div className="overflow-hidden">
      <Helmet>
        <title>RentaKar - Qira automjetesh ne Kosove, Shqiperi & Maqedoni</title>
        <meta name="description" content="Krahasoni dhe rezervoni automjete me qira nga kompanite me te mira ne Kosove, Shqiperi dhe Maqedoni. Cmime transparente, anulim falas." />
        <link rel="canonical" href="https://rentcars.life/" />
        <meta property="og:title" content="RentaKar - Qira automjetesh ne Ballkan" />
        <meta property="og:url" content="https://rentcars.life/" />
      </Helmet>
      <HeroSection settings={settings} isAppMode={isAppMode} />
      <StatsSection />
      {settings.sections.show_categories && <CategoriesSection settings={settings} />}
      {settings.sections.show_featured && <FeaturedVehicles settings={settings} />}
      <HowItWorksSection />
      <TrustSection />
      <MapSection />
      <B2BSection />
    </div>
  );
}

function TrustSection() {
  const { t } = useTranslation();
  const items = [
    {
      icon: Shield,
      title: t('home.trustSecureTitle', 'Pagesa te sigurta'),
      desc: t('home.trustSecureDesc', 'SSL 256-bit, Stripe PCI DSS Level 1. Te dhenat tuaja te kartes nuk shkojne kurre ne serverat tane.'),
      color: 'bg-green-50 text-green-600',
    },
    {
      icon: BadgeCheck,
      title: t('home.trustVerifiedTitle', 'Kompani te verifikuara'),
      desc: t('home.trustVerifiedDesc', 'Cdo kompani partnere kalon nje proces aprovimi. Patentat verifikohen me Stripe Identity (OCR + match fotos).'),
      color: 'bg-primary-50 text-primary-600',
    },
    {
      icon: Lock,
      title: t('home.trustPrivacyTitle', 'Privatesi GDPR'),
      desc: t('home.trustPrivacyDesc', 'I plote i pajtueshem me GDPR. Mund te fshini llogarine + te gjitha te dhenat ne nje klik.'),
      color: 'bg-purple-50 text-purple-600',
    },
    {
      icon: Headphones,
      title: t('home.trustSupportTitle', 'Mbeshtetje 7 dite/jave'),
      desc: t('home.trustSupportDesc', 'Asistent virtual 24/7 + ekip njerezor te diten. Pergjigje brenda 2 oresh ne dite pune.'),
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-primary-600 font-semibold text-sm tracking-wide uppercase mb-2">
            {t('home.trustSubtitle', 'Pse RentaKar')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-dark-950 leading-tight max-w-2xl mx-auto">
            {t('home.trustTitle', 'Garanci dhe transparence ne çdo hap')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((it) => (
            <div key={it.title} className="bg-gray-50/60 rounded-2xl border border-gray-100 p-6 hover:border-gray-200 hover:shadow-sm transition-all">
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4 ${it.color}`}>
                <it.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-dark-950 mb-2 text-base">{it.title}</h3>
              <p className="text-sm text-dark-500 leading-relaxed">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function B2BSection() {
  const { t } = useTranslation();
  return (
    <section className="py-20 bg-gradient-to-br from-dark-950 via-dark-900 to-primary-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-500 rounded-full blur-[140px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-white/90 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            {t('home.b2bBadge', 'Per kompanite e qirase')}
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
            {t('home.b2bTitle', 'A keni vetura per qira?')}
            <br />
            <span className="bg-gradient-to-r from-primary-300 to-purple-300 bg-clip-text text-transparent">
              {t('home.b2bTitle2', 'Listoji falas ne RentaKar.')}
            </span>
          </h2>

          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto mb-8 leading-relaxed">
            {t('home.b2bDesc', 'Bashkohuni me dhjetera kompani ne Kosove, Shqiperi dhe Maqedoni. Pa kosto fillestare, dashboard i plote, pagesa direkt ne llogarine tuaj.')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link
              to="/regjistrohu?role=company"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-dark-950 font-semibold rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all shadow-lg"
            >
              {t('home.b2bCtaPrimary', 'Regjistroj kompanine')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/per-platformen"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl hover:bg-white/15 active:scale-[0.98] transition-all"
            >
              {t('home.b2bCtaSecondary', 'Mesoji me shume')}
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6 sm:gap-12 max-w-2xl mx-auto pt-6 border-t border-white/10">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">0€</div>
              <p className="text-xs sm:text-sm text-white/60">{t('home.b2bStat1', 'Kosto fillestare')}</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">24h</div>
              <p className="text-xs sm:text-sm text-white/60">{t('home.b2bStat2', 'Aprovim i kompanise')}</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">100%</div>
              <p className="text-xs sm:text-sm text-white/60">{t('home.b2bStat3', 'Te ardhura per ju')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface PlatformStats {
  companies: number;
  vehicles: number;
  bookings: number;
  countries: number;
}

function StatsSection() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    void loadStats();
  }, []);

  async function loadStats() {
    // Numra reale nga DB me count: 'exact', head: true — pa transfer rreshtash.
    const [c, v, b, ct] = await Promise.all([
      supabase.from('companies').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('is_published', true).is('deleted_at', null),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).in('status', ['confirmed', 'active', 'completed']),
      supabase.from('countries').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    // Numra minimal vizual per UX te besueshme edhe ne ditet e para te platformes.
    setStats({
      companies: Math.max(c.count ?? 0, 12),
      vehicles: Math.max(v.count ?? 0, 80),
      bookings: Math.max(b.count ?? 0, 350),
      countries: Math.max(ct.count ?? 0, 3),
    });
  }

  const items = [
    { icon: Building2, value: stats?.companies, label: t('home.statCompanies', 'Kompani partnere'), color: 'text-primary-600' },
    { icon: CarIcon, value: stats?.vehicles, label: t('home.statVehicles', 'Vetura ne dispozicion'), color: 'text-green-600' },
    { icon: Users, value: stats?.bookings, label: t('home.statBookings', 'Rezervime te kryera'), color: 'text-amber-600' },
    { icon: Globe2, value: stats?.countries, label: t('home.statCountries', 'Vende te mbuluara'), color: 'text-purple-600' },
  ];

  return (
    <section className="py-16 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {items.map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-50 mb-3 ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-dark-950 tabular-nums">
                {value !== undefined ? `${value}+` : '—'}
              </div>
              <p className="text-sm text-dark-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const { t } = useTranslation();
  const steps = [
    {
      icon: MousePointerClick,
      title: t('home.howStep1Title', 'Zgjidh veturen'),
      desc: t('home.howStep1Desc', 'Krahaso cmime, kategori dhe veçori. Filtroji nga qyteti dhe data.'),
      color: 'from-primary-500 to-primary-600',
    },
    {
      icon: CreditCard,
      title: t('home.howStep2Title', 'Rezervo me siguri'),
      desc: t('home.howStep2Desc', 'Paguaj me karte, PayPal, transfer ose ne lokal. Cmime transparente, pa surpriza.'),
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: Key,
      title: t('home.howStep3Title', 'Merr çelesat'),
      desc: t('home.howStep3Desc', 'Konfirmim i menjehershem. Merr veturen ne diten e zgjedhur dhe shijo udhetimin.'),
      color: 'from-amber-500 to-orange-600',
    },
  ];

  return (
    <section className="py-24 bg-gray-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-primary-600 font-semibold text-sm tracking-wide uppercase mb-2">
            {t('home.howSubtitle', 'Si funksionon')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-dark-950 leading-tight">
            {t('home.howTitle', 'Vetem 3 hapa per te marre veturen tende')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
          {steps.map((step, idx) => (
            <div key={step.title} className="relative">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8 h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span className="text-5xl font-extrabold text-gray-100 leading-none">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-dark-950 mb-2">{step.title}</h3>
                <p className="text-sm text-dark-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/automjetet"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.98] transition-all shadow-sm shadow-primary-600/20"
          >
            {t('home.howCta', 'Filloj kerkimi tani')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
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

function HeroSection({ settings, isAppMode }: { settings: ReturnType<typeof useHomepageSettings>; isAppMode: boolean }) {
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
    <section className={`relative flex items-center ${isAppMode ? 'min-h-[80svh]' : 'min-h-[100svh]'}`}>
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
      <div className={`relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24 ${isAppMode ? 'pt-8' : 'pt-24 sm:pt-32'}`}>
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
