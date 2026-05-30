import { useState, useEffect } from 'react';
import { DollarSign, Building2, CalendarDays, CreditCard, ArrowUpRight, Building, Car, Users, TrendingUp, MapPin, Award, Target, Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { Booking, Company, SubscriptionPlan, Vehicle, Profile, City, Invoice } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';

const paymentMethodColors: Record<string, string> = {
  stripe: 'bg-blue-500',
  paypal: 'bg-yellow-500',
  bank_transfer: 'bg-green-500',
  cash: 'bg-gray-500',
};

const paymentMethodTranslationKeys: Record<string, string> = {
  stripe: 'pmStripe',
  paypal: 'pmPaypal',
  bank_transfer: 'pmBankTransfer',
  cash: 'pmCash',
};

type Period = 'week' | 'month' | 'year' | 'all';

export default function AdminFinancials() {
  const { t, i18n } = useTranslation();
  const localeForDate = i18n.language === 'en' ? 'en-US' : i18n.language === 'de' ? 'de-DE' : 'sq-AL';
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [bRes, cRes, pRes, vRes, profRes, citRes, invRes] = await Promise.all([
      supabase.from('bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('companies').select('*'),
      supabase.from('subscription_plans').select('*'),
      supabase.from('vehicles').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('cities').select('*'),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
    ]);
    setBookings((bRes.data || []) as Booking[]);
    setCompanies((cRes.data || []) as Company[]);
    setPlans((pRes.data || []) as SubscriptionPlan[]);
    setVehicles((vRes.data || []) as Vehicle[]);
    setProfiles((profRes.data || []) as Profile[]);
    setCities((citRes.data || []) as City[]);
    setInvoices((invRes.data || []) as Invoice[]);
    setLoading(false);
  }

  function getFilteredBookings() {
    if (period === 'all') return bookings;
    const now = new Date();
    const cutoff = new Date();
    if (period === 'week') cutoff.setDate(now.getDate() - 7);
    else if (period === 'month') cutoff.setMonth(now.getMonth() - 1);
    else if (period === 'year') cutoff.setFullYear(now.getFullYear() - 1);
    return bookings.filter(b => new Date(b.created_at) >= cutoff);
  }

  const filtered = getFilteredBookings();
  const totalRevenue = filtered.filter(b => b.status === 'completed' || b.status === 'active').reduce((s, b) => s + Number(b.total_price), 0);
  const totalBookings = filtered.length;
  const completedBookings = filtered.filter(b => b.status === 'completed').length;
  const cancelledBookings = filtered.filter(b => b.status === 'cancelled').length;
  const pendingBookings = filtered.filter(b => b.status === 'pending').length;
  const avgBookingValue = totalBookings > 0 ? totalRevenue / Math.max(completedBookings + filtered.filter(b => b.status === 'active').length, 1) : 0;

  const activeCompanies = companies.filter(c => c.subscription_status === 'active');
  const subscriptionRevenue = activeCompanies.reduce((s, c) => {
    const plan = plans.find(p => p.id === c.subscription_plan_id);
    return s + (plan ? Number(plan.price_monthly) : 0);
  }, 0);

  const companyRevenues = companies.map(c => {
    const compBookings = filtered.filter(b => b.company_id === c.id && (b.status === 'completed' || b.status === 'active'));
    return { company: c, revenue: compBookings.reduce((s, b) => s + Number(b.total_price), 0), count: compBookings.length };
  }).sort((a, b) => b.revenue - a.revenue);

  const statusDistribution = [
    { label: t('adminDash.financials.statusCompleted'), count: completedBookings, color: 'bg-green-500' },
    { label: t('adminDash.financials.statusActive'), count: filtered.filter(b => b.status === 'active').length, color: 'bg-blue-500' },
    { label: t('adminDash.financials.statusConfirmed'), count: filtered.filter(b => b.status === 'confirmed').length, color: 'bg-teal-500' },
    { label: t('adminDash.financials.statusPending'), count: pendingBookings, color: 'bg-amber-500' },
    { label: t('adminDash.financials.statusCancelled'), count: cancelledBookings, color: 'bg-red-500' },
  ];
  const maxStatus = Math.max(...statusDistribution.map(s => s.count), 1);

  const paymentMethodStats = Object.keys(paymentMethodColors).map(method => {
    const bookingsWithMethod = filtered.filter(b => b.payment_method === method);
    return {
      method,
      count: bookingsWithMethod.length,
      total: bookingsWithMethod.reduce((s, b) => s + Number(b.total_price), 0),
    };
  }).filter(s => s.count > 0);

  const paidBookings = filtered.filter(b => b.payment_status === 'paid');
  const pendingPayments = filtered.filter(b => b.payment_status === 'pending');
  const failedPayments = filtered.filter(b => b.payment_status === 'failed');

  const paidAmount = paidBookings.reduce((s, b) => s + Number(b.total_price), 0);
  const pendingAmount = pendingPayments.reduce((s, b) => s + Number(b.total_price), 0);
  const failedAmount = failedPayments.reduce((s, b) => s + Number(b.total_price), 0);

  // Top Vehicles Report
  const vehicleStats = vehicles.map(v => {
    const vBookings = filtered.filter(b => b.vehicle_id === v.id && (b.status === 'completed' || b.status === 'active'));
    return {
      vehicle: v,
      bookings: vBookings.length,
      revenue: vBookings.reduce((s, b) => s + Number(b.total_price), 0),
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Category Performance Report
  const categoryTranslationKeys: Record<string, string> = {
    ekonomike: 'catEkonomike',
    kompakte: 'catKompakte',
    sedan: 'catSedan',
    suv: 'catSuv',
    luksoz: 'catLuksoz',
    minivan: 'catMinivan',
    furgon: 'catFurgon',
  };
  const categoryColors: Record<string, string> = {
    ekonomike: 'bg-blue-500',
    kompakte: 'bg-teal-500',
    sedan: 'bg-green-500',
    suv: 'bg-amber-500',
    luksoz: 'bg-purple-500',
    minivan: 'bg-pink-500',
    furgon: 'bg-orange-500',
  };
  const categoryStats = Object.keys(categoryTranslationKeys).map(cat => {
    const catVehicles = vehicles.filter(v => v.category === cat);
    const catBookings = filtered.filter(b => catVehicles.some(v => v.id === b.vehicle_id));
    return {
      category: cat,
      label: t(`adminDash.financials.${categoryTranslationKeys[cat]}`),
      color: categoryColors[cat],
      count: catBookings.length,
      revenue: catBookings.reduce((s, b) => s + Number(b.total_price), 0),
    };
  }).filter(s => s.count > 0).sort((a, b) => b.count - a.count);
  const maxCategoryCount = Math.max(...categoryStats.map(s => s.count), 1);

  // Top Clients Report
  const clientStats = profiles.filter(p => p.role === 'client').map(client => {
    const clientBookings = filtered.filter(b => b.client_id === client.id);
    return {
      client,
      bookings: clientBookings.length,
      spent: clientBookings.reduce((s, b) => s + Number(b.total_price), 0),
    };
  }).filter(s => s.bookings > 0).sort((a, b) => b.spent - a.spent);

  // Geographic Distribution Report
  const cityStats = cities.map(city => {
    const cityCompanies = companies.filter(c => c.city_id === city.id);
    const cityBookings = filtered.filter(b => cityCompanies.some(c => c.id === b.company_id));
    return {
      city,
      bookings: cityBookings.length,
      revenue: cityBookings.reduce((s, b) => s + Number(b.total_price), 0),
    };
  }).filter(s => s.bookings > 0).sort((a, b) => b.bookings - a.bookings);
  const maxCityBookings = Math.max(...cityStats.map(s => s.bookings), 1);

  // KPIs Calculation
  const cancelRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
  const successRate = totalBookings > 0 ? ((completedBookings + filtered.filter(b => b.status === 'active').length) / totalBookings) * 100 : 0;
  const conversionRate = totalBookings > 0 ? ((completedBookings + filtered.filter(b => b.status === 'active').length + filtered.filter(b => b.status === 'confirmed').length) / totalBookings) * 100 : 0;

  // Growth calculation (compare with previous period)
  const getPreviousPeriodBookings = () => {
    if (period === 'all') return [];
    const now = new Date();
    const cutoffEnd = new Date();
    const cutoffStart = new Date();
    if (period === 'week') {
      cutoffEnd.setDate(now.getDate() - 7);
      cutoffStart.setDate(now.getDate() - 14);
    } else if (period === 'month') {
      cutoffEnd.setMonth(now.getMonth() - 1);
      cutoffStart.setMonth(now.getMonth() - 2);
    } else if (period === 'year') {
      cutoffEnd.setFullYear(now.getFullYear() - 1);
      cutoffStart.setFullYear(now.getFullYear() - 2);
    }
    return bookings.filter(b => {
      const d = new Date(b.created_at);
      return d >= cutoffStart && d < cutoffEnd;
    });
  };
  const previousPeriodBookings = getPreviousPeriodBookings();
  const previousRevenue = previousPeriodBookings.filter(b => b.status === 'completed' || b.status === 'active').reduce((s, b) => s + Number(b.total_price), 0);
  const growthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  if (loading) {
    return (
      <DashboardLayout title="Admin" navItems={adminNavItems} navGroups={adminNavGroups}>
        <div className="flex items-center justify-center h-64">
          <div className="w-7 h-7 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin" navItems={adminNavItems} navGroups={adminNavGroups}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark-950">{t('adminDash.financials.title')}</h1>
          <p className="text-dark-500 mt-1 text-[15px]">{t('adminDash.financials.subtitle')}</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1">
          {([
            ['week', t('adminDash.financials.periodWeek')],
            ['month', t('adminDash.financials.periodMonth')],
            ['year', t('adminDash.financials.periodYear')],
            ['all', t('adminDash.financials.periodAll')],
          ] as [Period, string][]).map(([v, l]) => (
            <button key={v} onClick={() => setPeriod(v)} className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${period === v ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-400 hover:text-dark-600'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<DollarSign className="w-5 h-5 text-green-600" />} bg="bg-green-50" value={`${totalRevenue.toFixed(0)} EUR`} label={t('adminDash.financials.bookingRevenue')} trend={<ArrowUpRight className="w-3.5 h-3.5 text-green-500" />} />
        <StatCard icon={<CreditCard className="w-5 h-5 text-primary-600" />} bg="bg-primary-50" value={t('adminDash.financials.revenuePerMonth', { value: subscriptionRevenue.toFixed(0) })} label={t('adminDash.financials.subscriptionRevenue')} trend={<ArrowUpRight className="w-3.5 h-3.5 text-green-500" />} />
        <StatCard icon={<CalendarDays className="w-5 h-5 text-blue-600" />} bg="bg-blue-50" value={totalBookings.toString()} label={t('adminDash.financials.totalBookings')} />
        <StatCard icon={<Building2 className="w-5 h-5 text-amber-600" />} bg="bg-amber-50" value={`${avgBookingValue.toFixed(0)} EUR`} label={t('adminDash.financials.avgBookingValue')} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Target className="w-5 h-5 text-green-600" />} bg="bg-green-50" value={`${successRate.toFixed(1)}%`} label={t('adminDash.financials.successRate')} trend={successRate >= 80 ? <ArrowUpRight className="w-3.5 h-3.5 text-green-500" /> : undefined} />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-blue-600" />} bg="bg-blue-50" value={`${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}%`} label={t('adminDash.financials.revenueGrowth')} trend={growthRate > 0 ? <ArrowUpRight className="w-3.5 h-3.5 text-green-500" /> : undefined} />
        <StatCard icon={<Award className="w-5 h-5 text-purple-600" />} bg="bg-purple-50" value={`${conversionRate.toFixed(1)}%`} label={t('adminDash.financials.conversionRate')} />
        <StatCard icon={<Users className="w-5 h-5 text-orange-600" />} bg="bg-orange-50" value={`${cancelRate.toFixed(1)}%`} label={t('adminDash.financials.cancelRate')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-dark-950 mb-5">{t('adminDash.financials.bookingDistribution')}</h2>
          <div className="space-y-3">
            {statusDistribution.map(s => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-dark-600">{s.label}</span>
                  <span className="text-xs font-bold text-dark-900">{s.count}</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all duration-700`} style={{ width: `${(s.count / maxStatus) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-dark-950 mb-5">{t('adminDash.financials.activeSubscriptions')}</h2>
          <div className="space-y-3 mb-5">
            {plans.map(plan => {
              const count = companies.filter(c => c.subscription_plan_id === plan.id && c.subscription_status === 'active').length;
              return (
                <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-dark-900">{plan.name}</p>
                    <p className="text-xs text-dark-400">{t('adminDash.financials.planPricePerMonth', { price: plan.price_monthly })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-dark-950">{count}</p>
                    <p className="text-[10px] text-dark-400">{t('adminDash.financials.companiesLabel')}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-dark-600">{t('adminDash.financials.totalMonthlyRevenue')}</span>
            <span className="text-lg font-bold text-green-600">{subscriptionRevenue.toFixed(2)} EUR</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-dark-950 mb-5">{t('adminDash.financials.paymentMethods')}</h2>
          {paymentMethodStats.length === 0 ? (
            <p className="text-sm text-dark-400 text-center py-8">{t('adminDash.financials.noPaymentsForPeriod')}</p>
          ) : (
            <div className="space-y-4">
              {paymentMethodStats.map(stat => {
                const color = paymentMethodColors[stat.method];
                const label = t(`adminDash.financials.${paymentMethodTranslationKeys[stat.method] || 'pmStripe'}`);
                const maxCount = Math.max(...paymentMethodStats.map(s => s.count), 1);
                return (
                  <div key={stat.method}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-dark-900">{label}</span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-dark-950">{t('adminDash.financials.paymentsCount', { count: stat.count })}</p>
                        <p className="text-xs text-dark-400">{stat.total.toFixed(0)} EUR</p>
                      </div>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-700`}
                        style={{ width: `${(stat.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-dark-950 mb-5">{t('adminDash.financials.paymentStatus')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-green-900">{t('adminDash.financials.psPaid')}</p>
                <p className="text-xs text-green-600 mt-0.5">{t('adminDash.financials.bookingsCount', { count: paidBookings.length })}</p>
              </div>
              <p className="text-xl font-bold text-green-700">{paidAmount.toFixed(0)} EUR</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-amber-900">{t('adminDash.financials.psPending')}</p>
                <p className="text-xs text-amber-600 mt-0.5">{t('adminDash.financials.bookingsCount', { count: pendingPayments.length })}</p>
              </div>
              <p className="text-xl font-bold text-amber-700">{pendingAmount.toFixed(0)} EUR</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-red-900">{t('adminDash.financials.psFailed')}</p>
                <p className="text-xs text-red-600 mt-0.5">{t('adminDash.financials.bookingsCount', { count: failedPayments.length })}</p>
              </div>
              <p className="text-xl font-bold text-red-700">{failedAmount.toFixed(0)} EUR</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Car className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-dark-950">{t('adminDash.financials.topVehicles')}</h2>
          </div>
          {vehicleStats.length === 0 ? (
            <p className="text-sm text-dark-400 text-center py-8">{t('adminDash.financials.noDataForPeriod')}</p>
          ) : (
            <div className="space-y-3">
              {vehicleStats.slice(0, 10).map((stat, idx) => (
                <div key={stat.vehicle.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark-900 truncate">{stat.vehicle.brand} {stat.vehicle.model}</p>
                    <p className="text-xs text-dark-400">{t('adminDash.financials.bookingsCount', { count: stat.bookings })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{stat.revenue.toFixed(0)} EUR</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-dark-950">{t('adminDash.financials.categoryPerformance')}</h2>
          </div>
          {categoryStats.length === 0 ? (
            <p className="text-sm text-dark-400 text-center py-8">{t('adminDash.financials.noDataForPeriod')}</p>
          ) : (
            <div className="space-y-3">
              {categoryStats.map(stat => (
                <div key={stat.category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-dark-900">{stat.label}</span>
                    <div className="text-right">
                      <p className="text-xs font-bold text-dark-900">{t('adminDash.financials.bookingsCount', { count: stat.count })}</p>
                      <p className="text-[10px] text-dark-400">{stat.revenue.toFixed(0)} EUR</p>
                    </div>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stat.color} rounded-full transition-all duration-700`}
                      style={{ width: `${(stat.count / maxCategoryCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-dark-950">{t('adminDash.financials.topClients')}</h2>
          </div>
          {clientStats.length === 0 ? (
            <p className="text-sm text-dark-400 text-center py-8">{t('adminDash.financials.noDataForPeriod')}</p>
          ) : (
            <div className="space-y-3">
              {clientStats.slice(0, 10).map((stat, idx) => (
                <div key={stat.client.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark-900 truncate">{stat.client.full_name || stat.client.email}</p>
                    <p className="text-xs text-dark-400">{t('adminDash.financials.bookingsCount', { count: stat.bookings })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-dark-950">{stat.spent.toFixed(0)} EUR</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="w-5 h-5 text-red-600" />
            <h2 className="font-semibold text-dark-950">{t('adminDash.financials.geoDistribution')}</h2>
          </div>
          {cityStats.length === 0 ? (
            <p className="text-sm text-dark-400 text-center py-8">{t('adminDash.financials.noDataForPeriod')}</p>
          ) : (
            <div className="space-y-3">
              {cityStats.slice(0, 10).map(stat => (
                <div key={stat.city.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-dark-900">{stat.city.name}</span>
                    <div className="text-right">
                      <p className="text-xs font-bold text-dark-900">{t('adminDash.financials.bookingsCount', { count: stat.bookings })}</p>
                      <p className="text-[10px] text-dark-400">{stat.revenue.toFixed(0)} EUR</p>
                    </div>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-700"
                      style={{ width: `${(stat.bookings / maxCityBookings) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary-600" />
          <h2 className="font-semibold text-dark-950">{t('adminDash.financials.invoicesReport')}</h2>
        </div>
        <div className="p-6">
          {(() => {
            const filteredInvoices = period === 'all' ? invoices : invoices.filter(inv => {
              const now = new Date();
              const cutoff = new Date();
              if (period === 'week') cutoff.setDate(now.getDate() - 7);
              else if (period === 'month') cutoff.setMonth(now.getMonth() - 1);
              else if (period === 'year') cutoff.setFullYear(now.getFullYear() - 1);
              return new Date(inv.created_at) >= cutoff;
            });
            const totalInvoices = filteredInvoices.length;
            const issuedInvoices = filteredInvoices.filter(i => i.status === 'issued');
            const paidInvoices = filteredInvoices.filter(i => i.status === 'paid');
            const draftInvoices = filteredInvoices.filter(i => i.status === 'draft');
            const paidTotal = paidInvoices.reduce((s, i) => s + Number(i.total_price), 0);
            const issuedTotal = issuedInvoices.reduce((s, i) => s + Number(i.total_price), 0);
            const draftTotal = draftInvoices.reduce((s, i) => s + Number(i.total_price), 0);

            return (
              <div className="space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-dark-950">{totalInvoices}</p>
                    <p className="text-xs text-dark-400">{t('adminDash.financials.totalInvoices')}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-green-700">{paidTotal.toFixed(0)} EUR</p>
                    <p className="text-xs text-green-600">{t('adminDash.financials.paidInvoicesLabel', { count: paidInvoices.length })}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-blue-700">{issuedTotal.toFixed(0)} EUR</p>
                    <p className="text-xs text-blue-600">{t('adminDash.financials.issuedInvoicesLabel', { count: issuedInvoices.length })}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-dark-700">{draftTotal.toFixed(0)} EUR</p>
                    <p className="text-xs text-dark-400">{t('adminDash.financials.draftInvoicesLabel', { count: draftInvoices.length })}</p>
                  </div>
                </div>

                {filteredInvoices.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.financials.colInvoiceNumber')}</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.financials.colClient')}</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.financials.colCompany')}</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.financials.colInvoiceStatus')}</th>
                          <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.financials.colAmount')}</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.financials.colDate')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredInvoices.slice(0, 10).map(inv => {
                          const invStatusColors: Record<string, string> = {
                            draft: 'bg-gray-100 text-gray-600',
                            issued: 'bg-blue-100 text-blue-700',
                            paid: 'bg-green-100 text-green-700',
                            cancelled: 'bg-red-100 text-red-700',
                          };
                          const invStatusKeys: Record<string, string> = {
                            draft: 'invStatusDraft',
                            issued: 'invStatusIssued',
                            paid: 'invStatusPaid',
                            cancelled: 'invStatusCancelled',
                          };
                          const statusLabel = invStatusKeys[inv.status] ? t(`adminDash.financials.${invStatusKeys[inv.status]}`) : inv.status;
                          return (
                            <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3 text-sm font-mono text-primary-600 font-medium">{inv.invoice_number}</td>
                              <td className="px-4 py-3 text-sm text-dark-900">{inv.client_name}</td>
                              <td className="px-4 py-3 text-sm text-dark-500">{inv.company_name}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${invStatusColors[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                                  {statusLabel}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-dark-950">{inv.total_price} EUR</td>
                              <td className="px-4 py-3 text-sm text-dark-500">{new Date(inv.created_at).toLocaleDateString(localeForDate)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-dark-950">{t('adminDash.financials.revenueByCompany')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.financials.colCompany')}</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.financials.colBookings')}</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.financials.colRevenue')}</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.financials.colPlan')}</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.financials.colStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {companyRevenues.slice(0, 15).map(({ company, revenue, count }, idx) => {
                const plan = plans.find(p => p.id === company.subscription_plan_id);
                const isTopRevenue = idx === 0 && revenue > 0;
                const isTopBookings = companyRevenues.findIndex(c => c.count === Math.max(...companyRevenues.map(cr => cr.count))) === idx && count > 0;
                return (
                  <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                          {company.logo_url ? <img src={company.logo_url} alt="" className="w-8 h-8 object-cover" loading="lazy" /> : <Building2 className="w-3.5 h-3.5 text-gray-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-dark-900">{company.name}</p>
                          <p className="text-[11px] text-dark-400">{company.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-dark-700">{count}</td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-dark-950">{revenue.toFixed(0)} EUR</td>
                    <td className="px-6 py-3 text-right">
                      <span className="inline-flex px-2 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-bold rounded">{plan?.name || '-'}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isTopRevenue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded">
                            <Award className="w-3 h-3" />
                            {t('adminDash.financials.badgeTop')}
                          </span>
                        )}
                        {isTopBookings && !isTopRevenue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">
                            <TrendingUp className="w-3 h-3" />
                            {t('adminDash.financials.badgeActive')}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {companyRevenues.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-dark-400">{t('adminDash.financials.noDataForPeriod')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, bg, value, label, trend }: { icon: React.ReactNode; bg: string; value: string; label: string; trend?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>{icon}</div>
        {trend}
      </div>
      <p className="text-xl font-bold text-dark-950">{value}</p>
      <p className="text-xs text-dark-500 mt-0.5">{label}</p>
    </div>
  );
}
