import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Users, Car, CalendarDays, CreditCard, Globe, MessageSquare, BarChart3, Megaphone, Settings, DollarSign, Clock, FileText, Receipt } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Company, Profile, Booking, Invoice, SubscriptionPlan } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { localeFromI18n } from '../../lib/clientDashHelpers';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState({
    users: 0, clients: 0, companyAdmins: 0,
    companies: 0, pendingCompanies: 0, approvedCompanies: 0,
    vehicles: 0, bookings: 0, activeBookings: 0,
    revenue: 0, paidRevenue: 0, pendingPayments: 0,
    invoicesTotal: 0, invoicesPaid: 0, invoicesDraft: 0,
    subscriptionRevenue: 0,
    chatResponses: 0, ads: 0, plans: 0,
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [pRes, cRes, vRes, bRes, chatRes, adsRes, plansRes, invRes, subPlansRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('companies').select('*').order('created_at', { ascending: false }),
      supabase.from('vehicles').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('chat_responses').select('id', { count: 'exact', head: true }),
      supabase.from('platform_ads').select('id', { count: 'exact', head: true }),
      supabase.from('subscription_plans').select('id', { count: 'exact', head: true }),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('subscription_plans').select('*'),
    ]);

    const profiles = (pRes.data || []) as Profile[];
    const comps = (cRes.data || []) as Company[];
    const bks = (bRes.data || []) as Booking[];
    const invoices = (invRes.data || []) as Invoice[];
    const subPlans = (subPlansRes.data || []) as SubscriptionPlan[];

    const revenue = bks.filter(b => b.status === 'completed' || b.status === 'active').reduce((s, b) => s + Number(b.total_price), 0);
    const paidRevenue = bks.filter(b => b.payment_status === 'paid').reduce((s, b) => s + Number(b.total_price), 0);
    const pendingPayments = bks.filter(b => b.payment_status === 'pending').reduce((s, b) => s + Number(b.total_price), 0);

    const activeCompanies = comps.filter(c => c.subscription_status === 'active');
    const subscriptionRevenue = activeCompanies.reduce((s, c) => {
      const plan = subPlans.find(p => p.id === c.subscription_plan_id);
      return s + (plan ? Number(plan.price_monthly) : 0);
    }, 0);

    setStats({
      users: profiles.length,
      clients: profiles.filter(p => p.role === 'client').length,
      companyAdmins: profiles.filter(p => p.role === 'company_admin').length,
      companies: comps.length,
      pendingCompanies: comps.filter(c => c.status === 'pending').length,
      approvedCompanies: comps.filter(c => c.status === 'approved').length,
      vehicles: vRes.count || 0,
      bookings: bks.length,
      activeBookings: bks.filter(b => b.status === 'active' || b.status === 'confirmed').length,
      revenue,
      paidRevenue,
      pendingPayments,
      invoicesTotal: invoices.length,
      invoicesPaid: invoices.filter(i => i.status === 'paid').length,
      invoicesDraft: invoices.filter(i => i.status === 'draft').length,
      subscriptionRevenue,
      chatResponses: chatRes.count || 0,
      ads: adsRes.count || 0,
      plans: plansRes.count || 0,
    });
    setCompanies(comps);
    setUsers(profiles.slice(0, 8));
    setRecentBookings(bks.slice(0, 6));
    setRecentInvoices(invoices.slice(0, 6));
    setLoading(false);
  }

  const companyStatuses: Record<string, { label: string; color: string; dot: string }> = {
    pending: { label: t('adminDash.statusCompany.pending'), color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
    approved: { label: t('adminDash.statusCompany.approved'), color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    rejected: { label: t('adminDash.statusCompany.rejected'), color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
    suspended: { label: t('adminDash.statusCompany.suspended'), color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-500' },
  };

  const roleLabels: Record<string, { label: string; color: string }> = {
    client: { label: t('adminDash.role.client'), color: 'bg-blue-100 text-blue-700' },
    company_admin: { label: t('adminDash.role.company_admin'), color: 'bg-amber-100 text-amber-700' },
    super_admin: { label: t('adminDash.role.super_admin'), color: 'bg-red-100 text-red-700' },
  };

  const bookingStatuses: Record<string, { label: string; color: string }> = {
    pending: { label: t('adminDash.statusBooking.pending'), color: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: t('adminDash.statusBooking.confirmed'), color: 'bg-blue-100 text-blue-700' },
    active: { label: t('adminDash.statusBooking.active'), color: 'bg-green-100 text-green-700' },
    completed: { label: t('adminDash.statusBooking.completed'), color: 'bg-gray-100 text-gray-600' },
    cancelled: { label: t('adminDash.statusBooking.cancelled'), color: 'bg-red-100 text-red-700' },
  };

  const invoiceStatuses: Record<string, { label: string; color: string }> = {
    draft: { label: t('adminDash.statusInvoice.draft'), color: 'bg-gray-100 text-gray-600' },
    issued: { label: t('adminDash.statusInvoice.issued'), color: 'bg-blue-100 text-blue-700' },
    paid: { label: t('adminDash.statusInvoice.paid'), color: 'bg-green-100 text-green-700' },
    cancelled: { label: t('adminDash.statusInvoice.cancelled'), color: 'bg-red-100 text-red-700' },
  };

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-950">{t('adminDash.dashboard.title')}</h1>
        <p className="text-dark-500 mt-1 text-[15px]">{t('adminDash.dashboard.greeting', { name: profile?.full_name?.split(' ')[0] || '' })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={<Users className="w-4 h-4 text-dark-500" />} value={stats.users} label={t('adminDash.dashboard.statUsers')} sub={t('adminDash.dashboard.statUsersSub', { clients: stats.clients, companies: stats.companyAdmins })} />
        <Stat icon={<Building2 className="w-4 h-4 text-dark-500" />} value={stats.companies} label={t('adminDash.dashboard.statCompanies')} sub={t('adminDash.dashboard.statCompaniesSub', { active: stats.approvedCompanies, pending: stats.pendingCompanies })} />
        <Stat icon={<Car className="w-4 h-4 text-dark-500" />} value={stats.vehicles} label={t('adminDash.dashboard.statVehicles')} />
        <Stat icon={<CalendarDays className="w-4 h-4 text-dark-500" />} value={stats.bookings} label={t('adminDash.dashboard.statBookings')} sub={t('adminDash.dashboard.statBookingsSub', { active: stats.activeBookings })} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <RevenueCard to="/admin/transaksionet" icon={<DollarSign className="w-4 h-4 text-dark-400" />} value={`${stats.paidRevenue.toFixed(0)} EUR`} label={t('adminDash.dashboard.revenueCollected')} />
        <RevenueCard to="/admin/transaksionet" icon={<Clock className="w-4 h-4 text-dark-400" />} value={`${stats.pendingPayments.toFixed(0)} EUR`} label={t('adminDash.dashboard.revenuePending')} />
        <RevenueCard to="/admin/planet" icon={<CreditCard className="w-4 h-4 text-dark-400" />} value={t('adminDash.dashboard.revenuePerMonth', { amount: stats.subscriptionRevenue.toFixed(0) })} label={t('adminDash.dashboard.revenueSubscriptions')} />
        <RevenueCard to="/admin/raportet" icon={<Receipt className="w-4 h-4 text-dark-400" />} value={`${stats.invoicesTotal}`} label={t('adminDash.dashboard.revenueInvoices', { paid: stats.invoicesPaid })} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          { icon: <CreditCard className="w-4 h-4" />, label: t('adminDash.dashboard.quickPlans'), value: stats.plans, path: '/admin/planet' },
          { icon: <Globe className="w-4 h-4" />, label: t('adminDash.dashboard.quickHomepage'), value: '', path: '/admin/faqja' },
          { icon: <MessageSquare className="w-4 h-4" />, label: t('adminDash.dashboard.quickChat'), value: stats.chatResponses, path: '/admin/chat' },
          { icon: <BarChart3 className="w-4 h-4" />, label: t('adminDash.dashboard.quickReports'), value: '', path: '/admin/raportet' },
          { icon: <Megaphone className="w-4 h-4" />, label: t('adminDash.dashboard.quickAds'), value: stats.ads, path: '/admin/reklamat' },
          { icon: <Settings className="w-4 h-4" />, label: t('adminDash.dashboard.quickSettings'), value: '', path: '/admin/cilesimet' },
        ].map(q => (
          <Link key={q.path} to={q.path} className="bg-white rounded-lg border border-gray-200 px-3 py-3 hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-dark-500">{q.icon}</span>
              <p className="text-sm font-semibold text-dark-800">{q.label}</p>
            </div>
            {q.value !== '' && <p className="text-[11px] text-dark-400">{t('adminDash.dashboard.quickTotal', { count: q.value as number })}</p>}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-dark-950">{t('adminDash.dashboard.companiesTitle', { count: companies.length })}</h2>
            <Link to="/admin/kompanite" className="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors">{t('adminDash.common.viewAll')}</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {companies.slice(0, 6).map(c => {
              const s = companyStatuses[c.status] || companyStatuses.pending;
              return (
                <div key={c.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                      {c.logo_url ? <img src={c.logo_url} alt="" className="w-10 h-10 object-cover" /> : <Building2 className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-900">{c.name}</p>
                      <p className="text-[11px] text-dark-400">{c.city}, {c.country}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${s.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-dark-950">{t('adminDash.dashboard.usersTitle', { count: users.length })}</h2>
            <Link to="/admin/perdoruesit" className="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors">{t('adminDash.common.viewAll')}</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {users.map(u => {
              const r = roleLabels[u.role] || roleLabels.client;
              return (
                <div key={u.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                      {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-900">{u.full_name}</p>
                      <p className="text-[11px] text-dark-400">{u.email}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${r.color}`}>{r.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-dark-400" />
              <h2 className="font-semibold text-dark-950">{t('adminDash.dashboard.recentBookings')}</h2>
            </div>
            <Link to="/admin/transaksionet" className="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors">{t('adminDash.common.viewAll')}</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentBookings.map(b => {
              const s = bookingStatuses[b.status] || bookingStatuses.pending;
              return (
                <div key={b.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-dark-900">{b.client_name}</p>
                    <p className="text-[11px] text-dark-400">{new Date(b.created_at).toLocaleDateString(localeFromI18n(i18n.language))} - {t('adminDash.dashboard.bookingDays', { count: b.total_days })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-dark-900">{b.total_price} EUR</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.color}`}>{s.label}</span>
                  </div>
                </div>
              );
            })}
            {recentBookings.length === 0 && (
              <div className="py-8 text-center text-sm text-dark-400">{t('adminDash.dashboard.noBookings')}</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-dark-400" />
              <h2 className="font-semibold text-dark-950">{t('adminDash.dashboard.recentInvoices')}</h2>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {recentInvoices.map(inv => {
              const s = invoiceStatuses[inv.status] || invoiceStatuses.draft;
              return (
                <div key={inv.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-dark-900">{inv.invoice_number}</p>
                    <p className="text-[11px] text-dark-400">{inv.client_name} - {inv.company_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-dark-900">{inv.total_price} EUR</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.color}`}>{s.label}</span>
                  </div>
                </div>
              );
            })}
            {recentInvoices.length === 0 && (
              <div className="py-8 text-center text-sm text-dark-400">{t('adminDash.dashboard.noInvoices')}</div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Stat({ icon, value, label, sub }: { icon: React.ReactNode; value: string | number; label: string; sub?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="shrink-0">{icon}</span>
        <p className="text-xs text-dark-500 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-dark-950">{value}</p>
      {sub && <p className="text-[11px] text-dark-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function RevenueCard({ to, icon, value, label }: { to: string; icon: React.ReactNode; value: string; label: string }) {
  return (
    <Link to={to} className="bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="shrink-0">{icon}</span>
        <p className="text-xs text-dark-500 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-dark-950">{value}</p>
    </Link>
  );
}
