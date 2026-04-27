import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, LogOut, Menu, X, ChevronRight, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { NavGroup } from '../../lib/adminNav';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';


interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  navItems: NavItem[];
  navGroups?: NavGroup[];
}

export default function DashboardLayout({ children, title, navItems, navGroups }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  function translateLabel(label: string): string {
    const map: Record<string, string> = {
      'Pamja e pergjithshme': t('dashboard.overview'),
      'Rezervimet': t('dashboard.myBookings'),
      'Pagesat': t('dashboard.payments'),
      'Njoftimet': t('dashboard.notifications'),
      'Profili': t('dashboard.profile'),
      'Automjetet': t('dashboard.vehicles'),
      'Vleresimet': t('dashboard.reviews'),
      'Abonimi': t('dashboard.subscription'),
      'Cilesimet': t('dashboard.settings'),
    };
    return map[label] || label;
  }
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  function toggleGroup(label: string) {
    setCollapsedGroups(g => ({ ...g, [label]: !g[label] }));
  }

  const renderNavItem = (item: NavItem) => {
    const active = location.pathname === item.path;
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
          active
            ? 'bg-primary-50 text-primary-700 shadow-sm shadow-primary-100/50'
            : 'text-dark-500 hover:bg-gray-50 hover:text-dark-800'
        }`}
      >
        <span className={active ? 'text-primary-600' : 'text-dark-400'}>{item.icon}</span>
        {translateLabel(item.label)}
      </Link>
    );
  };

  const resolvedGroups: NavGroup[] | null = navGroups || null;

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200/80 transform transition-transform duration-200 ease-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary-600">
                <Car className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-dark-950">RentaKar</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
            {resolvedGroups ? (
              resolvedGroups.map((group) => {
                const collapsed = collapsedGroups[group.label];
                const hasActive = group.items.some(i => i.path === location.pathname);
                return (
                  <div key={group.label} className="mb-1">
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] hover:text-gray-600 transition-colors"
                    >
                      {group.label}
                      <ChevronDown className={`w-3 h-3 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
                    </button>
                    {!collapsed && (
                      <div className="space-y-0.5">
                        {group.items.map(renderNavItem)}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <>
                <div className="px-3 pb-2">
                  <p className="text-[10px] font-semibold text-dark-400 uppercase tracking-[0.12em]">{title}</p>
                </div>
                <div className="space-y-0.5">
                  {navItems.map(renderNavItem)}
                </div>
              </>
            )}
          </nav>

          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark-900 truncate">{profile?.full_name}</p>
                <p className="text-[11px] text-gray-500 truncate">{profile?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-dark-950/20 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 h-14 bg-white/80 backdrop-blur-xl border-b border-gray-100/80 flex items-center px-4 sm:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-3 p-1 text-gray-500 hover:text-gray-700 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <Link to="/" className="hover:text-dark-700 transition-colors">{t('nav.home')}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="font-medium text-dark-800">{title}</span>
          </div>
          <div className="ml-auto">
            <LanguageSwitcher variant="navbar" />
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
