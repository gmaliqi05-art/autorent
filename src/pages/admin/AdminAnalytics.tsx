import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Building2, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, BarChart2, PieChart, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { format, subDays, eachDayOfInterval } from 'date-fns';

type Period = '7days' | '30days' | '90days' | '12months';

interface DayData { date: string; bookings: number; revenue: number; }

export default function AdminAnalytics() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('30days');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0, newUsers: 0, totalCompanies: 0, newCompanies: 0,
    totalBookings: 0, newBookings: 0, totalRevenue: 0, newRevenue: 0,
    activeVehicles: 0, completionRate: 0, cancellationRate: 0, avgBookingValue: 0,
  });
  const [chartData, setChartData] = useState<DayData[]>([]);
  const [topCompanies, setTopCompanies] = useState<{ name: string; revenue: number; bookings: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ category: string; count: number }[]>([]);

  useEffect(() => { loadData(); }, [period]);

  async function loadData() {
    setLoading(true);
    const now = new Date();
    let startDate: Date;
    if (period === '7days') startDate = subDays(now, 7);
    else if (period === '30days') startDate = subDays(now, 30);
    else if (period === '90days') startDate = subDays(now, 90);
    else startDate = subDays(now, 365);

    const prevStart = subDays(startDate, period === '7days' ? 7 : period === '30days' ? 30 : period === '90days' ? 90 : 365);

    const [
      { data: bookings },
      { data: prevBookings },
      { data: users },
      { data: prevUsers },
      { data: companies },
      { data: vehicles },
    ] = await Promise.all([
      supabase.from('bookings').select('*').gte('created_at', startDate.toISOString()),
      supabase.from('bookings').select('*').gte('created_at', prevStart.toISOString()).lt('created_at', startDate.toISOString()),
      supabase.from('profiles').select('id, created_at').gte('created_at', startDate.toISOString()),
      supabase.from('profiles').select('id, created_at').gte('created_at', prevStart.toISOString()).lt('created_at', startDate.toISOString()),
      supabase.from('companies').select('id, name, created_at').gte('created_at', startDate.toISOString()),
      supabase.from('vehicles').select('id, category, is_published'),
    ]);

    const allBookings = bookings || [];
    const allPrevBookings = prevBookings || [];
    const totalRev = allBookings.filter((b: any) => b.payment_status === 'paid').reduce((s: number, b: any) => s + (b.total_price || 0), 0);
    const prevRev = allPrevBookings.filter((b: any) => b.payment_status === 'paid').reduce((s: number, b: any) => s + (b.total_price || 0), 0);
    const completed = allBookings.filter((b: any) => b.status === 'completed').length;
    const cancelled = allBookings.filter((b: any) => b.status === 'cancelled').length;

    setStats({
      totalUsers: (users || []).length,
      newUsers: (users || []).length - (prevUsers || []).length,
      totalCompanies: (companies || []).length,
      newCompanies: (companies || []).length,
      totalBookings: allBookings.length,
      newBookings: allBookings.length - allPrevBookings.length,
      totalRevenue: totalRev,
      newRevenue: totalRev - prevRev,
      activeVehicles: (vehicles || []).filter((v: any) => v.is_published).length,
      completionRate: allBookings.length ? Math.round((completed / allBookings.length) * 100) : 0,
      cancellationRate: allBookings.length ? Math.round((cancelled / allBookings.length) * 100) : 0,
      avgBookingValue: allBookings.length ? Math.round(totalRev / allBookings.length) : 0,
    });

    const days = eachDayOfInterval({ start: startDate, end: now });
    const chartDays: DayData[] = days.slice(-30).map(d => {
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayBookings = allBookings.filter((b: any) => b.created_at?.startsWith(dateStr));
      return {
        date: format(d, 'dd/MM'),
        bookings: dayBookings.length,
        revenue: dayBookings.filter((b: any) => b.payment_status === 'paid').reduce((s: number, b: any) => s + (b.total_price || 0), 0),
      };
    });
    setChartData(chartDays);

    const { data: compBookings } = await supabase.from('bookings').select('company_id, total_price, payment_status').gte('created_at', startDate.toISOString());
    const { data: companyList } = await supabase.from('companies').select('id, name');
    const compMap: Record<string, { name: string; revenue: number; bookings: number }> = {};
    (companyList || []).forEach((c: any) => { compMap[c.id] = { name: c.name, revenue: 0, bookings: 0 }; });
    (compBookings || []).forEach((b: any) => {
      if (compMap[b.company_id]) {
        compMap[b.company_id].bookings++;
        if (b.payment_status === 'paid') compMap[b.company_id].revenue += b.total_price || 0;
      }
    });
    const sorted = Object.values(compMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    setTopCompanies(sorted);

    const catCount: Record<string, number> = {};
    (vehicles || []).forEach((v: any) => { catCount[v.category] = (catCount[v.category] || 0) + 1; });
    setCategoryData(Object.entries(catCount).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count));

    setLoading(false);
  }

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);
  const maxBookings = Math.max(...chartData.map(d => d.bookings), 1);

  const periodLabel = (p: Period) =>
    p === '7days' ? t('adminDash.analytics.period7days')
    : p === '30days' ? t('adminDash.analytics.period30days')
    : p === '90days' ? t('adminDash.analytics.period90days')
    : t('adminDash.analytics.period12months');

  return (
    <DashboardLayout navItems={adminNavItems} navGroups={adminNavGroups} title={t('adminDash.analytics.pageTitle')}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('adminDash.analytics.title')}</h1>
            <p className="text-gray-500 text-sm mt-1">{t('adminDash.analytics.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            {(['7days', '30days', '90days', '12months'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                {periodLabel(p)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: t('adminDash.analytics.statNewUsers'), value: stats.totalUsers, change: stats.newUsers, icon: Users, color: 'blue' },
                { label: t('adminDash.analytics.statNewCompanies'), value: stats.totalCompanies, change: stats.newCompanies, icon: Building2, color: 'green' },
                { label: t('adminDash.analytics.statBookings'), value: stats.totalBookings, change: stats.newBookings, icon: Calendar, color: 'orange' },
                { label: t('adminDash.analytics.statRevenue'), value: `€${stats.totalRevenue.toLocaleString()}`, change: stats.newRevenue, icon: DollarSign, color: 'teal', isCurrency: true },
              ].map(({ label, value, change, icon: Icon, color, isCurrency }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${color}-50`}>
                      <Icon className={`w-5 h-5 text-${color}-600`} />
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {isCurrency ? `€${Math.abs(change).toLocaleString()}` : Math.abs(change)}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: t('adminDash.analytics.completionRate'), value: stats.completionRate, color: 'green' },
                { label: t('adminDash.analytics.cancellationRate'), value: stats.cancellationRate, color: 'red' },
                { label: t('adminDash.analytics.avgBookingValue'), value: null, formatted: `€${stats.avgBookingValue}`, color: 'blue' },
              ].map(({ label, value, formatted, color }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="text-sm text-gray-500 mb-2">{label}</div>
                  <div className={`text-3xl font-bold text-${color}-600`}>{formatted || `${value}%`}</div>
                  {value !== null && (
                    <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full bg-${color}-500 rounded-full`} style={{ width: `${value}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-primary-600" /> {t('adminDash.analytics.bookingsAndRevenue')}</h3>
                <div className="flex gap-6 overflow-x-auto pb-2">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="flex items-end gap-1 h-32">
                        <div className="w-3 bg-primary-200 rounded-t" style={{ height: `${(d.revenue / maxRevenue) * 100}%` }} title={t('adminDash.analytics.tooltipRevenue', { amount: d.revenue })} />
                        <div className="w-3 bg-primary-600 rounded-t" style={{ height: `${(d.bookings / maxBookings) * 100}%` }} title={t('adminDash.analytics.tooltipBookings', { count: d.bookings })} />
                      </div>
                      <span className="text-xs text-gray-400 rotate-45 origin-left mt-2">{d.date}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-4">
                  <span className="flex items-center gap-2 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-primary-200" />{t('adminDash.analytics.legendRevenue')}</span>
                  <span className="flex items-center gap-2 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-primary-600" />{t('adminDash.analytics.legendBookings')}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-primary-600" /> {t('adminDash.analytics.topCompanies')}</h3>
                <div className="space-y-3">
                  {topCompanies.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.bookings} {t('adminDash.analytics.bookingsShort')} · €{c.revenue.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                  {topCompanies.length === 0 && <p className="text-gray-400 text-sm">{t('adminDash.analytics.noData')}</p>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><PieChart className="w-5 h-5 text-primary-600" /> {t('adminDash.analytics.vehiclesByCategory')}</h3>
              <div className="flex flex-wrap gap-4">
                {categoryData.map((c, i) => {
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-teal-500', 'bg-red-500', 'bg-gray-500'];
                  return (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
                      <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
                      <span className="text-sm font-medium text-gray-700 capitalize">{c.category}</span>
                      <span className="text-sm text-gray-400 font-bold">{c.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
