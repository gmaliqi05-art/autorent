import { LayoutDashboard, CalendarDays, CreditCard, CircleUser as UserCircle } from 'lucide-react';

export const clientNavItems = [
  { label: 'Pamja e pergjithshme', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Rezervimet', path: '/dashboard/rezervimet', icon: <CalendarDays className="w-4 h-4" /> },
  { label: 'Pagesat', path: '/dashboard/pagesat', icon: <CreditCard className="w-4 h-4" /> },
  { label: 'Profili', path: '/dashboard/profili', icon: <UserCircle className="w-4 h-4" /> },
];
