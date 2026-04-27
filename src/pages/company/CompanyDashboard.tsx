import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, CalendarDays, DollarSign, Eye, Clock, Star, Zap, Crown, Gem, AlertTriangle, CheckCircle, ArrowUpRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Vehicle, Booking, Company, SubscriptionPlan } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { companyNavItems } from '../../lib/companyNav';

const PLAN_META: Record<string, { icon: React.ReactNode; gradient: string; badge: string }> = {
  'Free': { icon: <Star className="w-4 h-4" />, gradient: 'from-gray-500 to-gray-600', badge: 'bg-gray-100 text-gray-700' },
  'Standard': { icon: <Zap className="w-4 h-4" />, gradient: 'from-blue-500 to-blue-600', badge: 'bg-blue-100 text-blue-700' },
  'Premium': { icon: <Crown className="w-4 h-4" />, gradient: 'from-amber-500 to-orange-500', badge: 'bg-amber-100 text-amber-700' },
  'Super Premium': { icon: <Gem className="w-4 h-4" />, gradient: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-100 text-emerald-700' },
};

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    const { data: comp } = await supabase.from('companies').select('*').eq('owner_id', user!.id).maybeSingle();
    if (comp) {
      setCompany(comp as Company);
      const [v, b, p] = await Promise.all([
        supabase.from('vehicles').select('*').eq('company_id', comp.id).order('created_at', { ascending: false }),
        supabase.from('bookings').select('*').eq('company_id', comp.id).order('created_at', { ascending: false }).limit(20),
        comp.subscription_plan_id
          ? supabase.from('subscription_plans').select('*').eq('id', comp.subscription_plan_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      setVehicles((v.data || []) as Vehicle[]);
      setBookings((b.data || []) as Booking[]);
      setPlan((p.data || null) as SubscriptionPlan | null);
    }
    setLoading(false);
  }

  const revenue = bookings.filter(b => b.status === 'completed' || b.status === 'active').reduce((s, b) => s + Number(b.total_price), 0);
  const paidRevenue = bookings.filter(b => b.payment_status === 'paid').reduce((s, b) => s + Number(b.total_price), 0);
  const pendingPayments = bookings.filter(b => b.payment_status === 'pending').reduce((s, b) => s + Number(b.total_price), 0);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const activeVehicles = vehicles.filter(v => v.is_published && v.is_available).length;

  const maxVehicles = plan?.max_vehicles ?? 3;
  const vehicleLimit = maxVehicles === -1 ? null : maxVehicles;
  const vehicleUsagePercent = vehicleLimit ? Math.min(100, (vehicles.length / vehicleLimit) * 100) : 0;
  const isAtVehicleLimit = vehicleLimit !== null && vehicles.length >= vehicleLimit;
  const isNearVehicleLimit = vehicleLimit !== null && vehicles.length >= vehicleLimit * 0.8;

  const daysUntilExpiry = company?.subscription_expires_at
    ? Math.ceil((new Date(company.subscription_expires_at).getTime() - Date.now()) / 86400000)
    : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'Ne pritje', color: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Konfirmuar', color: 'bg-blue-100 text-blue-700' },
    active: { label: 'Aktiv', color: 'bg-green-100 text-green-700' },
    completed: { label: 'Perfunduar', color: 'bg-gray-100 text-gray-600' },
    cancelled: { label: 'Anuluar', color: 'bg-red-100 text-red-700' },
  };

  if (loading) {
    return (
      <DashboardLayout title="Paneli i kompanise" navItems={companyNavItems}>
        <div className="flex items-center justify-center h-64">
          <div className="w-7 h-7 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const planMeta = plan ? (PLAN_META[plan.name] || PLAN_META['Free']) : PLAN_META['Free'];

  return (
    <DashboardLayout title="Paneli i kompanise" navItems={companyNavItems}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark-950">{company?.name || 'Kompania ime'}</h1>
          <p className="text-dark-500 mt-1 text-[15px]">Menaxhoni automjetet, rezervimet dhe statistikat.</p>
        </div>
        {company && (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            company.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${company.status === 'approved' ? 'bg-green-500' : 'bg-yellow-500'}`} />
            {company.status === 'approved' ? 'Aktive' : 'Ne pritje'}
          </span>
        )}
      </div>

      {(isExpired || isExpiringSoon || isAtVehicleLimit) && (
        <div className={`mb-6 rounded-xl border p-4 flex items-start gap-3 ${isExpired || isAtVehicleLimit ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isExpired || isAtVehicleLimit ? 'text-red-500' : 'text-amber-500'}`} />
          <div className="flex-1">
            {isExpired && <p className="text-sm font-semibold text-red-800">Abonimi juaj ka skaduar. Rinovojeni per te vazhduar sherbimin.</p>}
            {isExpiringSoon && !isExpired && <p className="text-sm font-semibold text-amber-800">Abonimi skadon per {daysUntilExpiry} dite. Rinovojeni tani.</p>}
            {isAtVehicleLimit && <p className="text-sm font-semibold text-red-800 mt-1">Keni arritur limitin e automjeteve per planin tuaj ({vehicleLimit} automjete). Kaloni ne nje plan me te larte.</p>}
          </div>
          <Link to="/kompania/cilesimet" className="shrink-0 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors">
            Upgrade
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Car className="w-5 h-5 text-primary-600" />} bg="bg-primary-50" value={vehicles.length} label="Automjete" />
        <StatCard icon={<Eye className="w-5 h-5 text-green-600" />} bg="bg-green-50" value={activeVehicles} label="Publikuara" />
        <StatCard icon={<Clock className="w-5 h-5 text-yellow-600" />} bg="bg-yellow-50" value={pendingCount} label="Ne pritje" />
        <StatCard icon={<DollarSign className="w-5 h-5 text-accent-600" />} bg="bg-accent-50" value={`${revenue}E`} label="Te ardhura" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Link to="/kompania/pagesat" className="block">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 hover:shadow-lg transition-shadow h-full">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{paidRevenue.toFixed(0)} EUR</p>
            <p className="text-sm text-white/80">Te ardhurat e paguara</p>
          </div>
        </Link>
        <Link to="/kompania/pagesat" className="block">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 hover:shadow-lg transition-shadow h-full">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{pendingPayments.toFixed(0)} EUR</p>
            <p className="text-sm text-white/80">Ne pritje per pagese</p>
          </div>
        </Link>

        <div className={`bg-gradient-to-br ${planMeta.gradient} rounded-2xl p-6 text-white relative overflow-hidden`}>
          <div className="absolute top-3 right-3 opacity-20 text-white scale-[3] origin-top-right">
            {planMeta.icon}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              {planMeta.icon}
            </div>
            <div>
              <p className="text-xs text-white/70 font-medium">Plani juaj</p>
              <p className="text-base font-bold">{plan?.name || 'Free'}</p>
            </div>
          </div>

          {vehicleLimit !== null ? (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-white/70">Automjete</span>
                <span className="font-semibold">{vehicles.length} / {vehicleLimit}</span>
              </div>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${vehicleUsagePercent >= 100 ? 'bg-red-300' : vehicleUsagePercent >= 80 ? 'bg-amber-300' : 'bg-white/70'}`}
                  style={{ width: `${vehicleUsagePercent}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mb-3 flex items-center gap-1.5 text-xs text-white/70">
              <CheckCircle className="w-3.5 h-3.5 text-green-300" />
              Automjete pa limit
            </div>
          )}

          {company?.subscription_expires_at && (
            <p className={`text-xs ${isExpiringSoon || isExpired ? 'text-red-200 font-semibold' : 'text-white/60'}`}>
              {isExpired ? 'Skaduar' : `Skadon: ${new Date(company.subscription_expires_at).toLocaleDateString('sq-AL')}`}
            </p>
          )}

          <Link to="/kompania/cilesimet" className="mt-4 flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Ndrysho planin
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-dark-950">Automjetet ({vehicles.length})</h2>
            {vehicleLimit !== null && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isAtVehicleLimit ? 'bg-red-100 text-red-600' : isNearVehicleLimit ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-dark-400'}`}>
                {vehicles.length}/{vehicleLimit}
              </span>
            )}
          </div>
          {vehicles.length === 0 ? (
            <EmptyState icon={<Car className="w-8 h-8 text-gray-300" />} text="Nuk keni automjete" />
          ) : (
            <div className="divide-y divide-gray-50">
              {vehicles.slice(0, 5).map(v => (
                <div key={v.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      {v.main_image_url ? <img src={v.main_image_url} alt="" className="w-10 h-10 object-cover" /> : <Car className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-900">{v.brand} {v.model}</p>
                      <p className="text-[11px] text-dark-400">{v.year} | {v.price_per_day}EUR/dite</p>
                    </div>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${v.is_available && v.is_published ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-dark-950">Rezervimet ({bookings.length})</h2>
          </div>
          {bookings.length === 0 ? (
            <EmptyState icon={<CalendarDays className="w-8 h-8 text-gray-300" />} text="Nuk ka rezervime" />
          ) : (
            <div className="divide-y divide-gray-50">
              {bookings.slice(0, 5).map(b => {
                const s = statusLabels[b.status] || statusLabels.pending;
                return (
                  <div key={b.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-dark-900">{b.client_name || 'Klient'}</p>
                      <p className="text-[11px] text-dark-400">
                        {new Date(b.pickup_date).toLocaleDateString('sq-AL')} - {b.total_days} dite
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-dark-900">{b.total_price}E</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.color}`}>{s.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, bg, value, label }: { icon: React.ReactNode; bg: string; value: string | number; label: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>{icon}</div>
        <div>
          <p className="text-xl font-bold text-dark-950">{value}</p>
          <p className="text-xs text-dark-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto mb-2">{icon}</div>
      <p className="text-sm text-dark-500">{text}</p>
    </div>
  );
}
