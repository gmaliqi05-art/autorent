import { useState, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Shield, Clock, ArrowRight, HeartHandshake, CheckCircle } from 'lucide-react';
import FeaturedVehicles from '../components/home/FeaturedVehicles';
import HowItWorks from '../components/home/HowItWorks';
import Testimonials from '../components/home/Testimonials';
import CompanyCTA from '../components/home/CompanyCTA';
import TrustBanner from '../components/home/TrustBanner';
import PricingSection from '../components/home/PricingSection';
import { useHomepageSettings } from '../lib/useHomepageSettings';

const NearbyCompaniesMap = lazy(() => import('../components/map/NearbyCompaniesMap'));

export default function HomePage() {
  const settings = useHomepageSettings();

  return (
    <div className="overflow-hidden">
      <HeroSection settings={settings} />
      {settings.sections.show_categories && <CategoriesSection settings={settings} />}
      {settings.sections.show_featured && <FeaturedVehicles settings={settings} />}
      <MapSection />
      {settings.sections.show_how_it_works && <HowItWorks />}
      {settings.sections.show_testimonials && <Testimonials />}
      <PricingSection />
      {settings.sections.show_company_cta && <CompanyCTA />}
      {settings.sections.show_trust_banner && <TrustBanner />}
    </div>
  );
}

function MapSection() {
  return (
    <section className="py-24 bg-gray-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-4">
          <div>
            <p className="text-primary-600 font-semibold text-sm tracking-wide uppercase mb-2">Gjeni vendndodhjen</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-dark-950 leading-tight">
              Gjeni automjetin qe ju pershtatet
            </h2>
            <p className="text-dark-500 mt-3 max-w-lg">
              Aktivizoni lokalizimin dhe shikoni pikat me te aferta te marrjes me qira. Klikoni mbi nje kompani per te pare automjetet disponibil.
            </p>
          </div>
          <Link to="/automjetet" className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors group shrink-0">
            Shiko te gjitha
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
  const [city, setCity] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [pickupDate, setPickupDate] = useState(today);
  const [returnDate, setReturnDate] = useState(threeDaysLater);
  const { hero } = settings;

  function handleSearch() {
    let url = '/automjetet';
    const params: string[] = [];
    if (city) params.push('city=' + city);
    if (params.length > 0) url += '?' + params.join('&');
    navigate(url);
  }

  const opacity = hero.overlay_opacity ?? 70;
  const overlayStyle = { opacity: opacity / 100 };

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
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 sm:py-4 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-sm text-white focus:ring-2 focus:ring-primary-400 focus:bg-white/20 transition-colors appearance-none cursor-pointer font-medium [&>option]:text-dark-900"
                >
                  <option value="">{hero.search_label_city}</option>
                  <option value="Prishtine">Prishtine, Kosove</option>
                  <option value="Tirane">Tirane, Shqiperi</option>
                  <option value="Shkup">Shkup, Maqedoni</option>
                  <option value="Prizren">Prizren, Kosove</option>
                  <option value="Shkoder">Shkoder, Shqiperi</option>
                  <option value="Durres">Durres, Shqiperi</option>
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

const categories = [
  { id: 'ekonomike', label: 'Ekonomike', image: 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=400&h=260&fit=crop', desc: 'Nga 15 EUR/dite', count: '120+' },
  { id: 'kompakte', label: 'Kompakte', image: 'https://images.pexels.com/photos/100656/pexels-photo-100656.jpeg?auto=compress&cs=tinysrgb&w=400&h=260&fit=crop', desc: 'Nga 25 EUR/dite', count: '95+' },
  { id: 'sedan', label: 'Sedan', image: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=400&h=260&fit=crop', desc: 'Nga 35 EUR/dite', count: '80+' },
  { id: 'suv', label: 'SUV', image: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=400&h=260&fit=crop', desc: 'Nga 45 EUR/dite', count: '70+' },
  { id: 'luksoz', label: 'Luksoze', image: 'https://images.pexels.com/photos/120049/pexels-photo-120049.jpeg?auto=compress&cs=tinysrgb&w=400&h=260&fit=crop', desc: 'Nga 65 EUR/dite', count: '35+' },
  { id: 'furgon', label: 'Furgon', image: 'https://images.pexels.com/photos/2533092/pexels-photo-2533092.jpeg?auto=compress&cs=tinysrgb&w=400&h=260&fit=crop', desc: 'Nga 40 EUR/dite', count: '25+' },
];

function CategoriesSection({ settings }: { settings: ReturnType<typeof useHomepageSettings> }) {
  const { sections } = settings;
  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-14 gap-4">
          <div>
            <p className="text-primary-600 font-semibold text-sm tracking-wide uppercase mb-2">{sections.categories_subtitle}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-dark-950 leading-tight">
              {sections.categories_title}
            </h2>
          </div>
          <Link to="/automjetet" className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors group">
            Shiko te gjitha
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={'/automjetet?category=' + cat.id}
              className="group relative rounded-2xl overflow-hidden aspect-[3/2] lg:aspect-[16/10]"
            >
              <img
                src={cat.image}
                alt={cat.label}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-dark-950/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-6">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="text-lg lg:text-xl font-bold text-white mb-0.5">{cat.label}</h3>
                    <p className="text-sm text-white/70">{cat.desc}</p>
                  </div>
                  <div className="glass rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-xs font-semibold text-white">{cat.count}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
