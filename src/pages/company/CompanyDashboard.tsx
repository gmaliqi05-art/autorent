import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Car, CalendarDays, DollarSign, Eye, Clock, Star, Zap, Crown, Gem, AlertTriangle, CheckCircle, ArrowUpRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Vehicle, Booking, Company, SubscriptionPlan } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { companyNavItems } from '../../lib/companyNav';
import { formatDate, bookingStatusColors, bookingStatusLabel } from '../../lib/companyDashHelpers';

const PLAN_META: Record<string, { icon: React.ReactNode; gradient: string; badge: string }> = {
  'Free': { icon: <Star className="w-4 h-4" />, gradient: 'from-gray-500 to-gray-600', badge: 'bg-gray-100 text-gray-700' },
  'Standard': { icon: <Zap className="w-4 h-4" />, gradient: 'from-blue-500 to-blue-600', badge: 'bg-blue-100 text-blue-700' },
  'Premium': { icon: <Crown className="w-4 h-4" />, gradient: 'from-amber-500 to-orange-500', badge: 'bg-amber-100 text-amber-700' },
  'Super Premium': { icon: <Gem className="w-4 h-4" />, gradient: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-100 text-emerald-700' },
};

export default function CompanyDashboard() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [company, setCompany] = useState<Company | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    setLoadError(false);
    setLoading(true);
    const { data: comp, error } = await supabase.from('companies').select('*').eq('owner_id', user!.id).maybeSingle();
    if (error) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    if (comp) {
      setCompany(comp as Company);
      const [v, b, p] = await Promise.all([
        supabase.from('vehicles').select('*').eq('company_id', comp.id).is('deleted_at', null).order('created_at', { ascending: false }),
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

  const paidRevenue = bookings.filter(b => b.payment_status === 'paid').reduce((s, b) => s + Number(b.total_price), 0);
  const completedRevenue = bookings
    .filter(b => b.status === 'completed' && b.payment_status !== 'failed')
    .reduce((s, b) => s + Number(b.total_price), 0);
  const activeRevenue = bookings
    .filter(b => b.status === 'active' && b.payment_status !== 'failed')
    .reduce((s, b) => s + Number(b.total_price), 0);
  const totalRevenue = completedRevenue + activeRevenue;
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

  if (loading) {
    return (
      <DashboardLayout title={t('companyDash.overview.title')} navItems={companyNavItems}>
        <div className="flex items-center justify-center h-64">
          <div className="w-7 h-7 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (loadError) {
    return (
      <DashboardLayout title={t('companyDash.overview.title')} navItems={companyNavItems}>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-dark-600">{t('companyDash.common.loadError')}</p>
          <button onClick={loadData} className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700">
            {t('companyDash.common.tryAgain')}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!company) {
    return (
      <DashboardLayout title={t('companyDash.overview.title')} navItems={companyNavItems}>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
          <p className="text-sm text-dark-600">{t('companyDash.common.noCompany')}</p>
        </div>
      </DashboardLayout>
    );
  }

  const planMeta = plan ? (PLAN_META[plan.name] || PLAN_META['Free']) : PLAN_META['Free'];

  return (
    <DashboardLayout title={t('companyDash.overview.title')} navItems={companyNavItems}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark-950">{company.name || t('companyDash.overview.myCompany')}</h1>
          <p className="text-dark-500 mt-1 text-[15px]">{t('companyDash.overview.subtitle')}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
          company.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${company.status === 'approved' ? 'bg-green-500' : 'bg-yellow-500'}`} />
          {company.status === 'approved' ? t('companyDash.overview.statusActive') : t('companyDash.overview.statusPending')}
        </span>
      </div>

      {(isExpired || isExpiringSoon || isAtVehicleLimit) && (
        <div className={`mb-6 rounded-xl border p-4 flex items-start gap-3 ${isExpired || isAtVehicleLimit ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isExpired || isAtVehicleLimit ? 'text-red-500' : 'text-amber-500'}`} />
          <div className="flex-1">
            {isExpired && <p className="text-sm font-semibold text-red-800">{t('companyDash.overview.expired')}</p>}
            {isExpiringSoon && !isExpired && <p className="text-sm font-semibold text-amber-800">{t('companyDash.overview.expiringSoon', { days: daysUntilExpiry })}</p>}
            {isAtVehicleLimit && <p className="text-sm font-semibold text-red-800 mt-1">{t('companyDash.overview.atVehicleLimit', { limit: vehicleLimit })}</p>}
          </div>
          <Link to="/kompania/abonimi" className="shrink-0 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors">
            {t('companyDash.overview.upgrade')}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Car className="w-5 h-5 text-primary-600" />} bg="bg-primary-50" value={vehicles.length} label={t('companyDash.overview.vehicles')} />
        <StatCard icon={<Eye className="w-5 h-5 text-green-600" />} bg="bg-green-50" value={activeVehicles} label={t('companyDash.overview.published')} />
        <StatCard icon={<Clock className="w-5 h-5 text-yellow-600" />} bg="bg-yellow-50" value={pendingCount} label={t('companyDash.overview.pendingBookings')} />
        <StatCard icon={<DollarSign className="w-5 h-5 text-accent-600" />} bg="bg-accent-50" value={`${totalRevenue.toFixed(2)} EUR`} label={t('companyDash.overview.revenue')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Link to="/kompania/pagesat" className="block cursor-pointer">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 hover:shadow-lg hover:scale-[1.01] transition-all h-full">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{completedRevenue.toFixed(0)} EUR</p>
            <p className="text-sm text-white/80">{t('companyDash.overview.completedRevenue')}</p>
            <p className="text-xs text-white/70 mt-1">+ {activeRevenue.toFixed(0)} EUR {t('companyDash.overview.activeRevenueNote')}</p>
          </div>
        </Link>
        <Link to="/kompania/pagesat" className="block cursor-pointer">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 hover:shadow-lg hover:scale-[1.01] transition-all h-full">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{pendingPayments.toFixed(0)} EUR</p>
            <p className="text-sm text-white/80">{t('companyDash.overview.pendingPayments')}</p>
            <p className="text-xs text-white/70 mt-1">{t('companyDash.overview.paidRevenue')}: {paidRevenue.toFixed(0)} EUR</p>
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
              <p className="text-xs text-white/70 font-medium">{t('companyDash.overview.yourPlan')}</p>
              <p className="text-base font-bold">{plan?.name || 'Free'}</p>
            </div>
          </div>

          {vehicleLimit !== null ? (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-white/70">{t('companyDash.overview.vehicles')}</span>
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
              {t('companyDash.overview.vehiclesUnlimited')}
            </div>
          )}

          {company.subscription_expires_at && (
            <p className={`text-xs ${isExpiringSoon || isExpired ? 'text-red-200 font-semibold' : 'text-white/60'}`}>
              {isExpired ? t('companyDash.overview.expiresLabel') : `${t('companyDash.overview.expires')}: ${formatDate(company.subscription_expires_at, i18n.language)}`}
            </p>
          )}

          <Link to="/kompania/abonimi" className="mt-4 flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {t('companyDash.overview.changePlan')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-dark-950">{t('companyDash.overview.vehiclesPanel')} ({vehicles.length})</h2>
            {vehicleLimit !== null && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isAtVehicleLimit ? 'bg-red-100 text-red-600' : isNearVehicleLimit ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-dark-400'}`}>
                {vehicles.length}/{vehicleLimit}
              </span>
            )}
          </div>
          {vehicles.length === 0 ? (
            <EmptyState icon={<Car className="w-8 h-8 text-gray-300" />} text={t('companyDash.overview.noVehicles')} />
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
                      <p className="text-[11px] text-dark-400">{v.year} | {v.price_per_day} {t('companyDash.common.perDay')}</p>
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
            <h2 className="font-semibold text-dark-950">{t('companyDash.overview.bookingsPanel')} ({bookings.length})</h2>
          </div>
          {bookings.length === 0 ? (
            <EmptyState icon={<CalendarDays className="w-8 h-8 text-gray-300" />} text={t('companyDash.overview.noBookings')} />
          ) : (
            <div className="divide-y divide-gray-50">
              {bookings.slice(0, 5).map(b => (
                <div key={b.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-dark-900">{b.client_name || t('companyDash.common.clientFallback')}</p>
                    <p className="text-[11px] text-dark-400">
                      {formatDate(b.pickup_date, i18n.language)} - {b.total_days} {t('companyDash.common.days')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-dark-900">{Number(b.total_price).toFixed(0)} EUR</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${bookingStatusColors[b.status] || bookingStatusColors.pending}`}>
                      {bookingStatusLabel(b.status, t)}
                    </span>
                  </div>
                </div>
              ))}
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
