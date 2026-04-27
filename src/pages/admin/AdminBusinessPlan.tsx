import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Target, BarChart2, Building2, Users, Car, CreditCard, ArrowUpRight, Calendar, Download, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { exportToCSV } from '../../lib/csvExport';

interface MonthlyData {
  month: string;
  revenue: number;
  bookings: number;
  newCompanies: number;
  newUsers: number;
}

export default function AdminBusinessPlan() {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [totals, setTotals] = useState({ revenue: 0, bookings: 0, companies: 0, users: 0, vehicles: 0, subscriptionRevenue: 0 });
  const [projections, setProjections] = useState({ monthly: 0, yearly: 0, growth: 0 });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const months: MonthlyData[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date).toISOString();
      const end = endOfMonth(date).toISOString();
      const [{ data: bookings }, { data: companies }, { data: users }] = await Promise.all([
        supabase.from('bookings').select('total_price, payment_status').gte('created_at', start).lte('created_at', end),
        supabase.from('companies').select('id').gte('created_at', start).lte('created_at', end),
        supabase.from('profiles').select('id').gte('created_at', start).lte('created_at', end),
      ]);
      months.push({
        month: format(date, 'MMM yyyy'),
        revenue: (bookings || []).filter((b: any) => b.payment_status === 'paid').reduce((s: number, b: any) => s + (b.total_price || 0), 0),
        bookings: (bookings || []).length,
        newCompanies: (companies || []).length,
        newUsers: (users || []).length,
      });
    }
    setMonthlyData(months);

    const [{ data: allBookings }, { data: allCompanies }, { data: allUsers }, { data: allVehicles }, { data: subscriptions }] = await Promise.all([
      supabase.from('bookings').select('total_price, payment_status'),
      supabase.from('companies').select('id, subscription_plan_id, subscription_status'),
      supabase.from('profiles').select('id'),
      supabase.from('vehicles').select('id'),
      supabase.from('subscription_plans').select('price_monthly').eq('is_active', true),
    ]);

    const totalRev = (allBookings || []).filter((b: any) => b.payment_status === 'paid').reduce((s: number, b: any) => s + (b.total_price || 0), 0);
    const activeSubscriptions = (allCompanies || []).filter((c: any) => c.subscription_status === 'active' && c.subscription_plan_id);
    const subRevEst = activeSubscriptions.length * 49;

    setTotals({
      revenue: totalRev,
      bookings: (allBookings || []).length,
      companies: (allCompanies || []).length,
      users: (allUsers || []).length,
      vehicles: (allVehicles || []).length,
      subscriptionRevenue: subRevEst,
    });

    const lastMonth = months[months.length - 1]?.revenue || 0;
    const prevMonth = months[months.length - 2]?.revenue || 1;
    const growth = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;
    setProjections({
      monthly: lastMonth,
      yearly: lastMonth * 12,
      growth: Math.round(growth),
    });

    setLoading(false);
  }

  const maxRevenue = Math.max(...monthlyData.map(m => m.revenue), 1);

  return (
    <DashboardLayout navItems={adminNavItems} navGroups={adminNavGroups} title="Business Plan & Financat">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Plan & Financat</h1>
            <p className="text-gray-500 text-sm mt-1">Planifikimi financiar dhe projeksionet e biznesit</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadData} className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium">
              <RefreshCw className="w-4 h-4" />Perditeso
            </button>
            <button onClick={() => exportToCSV(monthlyData, 'business_plan')}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Download className="w-4 h-4" />Eksporto
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 grid grid-cols-3 gap-4">
                {[
                  { label: 'Te ardhura totale', value: `€${totals.revenue.toLocaleString()}`, icon: DollarSign, color: 'green' },
                  { label: 'Rezervime totale', value: totals.bookings.toLocaleString(), icon: Calendar, color: 'blue' },
                  { label: 'Firma te regjistruara', value: totals.companies, icon: Building2, color: 'teal' },
                  { label: 'Perdorues total', value: totals.users, icon: Users, color: 'orange' },
                  { label: 'Automjete total', value: totals.vehicles, icon: Car, color: 'gray' },
                  { label: 'Te ardhura nga abonim', value: `€${totals.subscriptionRevenue.toLocaleString()}`, icon: CreditCard, color: 'purple' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className={`w-8 h-8 rounded-lg bg-${color}-50 flex items-center justify-center mb-2`}>
                      <Icon className={`w-4 h-4 text-${color}-600`} />
                    </div>
                    <div className="text-xl font-bold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-500 mt-1">{label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-6 text-white">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Target className="w-5 h-5" />Projeksionet</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-primary-200">Te ardhura mujore (est.)</div>
                    <div className="text-3xl font-black mt-1">€{projections.monthly.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-primary-200">Projeksioni vjetor</div>
                    <div className="text-2xl font-bold mt-1">€{projections.yearly.toLocaleString()}</div>
                  </div>
                  <div className={`flex items-center gap-2 ${projections.growth >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-sm font-medium">{projections.growth >= 0 ? '+' : ''}{projections.growth}% krahasuar me muajin e kaluar</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-primary-600" />Te ardhurat sipas muajit (6 muajt e fundit)</h3>
              <div className="flex items-end gap-4 h-48">
                {monthlyData.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs font-medium text-gray-700">€{m.revenue > 999 ? `${(m.revenue / 1000).toFixed(1)}k` : m.revenue}</div>
                    <div className="w-full bg-primary-100 rounded-t-lg relative" style={{ height: `${(m.revenue / maxRevenue) * 160}px`, minHeight: 4 }}>
                      <div className="absolute inset-0 bg-primary-500 rounded-t-lg opacity-80" />
                    </div>
                    <div className="text-xs text-gray-400 text-center">{m.month}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Detajet mujore</h3>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Muaji', 'Te Ardhura', 'Rezervime', 'Firma te reja', 'Perdorues te rinj'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...monthlyData].reverse().map((m, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{m.month}</td>
                      <td className="px-6 py-4 text-sm text-green-700 font-semibold">€{m.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{m.bookings}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{m.newCompanies}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{m.newUsers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
