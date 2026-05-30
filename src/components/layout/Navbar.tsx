import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, LogOut, LayoutDashboard, ChevronDown, Menu, X, CalendarDays, User as UserIcon, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useHomepageSettings } from '../../lib/useHomepageSettings';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { logo, navbar } = useHomepageSettings();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = location.pathname === '/';
  const isTransparent = isHome && !scrolled;

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Mbylli menutë ne navigation change
  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  function getDashboardPath() {
    if (!profile) return '/login';
    if (profile.role === 'super_admin') return '/admin';
    if (profile.role === 'company_admin') return '/kompania';
    return '/dashboard';
  }

  function getBookingsPath() {
    if (!profile) return '/login';
    if (profile.role === 'company_admin') return '/kompania/rezervimet';
    return '/dashboard/rezervimet';
  }

  function getProfilePath() {
    if (!profile) return '/login';
    if (profile.role === 'company_admin') return '/kompania/cilesimet';
    if (profile.role === 'super_admin') return '/admin/cilesimet';
    return '/dashboard/profili';
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isTransparent ? 'bg-transparent' : 'bg-white/95 backdrop-blur-xl shadow-sm shadow-dark-950/5 border-b border-gray-100/80'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[68px] gap-3">
          <Link to="/" className="flex items-center gap-2.5 group min-w-0">
            {logo.logo_url ? (
              <img src={logo.logo_url} alt={logo.site_name} className="h-8 w-auto object-contain" />
            ) : logo.show_icon !== false && (
              <div className={`p-1.5 rounded-lg transition-colors ${isTransparent ? 'bg-white/10 group-hover:bg-white/20' : 'bg-primary-600 group-hover:bg-primary-700'}`}>
                <Car className="w-5 h-5 text-white" />
              </div>
            )}
            {logo.show_text !== false && (
              <span className={`text-base sm:text-lg font-bold tracking-tight transition-colors truncate ${isTransparent ? 'text-white' : 'text-dark-950'}`}>{logo.site_name || 'RentaKar'}</span>
            )}
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/automjetet" isTransparent={isTransparent} active={location.pathname.startsWith('/automjetet')}>
              {t('nav.vehicles')}
            </NavLink>
            <NavLink to="/per-platformen" isTransparent={isTransparent} active={location.pathname === '/per-platformen'}>
              {t('nav.about')}
            </NavLink>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher variant={isTransparent ? 'navbar-dark' : 'navbar'} />

            {user && <NotificationBell isTransparent={isTransparent} />}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-label={t('nav.userMenu', 'Menuja e perdoruesit')}
                  className={`flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors ${isTransparent ? 'hover:bg-white/10 text-white/90' : 'hover:bg-gray-50 text-dark-700'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isTransparent ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-primary-500 to-purple-600 text-white'}`}>
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate">{profile?.full_name?.split(' ')[0]}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl shadow-dark-950/10 border border-gray-100 py-1.5 z-50 animate-slide-down">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                            {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-dark-950 truncate">{profile?.full_name}</p>
                            <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="py-1">
                        <DropdownItem to={getDashboardPath()} icon={<LayoutDashboard className="w-4 h-4" />}>
                          {t('nav.dashboard')}
                        </DropdownItem>
                        <DropdownItem to={getBookingsPath()} icon={<CalendarDays className="w-4 h-4" />}>
                          {t('nav.bookings')}
                        </DropdownItem>
                        <DropdownItem to={getProfilePath()} icon={profile?.role === 'company_admin' ? <Building2 className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}>
                          {profile?.role === 'company_admin' ? t('nav.company', 'Kompania') : t('nav.profile', 'Profili')}
                        </DropdownItem>
                      </div>
                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={() => { setDropdownOpen(false); handleSignOut(); }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('nav.logout')}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Desktop: 2 butona (Login text + Register primary) */}
                <Link
                  to="/login"
                  className={`hidden sm:inline-block px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isTransparent ? 'text-white/90 hover:text-white hover:bg-white/10' : 'text-dark-700 hover:bg-gray-50'
                  }`}
                >
                  {navbar.login_button_text || t('nav.login')}
                </Link>
                <Link
                  to="/regjistrohu"
                  className={`hidden sm:inline-block px-4 py-2 text-sm font-semibold rounded-lg transition-colors shadow-sm ${
                    isTransparent
                      ? 'bg-white text-dark-950 hover:bg-gray-100'
                      : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/20'
                  }`}
                >
                  {t('nav.signUp', 'Regjistrohu')}
                </Link>
              </>
            )}

            {/* Hamburger per mobile (vetem per anon — useri ka bottom nav ne app + dropdown me sipas) */}
            {!user && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={t('nav.toggleMenu', 'Hap menuene')}
                className={`md:hidden p-2 rounded-lg transition-colors ${
                  isTransparent ? 'text-white/90 hover:bg-white/10' : 'text-dark-700 hover:bg-gray-50'
                }`}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu — vetem per anon ne pages publike */}
        {mobileMenuOpen && !user && (
          <div className="md:hidden border-t border-gray-100 bg-white animate-slide-down">
            <div className="px-2 py-3 space-y-1">
              <MobileNavLink to="/automjetet">{t('nav.vehicles')}</MobileNavLink>
              <MobileNavLink to="/per-platformen">{t('nav.about')}</MobileNavLink>
              <div className="border-t border-gray-100 my-2" />
              <MobileNavLink to="/login">{navbar.login_button_text || t('nav.login')}</MobileNavLink>
              <Link
                to="/regjistrohu"
                className="block px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg text-center hover:bg-primary-700 transition-colors mt-2"
              >
                {t('nav.signUp', 'Regjistrohu')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ to, isTransparent, active, children }: { to: string; isTransparent: boolean; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? isTransparent ? 'text-white bg-white/15' : 'text-primary-700 bg-primary-50'
          : isTransparent ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-dark-600 hover:text-dark-950 hover:bg-gray-50'
      }`}
    >
      {children}
    </Link>
  );
}

function DropdownItem({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-dark-700 hover:bg-gray-50 transition-colors"
    >
      <span className="text-dark-400">{icon}</span>
      {children}
    </Link>
  );
}

function MobileNavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="block px-4 py-2.5 text-sm font-medium text-dark-700 hover:bg-gray-50 rounded-lg transition-colors"
    >
      {children}
    </Link>
  );
}
