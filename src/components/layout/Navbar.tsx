import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, Menu, X, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useHomepageSettings } from '../../lib/useHomepageSettings';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { logo, navbar } = useHomepageSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isTransparent ? 'bg-transparent' : 'bg-white/95 backdrop-blur-xl shadow-sm shadow-dark-950/5 border-b border-gray-100/80'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[68px]">
          <Link to="/" className="flex items-center gap-2.5 group">
            {logo.logo_url ? (
              <img src={logo.logo_url} alt={logo.site_name} className="h-8 w-auto object-contain" />
            ) : logo.show_icon !== false && (
              <div className={`p-1.5 rounded-lg transition-colors ${isTransparent ? 'bg-white/10 group-hover:bg-white/20' : 'bg-primary-600 group-hover:bg-primary-700'}`}>
                <Car className="w-5 h-5 text-white" />
              </div>
            )}
            {logo.show_text !== false && (
              <span className={`text-lg font-bold tracking-tight transition-colors ${isTransparent ? 'text-white' : 'text-dark-950'}`}>{logo.site_name || 'RentaKar'}</span>
            )}
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navbar.show_vehicles_link !== false && (
              <NavLink to="/automjetet" transparent={isTransparent}>{navbar.vehicles_link_text || t('nav.vehicles')}</NavLink>
            )}

            <div className="ml-1">
              <LanguageSwitcher variant={isTransparent ? 'navbar-dark' : 'navbar'} />
            </div>

            {user ? (
              <div className="relative ml-2">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isTransparent ? 'hover:bg-white/10 text-white/90' : 'hover:bg-gray-50 text-dark-700'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isTransparent ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700'}`}>
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate">{profile?.full_name?.split(' ')[0]}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-xl shadow-dark-950/10 border border-gray-100 py-1.5 z-50 animate-slide-down">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-dark-950">{profile?.full_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{profile?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to={getDashboardPath()}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-dark-700 hover:bg-gray-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-dark-400" />
                          {t('nav.dashboard')}
                        </Link>
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
              <div className="flex items-center gap-2 ml-3">
                <Link
                  to="/login"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isTransparent ? 'text-white/90 hover:bg-white/10' : 'text-dark-700 hover:bg-gray-50'}`}
                >
                  {navbar.login_button_text || t('nav.login')}
                </Link>
                <Link
                  to="/regjistrohu"
                  className="px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-sm shadow-primary-600/20"
                >
                  {navbar.register_button_text || t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-1">
            {mobileOpen
              ? <X className={`w-6 h-6 ${isTransparent ? 'text-white' : 'text-dark-950'}`} />
              : <Menu className={`w-6 h-6 ${isTransparent ? 'text-white' : 'text-dark-950'}`} />
            }
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            {navbar.show_vehicles_link !== false && (
              <MobileLink to="/automjetet" onClick={() => setMobileOpen(false)}>{navbar.vehicles_link_text || t('nav.vehicles')}</MobileLink>
            )}
            <div className="px-3 py-2 border-t border-gray-100 mt-1">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">{t('common.language')}</p>
              <LanguageSwitcher variant="compact" />
            </div>
            {user ? (
              <>
                <MobileLink to={getDashboardPath()} onClick={() => setMobileOpen(false)}>{t('nav.dashboard')}</MobileLink>
                <button onClick={() => { setMobileOpen(false); handleSignOut(); }} className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <MobileLink to="/login" onClick={() => setMobileOpen(false)}>{navbar.login_button_text || t('nav.login')}</MobileLink>
                <MobileLink to="/regjistrohu" onClick={() => setMobileOpen(false)}>{navbar.register_button_text || t('nav.register')}</MobileLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, children, transparent }: { to: string; children: React.ReactNode; transparent: boolean }) {
  const location = useLocation();
  const active = location.pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        transparent
          ? `text-white/80 hover:text-white hover:bg-white/10 ${active ? 'text-white bg-white/10' : ''}`
          : `text-dark-600 hover:text-dark-950 hover:bg-gray-50 ${active ? 'text-primary-600 bg-primary-50' : ''}`
      }`}
    >
      {children}
    </Link>
  );
}

function MobileLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="block px-3 py-2.5 text-sm font-medium text-dark-700 rounded-lg hover:bg-gray-50 transition-colors">
      {children}
    </Link>
  );
}
