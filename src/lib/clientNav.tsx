import { LayoutDashboard, CalendarDays, CreditCard, CircleUser as UserCircle } from 'lucide-react';

export const clientNavItems = [
  { labelKey: 'clientNav.overview', label: 'Pamja e pergjithshme', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { labelKey: 'clientNav.bookings', label: 'Rezervimet', path: '/dashboard/rezervimet', icon: <CalendarDays className="w-4 h-4" /> },
  { labelKey: 'clientNav.payments', label: 'Pagesat', path: '/dashboard/pagesat', icon: <CreditCard className="w-4 h-4" /> },
  { labelKey: 'clientNav.profile', label: 'Profili', path: '/dashboard/profili', icon: <UserCircle className="w-4 h-4" /> },
];
