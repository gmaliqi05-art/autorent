import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2, Check, X, Ban, RotateCcw, Loader2, Search, Car, CalendarDays,
  DollarSign, ChevronLeft, ChevronRight, Download, Eye, Star, MapPin,
  Phone, Mail, Hash, TrendingUp, CheckCircle, AlertTriangle,
  CreditCard, ArrowUpDown, Shield,
} from 'lucide-react';
import type { TFunction } from 'i18next';
import { supabase } from '../../lib/supabase';
import type { Company, Booking, Vehicle, SubscriptionPlan } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { sendCompanyApprovedEmail, sendCompanyRejectedEmail, sendCompanySuspendedEmail } from '../../lib/emailService';
import { exportToCSV } from '../../lib/csvExport';
import { localeFromI18n } from '../../lib/clientDashHelpers';

const ITEMS_PER_PAGE = 15;

const STATUS_STYLES: Record<string, { color: string; dot: string; bg: string }> = {
  pending:   { color: 'text-amber-700',  dot: 'bg-amber-500',  bg: 'bg-amber-50 border-amber-200' },
  approved:  { color: 'text-green-700',  dot: 'bg-green-500',  bg: 'bg-green-50 border-green-200' },
  rejected:  { color: 'text-red-700',    dot: 'bg-red-500',    bg: 'bg-red-50 border-red-200' },
  suspended: { color: 'text-gray-600',   dot: 'bg-gray-400',   bg: 'bg-gray-100 border-gray-200' },
};

const SUB_STYLES: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  expired:  'bg-red-100 text-red-700',
  trial:    'bg-blue-100 text-blue-700',
};

function statusLabel(t: TFunction, status: string): string {
  const key = `adminDash.statusCompany.${status}`;
  const v = t(key);
  return v === key ? status : v;
}

function subLabel(t: TFunction, sub: string): string {
  const key = `adminDash.subscription.${sub}`;
  const v = t(key);
  return v === key ? sub : v;
}

interface CompanyReport extends Company {
  bookingsCount: number;
  vehiclesCount: number;
  publishedVehicles: number;
  revenue: number;
  pendingRevenue: number;
  planName: string;
  plan: SubscriptionPlan | null;
  completedBookings: number;
  cancelledBookings: number;
  activeBookings: number;
}

interface CompanyVehicle extends Vehicle { bookingCount?: number; }

export default function AdminCompanies() {
  const { t, i18n } = useTranslation();
  const [companies, setCompanies] = useState<CompanyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'created_at' | 'bookings'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [detailCompany, setDetailCompany] = useState<CompanyReport | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'vehicles' | 'bookings' | 'subscription'>('overview');
  const [companyVehicles, setCompanyVehicles] = useState<CompanyVehicle[]>([]);
  const [companyBookings, setCompanyBookings] = useState<Booking[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ id: string; msg: string; type: 'ok' | 'err' } | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [assignPlanModal, setAssignPlanModal] = useState<CompanyReport | null>(null);
  const [assignPlanId, setAssignPlanId] = useState('');
  const [assignBilling, setAssignBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [assigning, setAssigning] = useState(false);
  const [rejectModal, setRejectModal] = useState<CompanyReport | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { setPage(1); }, [statusFilter, subFilter, search, sortBy, sortDir]);

  async function loadAll() {
    setLoading(true);
    const [cRes, bRes, vRes, pRes] = await Promise.all([
      supabase.from('companies').select('*').order('created_at', { ascending: false }),
      supabase.from('bookings').select('company_id, total_price, status, payment_status'),
      supabase.from('vehicles').select('company_id, is_published, is_available'),
      supabase.from('subscription_plans').select('*').eq('is_active', true),
    ]);

    const comps = (cRes.data || []) as Company[];
    const bookings = (bRes.data || []) as Booking[];
    const vehicles = (vRes.data || []) as Vehicle[];
    const plansData = (pRes.data || []) as SubscriptionPlan[];
    setPlans(plansData);

    const enriched: CompanyReport[] = comps.map(c => {
      const cb = bookings.filter(b => b.company_id === c.id);
      const cv = vehicles.filter(v => v.company_id === c.id);
      const plan = plansData.find(p => p.id === c.subscription_plan_id) || null;
      return {
        ...c,
        bookingsCount: cb.length,
        vehiclesCount: cv.length,
        publishedVehicles: cv.filter(v => v.is_published).length,
        revenue: cb.filter(b => b.status === 'completed' || b.payment_status === 'paid').reduce((s, b) => s + Number(b.total_price), 0),
        pendingRevenue: cb.filter(b => b.status === 'confirmed' || b.status === 'active').reduce((s, b) => s + Number(b.total_price), 0),
        completedBookings: cb.filter(b => b.status === 'completed').length,
        cancelledBookings: cb.filter(b => b.status === 'cancelled').length,
        activeBookings: cb.filter(b => b.status === 'active' || b.status === 'confirmed').length,
        planName: plan?.name || 'Free',
        plan,
      };
    });

    setCompanies(enriched);
    setLoading(false);
  }

  async function openDetail(c: CompanyReport) {
    setDetailCompany(c);
    setDetailTab('overview');
    setLoadingDetail(true);
    const [vRes, bRes] = await Promise.all([
      supabase.from('vehicles').select('*').eq('company_id', c.id).order('created_at', { ascending: false }),
      supabase.from('bookings').select('*').eq('company_id', c.id).order('created_at', { ascending: false }).limit(50),
    ]);
    setCompanyVehicles((vRes.data || []) as CompanyVehicle[]);
    setCompanyBookings((bRes.data || []) as Booking[]);
    setLoadingDetail(false);
  }

  async function updateStatus(id: string, status: string, reason?: string) {
    const company = companies.find(c => c.id === id);
    if (!company) return;
    setActionLoading(id);
    await supabase.from('companies').update({ status }).eq('id', id);
    if (status === 'approved') await sendCompanyApprovedEmail(company.email || '', company.name, company.id);
    else if (status === 'rejected') await sendCompanyRejectedEmail(company.email || '', company.name, company.id, reason || t('adminDash.companies.defaultRejectReason'));
    else if (status === 'suspended') await sendCompanySuspendedEmail(company.email || '', company.name, company.id, reason || t('adminDash.companies.defaultSuspendReason'));
    setActionLoading(null);
    setActionFeedback({ id, msg: t('adminDash.companies.statusUpdateSuccess'), type: 'ok' });
    setTimeout(() => setActionFeedback(null), 3000);
    await loadAll();
  }

  async function assignPlan() {
    if (!assignPlanModal || !assignPlanId) return;
    setAssigning(true);
    const plan = plans.find(p => p.id === assignPlanId);
    const expires = new Date();
    expires.setMonth(expires.getMonth() + (assignBilling === 'yearly' ? 12 : 1));
    await supabase.from('companies').update({ subscription_plan_id: assignPlanId, subscription_status: 'active', subscription_expires_at: expires.toISOString() }).eq('id', assignPlanModal.id);
    setAssigning(false);
    setAssignPlanModal(null);
    setAssignPlanId('');
    setActionFeedback({ id: assignPlanModal.id, msg: t('adminDash.companies.planAssignSuccess', { name: plan?.name || '' }), type: 'ok' });
    setTimeout(() => setActionFeedback(null), 4000);
    await loadAll();
  }

  function handleExport() {
    const data = filtered.map(c => ({
      [t('adminDash.companies.csvName')]: c.name,
      [t('adminDash.companies.csvCity')]: c.city,
      [t('adminDash.companies.csvCountry')]: c.country,
      [t('adminDash.companies.csvEmail')]: c.email,
      [t('adminDash.companies.csvPhone')]: c.phone,
      [t('adminDash.companies.csvStatus')]: statusLabel(t, c.status),
      [t('adminDash.companies.csvPlan')]: c.planName,
      [t('adminDash.companies.csvSubscription')]: subLabel(t, c.subscription_status),
      [t('adminDash.companies.csvVehicles')]: c.vehiclesCount,
      [t('adminDash.companies.csvPublished')]: c.publishedVehicles,
      [t('adminDash.companies.csvBookings')]: c.bookingsCount,
      [t('adminDash.companies.csvActive')]: c.activeBookings,
      [t('adminDash.companies.csvRevenue')]: c.revenue.toFixed(0),
      [t('adminDash.companies.csvRating')]: c.rating?.toFixed(1) || '0.0',
      [t('adminDash.companies.csvRegistered')]: new Date(c.created_at).toLocaleDateString(localeFromI18n(i18n.language)),
    }));
    exportToCSV(data, t('adminDash.companies.csvFilename'));
  }

  function toggleSort(field: 'name' | 'revenue' | 'created_at' | 'bookings') {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  }

  let filtered = [...companies];
  if (statusFilter) filtered = filtered.filter(c => c.status === statusFilter);
  if (subFilter) filtered = filtered.filter(c => c.subscription_status === subFilter);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q) || c.phone?.includes(q) || c.license_number?.toLowerCase().includes(q));
  }
  filtered.sort((a, b) => {
    let av: number | string = a.created_at, bv: number | string = b.created_at;
    if (sortBy === 'name') { av = a.name; bv = b.name; }
    else if (sortBy === 'revenue') { av = a.revenue; bv = b.revenue; }
    else if (sortBy === 'bookings') { av = a.bookingsCount; bv = b.bookingsCount; }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const pendingCount = companies.filter(c => c.status === 'pending').length;
  const approvedCount = companies.filter(c => c.status === 'approved').length;
  const totalRevenue = companies.reduce((s, c) => s + c.revenue, 0);
  const totalActiveBookings = companies.reduce((s, c) => s + c.activeBookings, 0);

  return (
    <DashboardLayout title={t('admin.companies')} navItems={adminNavItems} navGroups={adminNavGroups}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-950">{t('adminDash.companies.title')}</h1>
          <p className="text-dark-500 mt-1 text-[15px]">{t('adminDash.companies.subtitle')}</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 text-primary-700 text-sm font-semibold rounded-xl hover:bg-primary-100 transition-colors shrink-0">
          <Download className="w-4 h-4" />{t('adminDash.common.exportCsv')}
        </button>
      </div>

      {actionFeedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm font-medium border ${actionFeedback.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {actionFeedback.type === 'ok' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {actionFeedback.msg}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Building2 className="w-5 h-5 text-dark-600" />} label={t('adminDash.companies.statTotal')} value={companies.length} sub={t('adminDash.companies.statTotalSub', { count: approvedCount })} bg="bg-white" iconBg="bg-gray-100" />
        <StatCard icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} label={t('adminDash.companies.statPending')} value={pendingCount} sub={t('adminDash.companies.statPendingSub')} bg="bg-amber-50" iconBg="bg-amber-100" highlight={pendingCount > 0} />
        <StatCard icon={<DollarSign className="w-5 h-5 text-green-600" />} label={t('adminDash.companies.statRevenue')} value={`${totalRevenue.toFixed(0)} EUR`} sub={t('adminDash.companies.statRevenueSub')} bg="bg-green-50" iconBg="bg-green-100" />
        <StatCard icon={<CalendarDays className="w-5 h-5 text-primary-600" />} label={t('adminDash.companies.statActiveBookings')} value={totalActiveBookings} sub={t('adminDash.companies.statActiveBookingsSub')} bg="bg-primary-50" iconBg="bg-primary-100" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('adminDash.companies.searchPlaceholder')} className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <select value={subFilter} onChange={e => setSubFilter(e.target.value)} className="px-3 py-2 text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl text-dark-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
              <option value="">{t('adminDash.companies.anySubscription')}</option>
              {Object.keys(SUB_STYLES).map(v => <option key={v} value={v}>{subLabel(t, v)}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[['', t('adminDash.companies.filterAll'), companies.length], ['pending', t('adminDash.companies.filterPending'), pendingCount], ['approved', t('adminDash.companies.filterApproved'), approvedCount], ['rejected', t('adminDash.companies.filterRejected'), companies.filter(c => c.status === 'rejected').length], ['suspended', t('adminDash.companies.filterSuspended'), companies.filter(c => c.status === 'suspended').length]].map(([v, l, count]) => (
              <button key={String(v)} onClick={() => setStatusFilter(String(v))} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === v ? 'bg-primary-600 text-white' : 'bg-gray-100 text-dark-600 hover:bg-gray-200'}`}>
                {l}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusFilter === v ? 'bg-white/20 text-white' : 'bg-white text-dark-500'}`}>{count}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="w-7 h-7 text-primary-600 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-dark-600 font-medium">{t('adminDash.companies.emptyState')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.companies.thCompany')}</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.companies.thStatus')}</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.companies.thSubscription')}</th>
                    <SortTh label={t('adminDash.companies.thVehicles')} field="name" current={sortBy} dir={sortDir} onSort={toggleSort} />
                    <SortTh label={t('adminDash.companies.thBookings')} field="bookings" current={sortBy} dir={sortDir} onSort={toggleSort} />
                    <SortTh label={t('adminDash.companies.thRevenue')} field="revenue" current={sortBy} dir={sortDir} onSort={toggleSort} />
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{t('adminDash.companies.thActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(c => {
                    const s = STATUS_STYLES[c.status] || STATUS_STYLES.pending;
                    const subColor = SUB_STYLES[c.subscription_status] || SUB_STYLES.inactive;
                    const isAct = actionLoading === c.id;
                    const daysLeft = c.subscription_expires_at ? Math.ceil((new Date(c.subscription_expires_at).getTime() - Date.now()) / 86400000) : null;
                    return (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                              {c.logo_url ? <img src={c.logo_url} alt="" className="w-10 h-10 object-cover" /> : <Building2 className="w-4 h-4 text-gray-400" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-dark-900 truncate">{c.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <MapPin className="w-3 h-3 text-dark-400" />
                                <span className="text-[11px] text-dark-400 truncate">{c.city}, {c.country}</span>
                                {c.rating > 0 && <span className="flex items-center gap-0.5 text-[11px] text-amber-600 font-medium"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{c.rating.toFixed(1)}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${s.bg} ${s.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{statusLabel(t, c.status)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs font-semibold text-dark-800">{c.planName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${subColor}`}>{subLabel(t, c.subscription_status)}</span>
                            {daysLeft !== null && daysLeft <= 7 && daysLeft >= 0 && <span className="text-[10px] text-red-600 font-medium">{t('adminDash.companies.daysLeft', { days: daysLeft })}</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm font-bold text-dark-900">{c.vehiclesCount}</span>
                          <br /><span className="text-[11px] text-green-600 font-medium">{t('adminDash.companies.published', { count: c.publishedVehicles })}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm font-bold text-dark-900">{c.bookingsCount}</span>
                          <br /><span className="text-[11px] text-primary-600 font-medium">{t('adminDash.companies.activeShort', { count: c.activeBookings })}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm font-bold text-green-600">{c.revenue.toFixed(0)} EUR</span>
                          {c.pendingRevenue > 0 && <><br /><span className="text-[11px] text-amber-600 font-medium">{t('adminDash.companies.pendingShort', { amount: c.pendingRevenue.toFixed(0) })}</span></>}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => openDetail(c)} className="p-1.5 bg-gray-50 text-dark-500 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors" title={t('adminDash.companies.detailsTitle')}><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { setAssignPlanModal(c); setAssignPlanId(c.subscription_plan_id || ''); }} className="p-1.5 bg-gray-50 text-dark-500 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors" title={t('adminDash.companies.assignPlanTooltip')}><CreditCard className="w-3.5 h-3.5" /></button>
                            {isAct ? <Loader2 className="w-4 h-4 text-primary-600 animate-spin" /> : (
                              <>
                                {c.status === 'pending' && <>
                                  <button onClick={() => updateStatus(c.id, 'approved')} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title={t('adminDash.companies.approveTooltip')}><Check className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => { setRejectModal(c); setRejectReason(''); }} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title={t('adminDash.companies.rejectTooltip')}><X className="w-3.5 h-3.5" /></button>
                                </>}
                                {c.status === 'approved' && <button onClick={() => updateStatus(c.id, 'suspended')} className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors" title={t('adminDash.companies.suspendTooltip')}><Ban className="w-3.5 h-3.5" /></button>}
                                {(c.status === 'suspended' || c.status === 'rejected') && <button onClick={() => updateStatus(c.id, 'approved')} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title={t('adminDash.companies.reactivateTooltip')}><RotateCcw className="w-3.5 h-3.5" /></button>}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                <p className="text-sm text-dark-500">{t('adminDash.companies.pageRange', { from: (safePage - 1) * ITEMS_PER_PAGE + 1, to: Math.min(safePage * ITEMS_PER_PAGE, filtered.length), total: filtered.length })}</p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1} className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-all"><ChevronLeft className="w-4 h-4 text-dark-600" /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1).reduce<(number | string)[]>((acc, p, idx, arr) => { if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...'); acc.push(p); return acc; }, []).map((item, idx) =>
                    typeof item === 'string' ? <span key={`d${idx}`} className="px-2 text-dark-400 text-sm">…</span> :
                    <button key={item} onClick={() => setPage(item)} className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all ${safePage === item ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-dark-600 hover:bg-gray-50'}`}>{item}</button>
                  )}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-all"><ChevronRight className="w-4 h-4 text-dark-600" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {detailCompany && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center shrink-0">
                  {detailCompany.logo_url ? <img src={detailCompany.logo_url} alt="" className="w-12 h-12 object-cover" /> : <Building2 className="w-6 h-6 text-gray-400" />}
                </div>
                <div>
                  <h2 className="font-bold text-dark-950 text-lg leading-tight">{detailCompany.name}</h2>
                  <p className="text-sm text-dark-500">{detailCompany.city}, {detailCompany.country}</p>
                </div>
                <span className={`ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${STATUS_STYLES[detailCompany.status]?.bg} ${STATUS_STYLES[detailCompany.status]?.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[detailCompany.status]?.dot}`} />{statusLabel(t, detailCompany.status)}
                </span>
              </div>
              <button onClick={() => setDetailCompany(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-dark-500" /></button>
            </div>

            <div className="flex border-b border-gray-100 shrink-0 bg-gray-50/50 overflow-x-auto">
              {([['overview', t('adminDash.companies.tabOverview')], ['vehicles', t('adminDash.companies.tabVehicles', { count: companyVehicles.length })], ['bookings', t('adminDash.companies.tabBookings', { count: companyBookings.length })], ['subscription', t('adminDash.companies.tabSubscription')]] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => setDetailTab(tab)} className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${detailTab === tab ? 'border-primary-600 text-primary-600 bg-white' : 'border-transparent text-dark-500 hover:text-dark-700'}`}>{label}</button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-primary-600 animate-spin" /></div>
              ) : detailTab === 'overview' ? <DetailOverview c={detailCompany} t={t} lang={i18n.language} />
                : detailTab === 'vehicles' ? <DetailVehicles vehicles={companyVehicles} t={t} />
                : detailTab === 'bookings' ? <DetailBookings bookings={companyBookings} t={t} lang={i18n.language} />
                : <DetailSubscription c={detailCompany} plans={plans} t={t} lang={i18n.language} onAssign={() => { setDetailCompany(null); setAssignPlanModal(detailCompany); setAssignPlanId(detailCompany.subscription_plan_id || ''); }} />}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
              <div className="flex gap-2">
                {detailCompany.status === 'pending' && <>
                  <button onClick={() => { updateStatus(detailCompany.id, 'approved'); setDetailCompany(null); }} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"><Check className="w-3.5 h-3.5" />{t('adminDash.companies.approve')}</button>
                  <button onClick={() => { setDetailCompany(null); setRejectModal(detailCompany); setRejectReason(''); }} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 transition-colors"><X className="w-3.5 h-3.5" />{t('adminDash.companies.reject')}</button>
                </>}
                {detailCompany.status === 'approved' && <button onClick={() => { updateStatus(detailCompany.id, 'suspended'); setDetailCompany(null); }} className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 text-sm font-semibold rounded-xl hover:bg-amber-100 transition-colors"><Ban className="w-3.5 h-3.5" />{t('adminDash.companies.suspend')}</button>}
                {(detailCompany.status === 'suspended' || detailCompany.status === 'rejected') && <button onClick={() => { updateStatus(detailCompany.id, 'approved'); setDetailCompany(null); }} className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 text-sm font-semibold rounded-xl hover:bg-green-100 transition-colors"><RotateCcw className="w-3.5 h-3.5" />{t('adminDash.companies.reactivate')}</button>}
              </div>
              <button onClick={() => setDetailCompany(null)} className="px-4 py-2 bg-gray-100 text-dark-600 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">{t('adminDash.companies.close')}</button>
            </div>
          </div>
        </div>
      )}

      {assignPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-dark-950">{t('adminDash.companies.assignPlanTitle')}</h3>
              <button onClick={() => setAssignPlanModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-dark-600">{t('adminDash.companies.companyLabel')} <span className="font-semibold text-dark-900">{assignPlanModal.name}</span></p>
              <div>
                <label className="block text-xs font-semibold text-dark-600 mb-2">{t('adminDash.companies.choosePlan')}</label>
                <div className="grid gap-2">
                  {plans.map(p => (
                    <label key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${assignPlanId === p.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="plan" value={p.id} checked={assignPlanId === p.id} onChange={() => setAssignPlanId(p.id)} className="sr-only" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-dark-900">{p.name}</p>
                        <p className="text-xs text-dark-400">{t('adminDash.companies.planDetails', { price: p.price_monthly, max: p.max_vehicles === -1 ? t('adminDash.companies.unlimited') : p.max_vehicles })}</p>
                      </div>
                      {assignPlanId === p.id && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-600 mb-2">{t('adminDash.companies.billingCycle')}</label>
                <div className="flex gap-2">
                  {([['monthly', t('adminDash.companies.billingMonthly')], ['yearly', t('adminDash.companies.billingYearly')]] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setAssignBilling(v)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${assignBilling === v ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-dark-600 hover:border-gray-300'}`}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setAssignPlanModal(null)} className="px-4 py-2 bg-gray-100 text-dark-600 text-sm font-semibold rounded-xl hover:bg-gray-200">{t('adminDash.common.cancel')}</button>
              <button onClick={assignPlan} disabled={!assignPlanId || assigning} className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {assigning && <Loader2 className="w-4 h-4 animate-spin" />}{t('adminDash.companies.assignBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-dark-950">{t('adminDash.companies.rejectModalTitle')}</h3>
              <button onClick={() => setRejectModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-dark-600">{t('adminDash.companies.companyLabel')} <span className="font-semibold text-dark-900">{rejectModal.name}</span></p>
              <div>
                <label className="block text-xs font-semibold text-dark-600 mb-2">{t('adminDash.companies.rejectReasonLabel')}</label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder={t('adminDash.companies.rejectReasonPlaceholder')} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none transition-all" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 bg-gray-100 text-dark-600 text-sm font-semibold rounded-xl hover:bg-gray-200">{t('adminDash.common.cancel')}</button>
              <button onClick={() => { updateStatus(rejectModal.id, 'rejected', rejectReason); setRejectModal(null); }} disabled={actionLoading === rejectModal.id} className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors">
                {actionLoading === rejectModal.id && <Loader2 className="w-4 h-4 animate-spin" />}{t('adminDash.companies.rejectCompanyBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function SortTh({ label, field, current, dir, onSort }: { label: string; field: string; current: string; dir: 'asc' | 'desc'; onSort: (f: 'name' | 'revenue' | 'created_at' | 'bookings') => void }) {
  return (
    <th className="text-right px-5 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">
      <button onClick={() => onSort(field as 'name' | 'revenue' | 'created_at' | 'bookings')} className="flex items-center gap-1 ml-auto hover:text-dark-700 transition-colors">
        {label}<ArrowUpDown className={`w-3 h-3 ${current === field ? 'text-primary-600' : 'text-dark-300'} ${dir === 'asc' ? 'rotate-180' : ''}`} />
      </button>
    </th>
  );
}

function StatCard({ icon, label, value, sub, bg, iconBg, highlight }: { icon: React.ReactNode; label: string; value: string | number; sub: string; bg: string; iconBg: string; highlight?: boolean }) {
  return (
    <div className={`${bg} rounded-2xl border ${highlight ? 'border-amber-200' : 'border-gray-100'} p-5`}>
      <div className="flex items-start gap-3">
        <div className={`${iconBg} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>{icon}</div>
        <div className="min-w-0">
          <p className={`text-xl font-bold ${highlight ? 'text-amber-700' : 'text-dark-950'} leading-tight`}>{value}</p>
          <p className="text-xs font-medium text-dark-600 mt-0.5 truncate">{label}</p>
          <p className="text-[11px] text-dark-400 mt-0.5">{sub}</p>
        </div>
      </div>
    </div>
  );
}

function DetailOverview({ c, t, lang }: { c: CompanyReport; t: TFunction; lang: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label={t('adminDash.companies.detailVehicles')} value={c.vehiclesCount} sub={t('adminDash.companies.detailVehiclesSub', { count: c.publishedVehicles })} color="text-blue-600" />
        <MiniStat label={t('adminDash.companies.detailBookings')} value={c.bookingsCount} sub={t('adminDash.companies.detailBookingsSub', { count: c.activeBookings })} color="text-primary-600" />
        <MiniStat label={t('adminDash.companies.detailRevenue')} value={`${c.revenue.toFixed(0)} €`} sub={t('adminDash.companies.detailRevenueSub', { amount: c.pendingRevenue.toFixed(0) })} color="text-green-600" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-dark-900 mb-3">{t('adminDash.companies.detailInfoTitle')}</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <InfoField icon={<Mail className="w-3.5 h-3.5" />} label={t('adminDash.companies.detailEmail')} value={c.email || '—'} />
          <InfoField icon={<Phone className="w-3.5 h-3.5" />} label={t('adminDash.companies.detailPhone')} value={c.phone || '—'} />
          <InfoField icon={<MapPin className="w-3.5 h-3.5" />} label={t('adminDash.companies.detailAddress')} value={`${c.address || '—'}, ${c.city}`} />
          <InfoField icon={<Hash className="w-3.5 h-3.5" />} label={t('adminDash.companies.detailLicense')} value={c.license_number || '—'} />
          <InfoField icon={<Star className="w-3.5 h-3.5" />} label={t('adminDash.companies.detailRating')} value={t('adminDash.companies.detailRatingValue', { rating: c.rating?.toFixed(1) || '0.0', count: c.total_reviews || 0 })} />
          <InfoField icon={<CalendarDays className="w-3.5 h-3.5" />} label={t('adminDash.companies.detailRegistered')} value={new Date(c.created_at).toLocaleDateString(localeFromI18n(lang), { year: 'numeric', month: 'long', day: 'numeric' })} />
          <InfoField icon={<MapPin className="w-3.5 h-3.5" />} label={t('adminDash.companies.detailGps')} value={c.latitude != null ? `${c.latitude.toFixed(5)}, ${c.longitude?.toFixed(5)}` : t('adminDash.companies.detailGpsNone')} />
          <InfoField icon={<TrendingUp className="w-3.5 h-3.5" />} label={t('adminDash.companies.detailCancellations')} value={String(c.cancelledBookings)} />
        </div>
      </div>
      {c.description && (
        <div>
          <h4 className="text-sm font-bold text-dark-900 mb-2">{t('adminDash.companies.detailDescription')}</h4>
          <p className="text-sm text-dark-600 bg-gray-50 rounded-xl p-3 leading-relaxed">{c.description}</p>
        </div>
      )}
    </div>
  );
}

function DetailVehicles({ vehicles, t }: { vehicles: CompanyVehicle[]; t: TFunction }) {
  if (vehicles.length === 0) return <div className="text-center py-12 text-dark-400 text-sm">{t('adminDash.companies.vehiclesEmpty')}</div>;
  return (
    <div className="space-y-2">
      {vehicles.map(v => (
        <div key={v.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className="w-14 h-10 rounded-lg bg-gray-200 overflow-hidden shrink-0">
            {v.main_image_url ? <img src={v.main_image_url} alt="" className="w-14 h-10 object-cover" /> : <Car className="w-4 h-4 text-gray-400 mx-auto mt-3" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-dark-900">{v.brand} {v.model} <span className="text-dark-400 font-normal">({v.year})</span></p>
            <p className="text-[11px] text-dark-400">{v.category} · {v.transmission} · {v.fuel_type}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-dark-900">{t('adminDash.companies.vehiclePerDay', { price: v.price_per_day })}</p>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${v.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{v.is_published ? t('adminDash.companies.vehiclePublished') : t('adminDash.companies.vehicleDraft')}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${v.is_available ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{v.is_available ? t('adminDash.companies.vehicleAvailable') : t('adminDash.companies.vehicleBusy')}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailBookings({ bookings, t, lang }: { bookings: Booking[]; t: TFunction; lang: string }) {
  const SC: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700', active: 'bg-green-100 text-green-700', completed: 'bg-gray-100 text-gray-600', cancelled: 'bg-red-100 text-red-700' };
  if (bookings.length === 0) return <div className="text-center py-12 text-dark-400 text-sm">{t('adminDash.companies.bookingsEmpty')}</div>;
  return (
    <div className="space-y-2">
      {bookings.map(b => (
        <div key={b.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-dark-900">{b.client_name}</p>
            <p className="text-[11px] text-dark-400">{t('adminDash.companies.bookingsRange', { from: new Date(b.pickup_date).toLocaleDateString(localeFromI18n(lang)), to: new Date(b.return_date).toLocaleDateString(localeFromI18n(lang)), days: b.total_days })}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SC[b.status] || 'bg-gray-100 text-gray-600'}`}>{(() => { const k = `adminDash.statusBooking.${b.status}`; const v = t(k); return v === k ? b.status : v; })()}</span>
            <span className="text-sm font-bold text-dark-900">{b.total_price} EUR</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailSubscription({ c, plans, t, lang, onAssign }: { c: CompanyReport; plans: SubscriptionPlan[]; t: TFunction; lang: string; onAssign: () => void }) {
  const plan = c.plan;
  const subColor = SUB_STYLES[c.subscription_status] || SUB_STYLES.inactive;
  const daysLeft = c.subscription_expires_at ? Math.ceil((new Date(c.subscription_expires_at).getTime() - Date.now()) / 86400000) : null;
  return (
    <div className="space-y-5">
      <div className={`p-4 rounded-2xl border-2 ${plan ? 'border-primary-200 bg-primary-50' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-lg font-bold text-dark-950">{c.planName}</p>
            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${subColor}`}>{subLabel(t, c.subscription_status)}</span>
          </div>
          <Shield className={`w-8 h-8 ${plan ? 'text-primary-500' : 'text-gray-300'}`} />
        </div>
        {plan && (
          <div className="grid grid-cols-2 gap-2 text-sm mt-3">
            <div className="bg-white/60 rounded-lg px-3 py-2"><p className="text-xs text-dark-400">{t('adminDash.companies.subMaxVehicles')}</p><p className="font-bold text-dark-900">{plan.max_vehicles === -1 ? t('adminDash.companies.subUnlimited') : plan.max_vehicles}</p></div>
            <div className="bg-white/60 rounded-lg px-3 py-2"><p className="text-xs text-dark-400">{t('adminDash.companies.subMaxBookings')}</p><p className="font-bold text-dark-900">{plan.max_bookings_monthly === -1 ? t('adminDash.companies.subUnlimited') : plan.max_bookings_monthly}</p></div>
            <div className="bg-white/60 rounded-lg px-3 py-2"><p className="text-xs text-dark-400">{t('adminDash.companies.subMonthlyPrice')}</p><p className="font-bold text-dark-900">{plan.price_monthly} EUR</p></div>
            <div className="bg-white/60 rounded-lg px-3 py-2"><p className="text-xs text-dark-400">{t('adminDash.companies.subExpires')}</p><p className={`font-bold ${daysLeft !== null && daysLeft <= 7 ? 'text-red-600' : 'text-dark-900'}`}>{c.subscription_expires_at ? new Date(c.subscription_expires_at).toLocaleDateString(localeFromI18n(lang)) : '—'}{daysLeft !== null && daysLeft >= 0 && <span className="ml-1 text-xs font-normal">{t('adminDash.companies.subExpiresDays', { days: daysLeft })}</span>}</p></div>
          </div>
        )}
      </div>
      <button onClick={onAssign} className="w-full py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2">
        <CreditCard className="w-4 h-4" />{t('adminDash.companies.subChangeOrAssign')}
      </button>
      <div>
        <h4 className="text-sm font-bold text-dark-900 mb-3">{t('adminDash.companies.subAvailablePlans')}</h4>
        <div className="space-y-2">
          {plans.map(p => (
            <div key={p.id} className={`p-3 rounded-xl border ${c.subscription_plan_id === p.id ? 'border-primary-300 bg-primary-50' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-semibold text-dark-900">{p.name}</p><p className="text-xs text-dark-400">{t('adminDash.companies.subPlanDetails', { price: p.price_monthly, max: p.max_vehicles === -1 ? t('adminDash.companies.unlimited') : p.max_vehicles })}</p></div>
                {c.subscription_plan_id === p.id && <span className="text-[10px] font-bold px-2 py-1 bg-primary-600 text-white rounded-lg">{t('adminDash.companies.subActiveLabel')}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs font-semibold text-dark-700 mt-0.5">{label}</p>
      <p className="text-[11px] text-dark-400 mt-0.5">{sub}</p>
    </div>
  );
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-dark-400">{icon}</span>
        <p className="text-[10px] font-semibold text-dark-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-sm text-dark-800 font-medium pl-5">{value}</p>
    </div>
  );
}
