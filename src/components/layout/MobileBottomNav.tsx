/**
 * 🔒 PROTECTED COMPONENT — DO NOT DELETE OR REVERT
 *
 * Bottom navigation per platformen kur perdoret si app (PWA standalone
 * ose Capacitor native).
 *
 * Shfaqet vetem ne menyre app, jo ne browser tradicional.
 *
 * Tab-et adaptohen sipas rolit:
 *  - Visitor / Klient: Home / Veturat / Rezervimet / Profili (ose Kycu)
 *  - Company admin: Dashboard / Veturat / Rezervimet / Cilesimet
 *  - Super admin: Dashboard / Kompani / Perdorues / Cilesimet
 */
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Car, CalendarDays, Building2, Settings, LayoutDashboard, User, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

type TabItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  /** Match also when path starts with `to` (per sub-routes) */
  prefix?: boolean;
};

function getTabs(role: string | undefined, isLoggedIn: boolean, t: (k: string) => string): TabItem[] {
  if (role === 'super_admin') {
    return [
      { to: '/admin', label: t('nav.dashboard'), icon: <LayoutDashboard className="w-5 h-5" /> },
      { to: '/admin/kompanite', label: t('nav.companies'), icon: <Building2 className="w-5 h-5" />, prefix: true },
      { to: '/admin/cilesimet', label: t('nav.settings'), icon: <Settings className="w-5 h-5" />, prefix: true },
    ];
  }

  if (role === 'company_admin') {
    return [
      { to: '/kompania', label: t('nav.dashboard'), icon: <LayoutDashboard className="w-5 h-5" /> },
      { to: '/kompania/automjetet', label: t('nav.vehicles'), icon: <Car className="w-5 h-5" />, prefix: true },
      { to: '/kompania/rezervimet', label: t('nav.bookings'), icon: <CalendarDays className="w-5 h-5" />, prefix: true },
    ];
  }

  if (isLoggedIn) {
    return [
      { to: '/', label: t('nav.home'), icon: <Home className="w-5 h-5" /> },
      { to: '/automjetet', label: t('nav.vehicles'), icon: <Car className="w-5 h-5" />, prefix: true },
      { to: '/dashboard/rezervimet', label: t('nav.bookings'), icon: <CalendarDays className="w-5 h-5" />, prefix: true },
      { to: '/dashboard/profili', label: t('nav.profile'), icon: <User className="w-5 h-5" />, prefix: true },
    ];
  }

  return [
    { to: '/', label: t('nav.home'), icon: <Home className="w-5 h-5" /> },
    { to: '/automjetet', label: t('nav.vehicles'), icon: <Car className="w-5 h-5" />, prefix: true },
    { to: '/per-platformen', label: t('nav.about'), icon: <Building2 className="w-5 h-5" /> },
    { to: '/login', label: t('nav.login'), icon: <LogIn className="w-5 h-5" /> },
  ];
}

export default function MobileBottomNav() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const tabs = getTabs(profile?.role, !!user, t);

  function isActive(tab: TabItem): boolean {
    if (tab.prefix) {
      return location.pathname === tab.to || location.pathname.startsWith(tab.to + '/');
    }
    return location.pathname === tab.to;
  }

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 grid safe-area-bottom ${
        tabs.length === 3 ? 'grid-cols-3' : 'grid-cols-4'
      }`}
      aria-label={t('nav.home')}
    >
      {tabs.map((tab) => {
        const active = isActive(tab);
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
              active ? 'text-primary-600' : 'text-dark-500'
            }`}
          >
            <span className={active ? 'text-primary-600' : 'text-dark-400'}>{tab.icon}</span>
            <span className={`text-[10px] font-medium ${active ? 'text-primary-600' : 'text-dark-500'}`}>
              {tab.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
