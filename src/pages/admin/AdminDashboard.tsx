import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Car, CalendarDays, TrendingUp, AlertCircle, CheckCircle2, CreditCard, Globe, MessageSquare, BarChart3, Megaphone, Settings, ArrowRight, DollarSign, Clock, FileText, Receipt } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Company, Profile, Booking, Invoice, SubscriptionPlan } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';

export default function AdminDashboard() {
  const { profile } = useAuth();
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
    pending: { label: 'Ne pritje', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
    approved: { label: 'Aprovuar', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    rejected: { label: 'Refuzuar', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
    suspended: { label: 'Pezulluar', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-500' },
  };

  const roleLabels: Record<string, { label: string; color: string }> = {
    client: { label: 'Klient', color: 'bg-blue-100 text-blue-700' },
    company_admin: { label: 'Kompani', color: 'bg-amber-100 text-amber-700' },
    super_admin: { label: 'Admin', color: 'bg-red-100 text-red-700' },
  };

  const bookingStatuses: Record<string, { label: string; color: string }> = {
    pending: { label: 'Ne pritje', color: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Konfirmuar', color: 'bg-blue-100 text-blue-700' },
    active: { label: 'Aktiv', color: 'bg-green-100 text-green-700' },
    completed: { label: 'Perfunduar', color: 'bg-gray-100 text-gray-600' },
    cancelled: { label: 'Anuluar', color: 'bg-red-100 text-red-700' },
  };

  const invoiceStatuses: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
    issued: { label: 'Leshuar', color: 'bg-blue-100 text-blue-700' },
    paid: { label: 'Paguar', color: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Anuluar', color: 'bg-red-100 text-red-700' },
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
        <h1 className="text-2xl font-bold text-dark-950">Administrimi i platformes</h1>
        <p className="text-dark-500 mt-1 text-[15px]">Pershendetje {profile?.full_name?.split(' ')[0]}, ketu menaxhoni platformen.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={<Users className="w-5 h-5 text-primary-600" />} bg="bg-primary-50" value={stats.users} label="Perdorues" sub={`${stats.clients} kliente, ${stats.companyAdmins} kompani`} />
        <Stat icon={<Building2 className="w-5 h-5 text-amber-600" />} bg="bg-amber-50" value={stats.companies} label="Kompani" sub={`${stats.approvedCompanies} aktive, ${stats.pendingCompanies} ne pritje`} />
        <Stat icon={<Car className="w-5 h-5 text-green-600" />} bg="bg-green-50" value={stats.vehicles} label="Automjete" />
        <Stat icon={<CalendarDays className="w-5 h-5 text-blue-600" />} bg="bg-blue-50" value={stats.bookings} label="Rezervime" sub={`${stats.activeBookings} aktive`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link to="/admin/transaksionet" className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 hover:shadow-lg transition-shadow">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.paidRevenue.toFixed(0)} EUR</p>
          <p className="text-xs text-white/80 mt-0.5">Pagesat e mbledhura</p>
        </Link>
        <Link to="/admin/transaksionet" className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 hover:shadow-lg transition-shadow">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.pendingPayments.toFixed(0)} EUR</p>
          <p className="text-xs text-white/80 mt-0.5">Ne pritje per pagese</p>
        </Link>
        <Link to="/admin/planet" className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 hover:shadow-lg transition-shadow">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.subscriptionRevenue.toFixed(0)} EUR/muaj</p>
          <p className="text-xs text-white/80 mt-0.5">Te ardhura nga abonimet</p>
        </Link>
        <Link to="/admin/raportet" className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-5 hover:shadow-lg transition-shadow">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.invoicesTotal}</p>
          <p className="text-xs text-white/80 mt-0.5">Fatura ({stats.invoicesPaid} te paguara)</p>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {[
          { icon: <CreditCard className="w-5 h-5" />, label: 'Planet', value: stats.plans, path: '/admin/planet', color: 'text-primary-600 bg-primary-50' },
          { icon: <Globe className="w-5 h-5" />, label: 'Faqja kryesore', value: '', path: '/admin/faqja', color: 'text-teal-600 bg-teal-50' },
          { icon: <MessageSquare className="w-5 h-5" />, label: 'Chat AI', value: stats.chatResponses, path: '/admin/chat', color: 'text-blue-600 bg-blue-50' },
          { icon: <BarChart3 className="w-5 h-5" />, label: 'Raportet', value: '', path: '/admin/raportet', color: 'text-green-600 bg-green-50' },
          { icon: <Megaphone className="w-5 h-5" />, label: 'Reklamat', value: stats.ads, path: '/admin/reklamat', color: 'text-orange-600 bg-orange-50' },
          { icon: <Settings className="w-5 h-5" />, label: 'Cilesimet', value: '', path: '/admin/cilesimet', color: 'text-dark-600 bg-gray-100' },
        ].map(q => (
          <Link key={q.path} to={q.path} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${q.color} flex items-center justify-center`}>{q.icon}</div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-dark-500 transition-colors" />
            </div>
            <p className="text-sm font-semibold text-dark-800">{q.label}</p>
            {q.value !== '' && <p className="text-[11px] text-dark-400 mt-0.5">{q.value} gjithsej</p>}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-dark-950">Kompanite ({companies.length})</h2>
            <Link to="/admin/kompanite" className="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors">Shiko te gjitha</Link>
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

        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-dark-950">Perdoruesit ({users.length})</h2>
            <Link to="/admin/perdoruesit" className="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors">Shiko te gjitha</Link>
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
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-dark-400" />
              <h2 className="font-semibold text-dark-950">Rezervimet e fundit</h2>
            </div>
            <Link to="/admin/transaksionet" className="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors">Shiko te gjitha</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentBookings.map(b => {
              const s = bookingStatuses[b.status] || bookingStatuses.pending;
              return (
                <div key={b.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-dark-900">{b.client_name}</p>
                    <p className="text-[11px] text-dark-400">{new Date(b.created_at).toLocaleDateString('sq-AL')} - {b.total_days} dite</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-dark-900">{b.total_price} EUR</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.color}`}>{s.label}</span>
                  </div>
                </div>
              );
            })}
            {recentBookings.length === 0 && (
              <div className="py-8 text-center text-sm text-dark-400">Nuk ka rezervime</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-dark-400" />
              <h2 className="font-semibold text-dark-950">Faturat e fundit</h2>
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
              <div className="py-8 text-center text-sm text-dark-400">Nuk ka fatura</div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Stat({ icon, bg, value, label, sub }: { icon: React.ReactNode; bg: string; value: string | number; label: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>{icon}</div>
        <div>
          <p className="text-xl font-bold text-dark-950">{value}</p>
          <p className="text-xs text-dark-500">{label}</p>
          {sub && <p className="text-[10px] text-dark-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
