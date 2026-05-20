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
import { Home, Car, CalendarDays, User, Building2, Users, Settings, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type TabItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  /** Match also when path starts with `to` (per sub-routes) */
  prefix?: boolean;
};

function getTabs(role: string | undefined, isLoggedIn: boolean): TabItem[] {
  if (role === 'super_admin') {
    return [
      { to: '/admin', label: 'Paneli', icon: <LayoutDashboard className="w-5 h-5" /> },
      { to: '/admin/kompanite', label: 'Kompani', icon: <Building2 className="w-5 h-5" />, prefix: true },
      { to: '/admin/perdoruesit', label: 'Perdorues', icon: <Users className="w-5 h-5" />, prefix: true },
      { to: '/admin/cilesimet', label: 'Cilësimet', icon: <Settings className="w-5 h-5" />, prefix: true },
    ];
  }

  if (role === 'company_admin') {
    return [
      { to: '/kompania', label: 'Paneli', icon: <LayoutDashboard className="w-5 h-5" /> },
      { to: '/kompania/automjetet', label: 'Veturat', icon: <Car className="w-5 h-5" />, prefix: true },
      { to: '/kompania/rezervimet', label: 'Rezervime', icon: <CalendarDays className="w-5 h-5" />, prefix: true },
      { to: '/kompania/cilesimet', label: 'Cilësimet', icon: <Settings className="w-5 h-5" />, prefix: true },
    ];
  }

  // Default: visitor + client
  if (isLoggedIn) {
    return [
      { to: '/', label: 'Ballina', icon: <Home className="w-5 h-5" /> },
      { to: '/automjetet', label: 'Veturat', icon: <Car className="w-5 h-5" />, prefix: true },
      { to: '/dashboard/rezervimet', label: 'Rezervime', icon: <CalendarDays className="w-5 h-5" />, prefix: true },
      { to: '/dashboard/profili', label: 'Profili', icon: <User className="w-5 h-5" />, prefix: true },
    ];
  }

  return [
    { to: '/', label: 'Ballina', icon: <Home className="w-5 h-5" /> },
    { to: '/automjetet', label: 'Veturat', icon: <Car className="w-5 h-5" />, prefix: true },
    { to: '/per-platformen', label: 'Rreth', icon: <Building2 className="w-5 h-5" /> },
    { to: '/login', label: 'Kycu', icon: <User className="w-5 h-5" /> },
  ];
}

export default function MobileBottomNav() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const tabs = getTabs(profile?.role, !!user);

  function isActive(tab: TabItem): boolean {
    if (tab.prefix) {
      return location.pathname === tab.to || location.pathname.startsWith(tab.to + '/');
    }
    return location.pathname === tab.to;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 grid grid-cols-4 safe-area-bottom"
      aria-label="Mobile navigation"
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
