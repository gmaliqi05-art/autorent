import { Car, CalendarDays, TrendingUp, Settings, DollarSign, CreditCard } from 'lucide-react';

export const companyNavItems = [
  { labelKey: 'companyNav.overview', label: 'Pamja e pergjithshme', path: '/kompania', icon: <TrendingUp className="w-4 h-4" /> },
  { labelKey: 'companyNav.vehicles', label: 'Automjetet', path: '/kompania/automjetet', icon: <Car className="w-4 h-4" /> },
  { labelKey: 'companyNav.bookings', label: 'Rezervimet', path: '/kompania/rezervimet', icon: <CalendarDays className="w-4 h-4" /> },
  { labelKey: 'companyNav.payments', label: 'Pagesat', path: '/kompania/pagesat', icon: <DollarSign className="w-4 h-4" /> },
  { labelKey: 'companyNav.subscription', label: 'Abonimi', path: '/kompania/abonimi', icon: <CreditCard className="w-4 h-4" /> },
  { labelKey: 'companyNav.settings', label: 'Cilesimet', path: '/kompania/cilesimet', icon: <Settings className="w-4 h-4" /> },
];
