import { Car, CalendarDays, TrendingUp, Settings, DollarSign, CreditCard } from 'lucide-react';

export const companyNavItems = [
  { label: 'Pamja e pergjithshme', path: '/kompania', icon: <TrendingUp className="w-4 h-4" /> },
  { label: 'Automjetet', path: '/kompania/automjetet', icon: <Car className="w-4 h-4" /> },
  { label: 'Rezervimet', path: '/kompania/rezervimet', icon: <CalendarDays className="w-4 h-4" /> },
  { label: 'Pagesat', path: '/kompania/pagesat', icon: <DollarSign className="w-4 h-4" /> },
  { label: 'Abonimi', path: '/kompania/abonimi', icon: <CreditCard className="w-4 h-4" /> },
  { label: 'Cilesimet', path: '/kompania/cilesimet', icon: <Settings className="w-4 h-4" /> },
];
