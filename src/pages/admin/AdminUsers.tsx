import { useState, useEffect } from 'react';
import {
  Users, Loader2, Search, Mail, Phone, ChevronLeft, ChevronRight,
  AlertCircle, Download, X, DollarSign, CalendarDays,
  Car, Eye, Building2, CheckCircle, AlertTriangle, UserCheck,
  UserX, ArrowUpDown, ShieldAlert, Clock, TrendingUp, Hash,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Profile, Booking, Company } from '../../lib/types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { useAuth } from '../../contexts/AuthContext';
import { exportToCSV } from '../../lib/csvExport';

const ITEMS_PER_PAGE = 15;

const ROLE_META: Record<string, { label: string; color: string }> = {
  client:       { label: 'Klient',    color: 'bg-blue-100 text-blue-700' },
  company_admin:{ label: 'Kompani',   color: 'bg-amber-100 text-amber-700' },
  super_admin:  { label: 'Admin',     color: 'bg-red-100 text-red-700' },
};

const ROLE_OPTIONS: { value: Profile['role']; label: string }[] = [
  { value: 'client', label: 'Klient' },
  { value: 'company_admin', label: 'Kompani' },
  { value: 'super_admin', label: 'Super Admin' },
];

interface UserReport extends Profile {
  bookingsCount: number;
  totalSpent: number;
  companyName: string | null;
  lastBookingDate: string | null;
  completedBookings: number;
  cancelledBookings: number;
}

export default function AdminUsers() {
  const { profile: currentUser } = useAuth();
  const [users, setUsers] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'bookings' | 'spent'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserReport | null>(null);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'bookings' | 'activity'>('info');

  const isSuperAdmin = currentUser?.role === 'super_admin';

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter, sortBy, sortDir]);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    const [profilesRes, bookingsRes, companiesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('bookings').select('id, client_id, total_price, created_at, status, payment_status'),
      supabase.from('companies').select('id, owner_id, name, status'),
    ]);
    if (profilesRes.error) { setError('Gabim: ' + profilesRes.error.message); setLoading(false); return; }
    const profiles = (profilesRes.data || []) as Profile[];
    const bookings = (bookingsRes.data || []) as Booking[];
    const companies = (companiesRes.data || []) as Company[];
    const enriched: UserReport[] = profiles.map(p => {
      const ub = bookings.filter(b => b.client_id === p.id);
      const company = companies.find(c => c.owner_id === p.id);
      const sorted = [...ub].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return {
        ...p,
        bookingsCount: ub.length,
        totalSpent: ub.filter(b => b.status === 'completed' || b.payment_status === 'paid').reduce((s, b) => s + Number(b.total_price), 0),
        companyName: company?.name || null,
        lastBookingDate: sorted[0]?.created_at || null,
        completedBookings: ub.filter(b => b.status === 'completed').length,
        cancelledBookings: ub.filter(b => b.status === 'cancelled').length,
      };
    });
    setUsers(enriched);
    setLoading(false);
  }

  async function openUserDetail(user: UserReport) {
    setSelectedUser(user);
    setDetailTab('info');
    setLoadingDetail(true);
    const { data } = await supabase.from('bookings').select('*').eq('client_id', user.id).order('created_at', { ascending: false }).limit(30);
    setUserBookings((data || []) as Booking[]);
    setLoadingDetail(false);
  }

  async function toggleActive(user: UserReport) {
    setUpdatingId(user.id);
    const { error: err } = await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id);
    if (err) { setError('Gabim: ' + err.message); setUpdatingId(null); return; }
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    if (selectedUser?.id === user.id) setSelectedUser(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
    setFeedback({ msg: 'Statusi u ndryshua me sukses!', type: 'ok' });
    setTimeout(() => setFeedback(null), 3000);
    setUpdatingId(null);
  }

  async function changeRole(user: UserReport, newRole: Profile['role']) {
    if (newRole === user.role) return;
    setUpdatingId(user.id);
    const { error: err } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
    if (err) { setError('Gabim: ' + err.message); setUpdatingId(null); return; }
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    if (selectedUser?.id === user.id) setSelectedUser(prev => prev ? { ...prev, role: newRole } : null);
    setFeedback({ msg: `Roli u ndryshua ne "${ROLE_META[newRole]?.label}"!`, type: 'ok' });
    setTimeout(() => setFeedback(null), 3000);
    setUpdatingId(null);
  }

  function handleExport() {
    const data = filtered.map(u => ({
      Emri: u.full_name, Email: u.email, Telefoni: u.phone || '-',
      Roli: ROLE_META[u.role]?.label || u.role, Kompania: u.companyName || '-',
      Rezervime: u.bookingsCount, Perfunduar: u.completedBookings, Anuluar: u.cancelledBookings,
      'Shpenzuar EUR': u.totalSpent.toFixed(0), Statusi: u.is_active ? 'Aktiv' : 'Joaktiv',
      Regjistruar: new Date(u.created_at).toLocaleDateString('sq-AL'),
    }));
    exportToCSV(data, 'perdoruesit');
  }

  function toggleSort(field: typeof sortBy) {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  }

  let filtered = [...users];
  if (roleFilter) filtered = filtered.filter(u => u.role === roleFilter);
  if (statusFilter === 'active') filtered = filtered.filter(u => u.is_active);
  if (statusFilter === 'inactive') filtered = filtered.filter(u => !u.is_active);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(u => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.companyName && u.companyName.toLowerCase().includes(q)) || (u.phone && u.phone.includes(q)));
  }
  filtered.sort((a, b) => {
    let av: number | string = a.created_at, bv: number | string = b.created_at;
    if (sortBy === 'name') { av = a.full_name; bv = b.full_name; }
    else if (sortBy === 'bookings') { av = a.bookingsCount; bv = b.bookingsCount; }
    else if (sortBy === 'spent') { av = a.totalSpent; bv = b.totalSpent; }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const clientCount = users.filter(u => u.role === 'client').length;
  const companyCount = users.filter(u => u.role === 'company_admin').length;
  const activeCount = users.filter(u => u.is_active).length;
  const newThisMonth = users.filter(u => { const d = new Date(u.created_at); const n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth(); }).length;

  return (
    <DashboardLayout title="Perdoruesit" navItems={adminNavItems} navGroups={adminNavGroups}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-950">Menaxhimi i perdoruesve</h1>
          <p className="text-dark-500 mt-1 text-[15px]">Shikoni dhe menaxhoni te gjithe perdoruesit e platformes</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 text-primary-700 text-sm font-semibold rounded-xl hover:bg-primary-100 transition-colors shrink-0">
          <Download className="w-4 h-4" />Exporto CSV
        </button>
      </div>

      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm font-medium border ${feedback.type === 'ok' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {feedback.type === 'ok' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {feedback.msg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon={<Users className="w-5 h-5 text-dark-600" />} label="Gjithsej" value={users.length} bg="bg-white" iconBg="bg-gray-100" />
        <StatCard icon={<Car className="w-5 h-5 text-blue-600" />} label="Kliente" value={clientCount} bg="bg-blue-50" iconBg="bg-blue-100" />
        <StatCard icon={<Building2 className="w-5 h-5 text-amber-600" />} label="Kompani" value={companyCount} bg="bg-amber-50" iconBg="bg-amber-100" />
        <StatCard icon={<UserCheck className="w-5 h-5 text-green-600" />} label="Aktive" value={activeCount} bg="bg-green-50" iconBg="bg-green-100" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-primary-600" />} label="Kete muaj" value={newThisMonth} bg="bg-primary-50" iconBg="bg-primary-100" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Kerko emrin, email, nr. telefoni, kompani..." className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as '' | 'active' | 'inactive')} className="px-3 py-2 text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl text-dark-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
              <option value="">Cdo status</option>
              <option value="active">Aktiv</option>
              <option value="inactive">Joaktiv</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[['', 'Te gjitha', users.length], ['client', 'Kliente', clientCount], ['company_admin', 'Kompani', companyCount], ['super_admin', 'Admin', users.filter(u => u.role === 'super_admin').length]].map(([v, l, count]) => (
              <button key={String(v)} onClick={() => setRoleFilter(String(v))} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${roleFilter === v ? 'bg-primary-600 text-white' : 'bg-gray-100 text-dark-600 hover:bg-gray-200'}`}>
                {l}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${roleFilter === v ? 'bg-white/20 text-white' : 'bg-white text-dark-500'}`}>{count}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="w-7 h-7 text-primary-600 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-dark-600 font-medium">Nuk u gjenden perdorues</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <SortTh label="Perdoruesi" field="name" current={sortBy} dir={sortDir} onSort={toggleSort} align="left" />
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Kontakti</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Roli</th>
                    <SortTh label="Rezervime" field="bookings" current={sortBy} dir={sortDir} onSort={toggleSort} align="right" />
                    <SortTh label="Shpenzuar" field="spent" current={sortBy} dir={sortDir} onSort={toggleSort} align="right" />
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Statusi</th>
                    <SortTh label="Regjistruar" field="created_at" current={sortBy} dir={sortDir} onSort={toggleSort} align="right" />
                    <th className="text-center px-5 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Veprime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(u => {
                    const r = ROLE_META[u.role] || ROLE_META.client;
                    const isUpd = updatingId === u.id;
                    return (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                              {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-dark-900 truncate">{u.full_name}</p>
                              {u.companyName && <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1 truncate"><Building2 className="w-3 h-3 shrink-0" />{u.companyName}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs text-dark-500"><Mail className="w-3 h-3 text-dark-400 shrink-0" /><span className="truncate max-w-[160px]">{u.email}</span></div>
                            {u.phone && <div className="flex items-center gap-1.5 text-xs text-dark-400"><Phone className="w-3 h-3 shrink-0" />{u.phone}</div>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {isSuperAdmin ? (
                            <select value={u.role} disabled={isUpd} onChange={e => changeRole(u, e.target.value as Profile['role'])} className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border-0 cursor-pointer focus:ring-2 focus:ring-primary-500/20 ${r.color} ${isUpd ? 'opacity-50' : ''}`}>
                              {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          ) : (
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold ${r.color}`}>{r.label}</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm font-bold text-dark-900">{u.bookingsCount}</span>
                          {u.cancelledBookings > 0 && <><br /><span className="text-[11px] text-red-500">{u.cancelledBookings} anuluar</span></>}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm font-bold text-dark-900">{u.totalSpent.toFixed(0)} EUR</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => toggleActive(u)} disabled={isUpd} className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all ${u.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'} ${isUpd ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                            {isUpd ? <Loader2 className="w-3 h-3 animate-spin inline" /> : u.is_active ? 'Aktiv' : 'Joaktiv'}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right text-xs text-dark-500">{new Date(u.created_at).toLocaleDateString('sq-AL')}</td>
                        <td className="px-5 py-3.5 text-center">
                          <button onClick={() => openUserDetail(u)} className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all" title="Shiko detajet"><Eye className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                <p className="text-sm text-dark-500">{(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} nga {filtered.length}</p>
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

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-lg font-bold text-white shrink-0">
                  {selectedUser.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-dark-950 text-lg leading-tight">{selectedUser.full_name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${ROLE_META[selectedUser.role]?.color}`}>{ROLE_META[selectedUser.role]?.label}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${selectedUser.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{selectedUser.is_active ? 'Aktiv' : 'Joaktiv'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 text-dark-400 hover:text-dark-600 hover:bg-gray-100 rounded-lg transition-all"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex border-b border-gray-100 shrink-0 bg-gray-50/50">
              {([['info', 'Informacioni'], ['bookings', `Rezervimet (${userBookings.length})`], ['activity', 'Aktiviteti']] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => setDetailTab(tab)} className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${detailTab === tab ? 'border-primary-600 text-primary-600 bg-white' : 'border-transparent text-dark-500 hover:text-dark-700'}`}>{label}</button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-primary-600 animate-spin" /></div>
              ) : detailTab === 'info' ? (
                <UserDetailInfo user={selectedUser} />
              ) : detailTab === 'bookings' ? (
                <UserDetailBookings bookings={userBookings} />
              ) : (
                <UserDetailActivity user={selectedUser} bookings={userBookings} />
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
              <div className="flex gap-2">
                {isSuperAdmin && (
                  <button onClick={() => toggleActive(selectedUser)} disabled={updatingId === selectedUser.id} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${selectedUser.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                    {updatingId === selectedUser.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : selectedUser.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    {selectedUser.is_active ? 'Deaktivizo' : 'Aktivizo'}
                  </button>
                )}
                {isSuperAdmin && selectedUser.role !== 'super_admin' && (
                  <select value={selectedUser.role} disabled={updatingId === selectedUser.id} onChange={e => changeRole(selectedUser, e.target.value as Profile['role'])} className="px-3 py-2 bg-gray-100 text-dark-700 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-200 transition-colors cursor-pointer">
                    {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                )}
              </div>
              <button onClick={() => setSelectedUser(null)} className="px-4 py-2 bg-gray-100 text-dark-600 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">Mbyll</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function UserDetailInfo({ user }: { user: UserReport }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Rezervime" value={user.bookingsCount} color="text-primary-600" />
        <MiniStat label="Perfunduar" value={user.completedBookings} color="text-green-600" />
        <MiniStat label="Anuluar" value={user.cancelledBookings} color="text-red-500" />
        <MiniStat label="EUR shpenzuar" value={user.totalSpent.toFixed(0)} color="text-dark-900" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-dark-900 mb-3">Te dhenat personale</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <InfoField icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={user.email} />
          <InfoField icon={<Phone className="w-3.5 h-3.5" />} label="Telefoni" value={user.phone || '—'} />
          <InfoField icon={<CalendarDays className="w-3.5 h-3.5" />} label="Regjistruar" value={new Date(user.created_at).toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric' })} />
          <InfoField icon={<Clock className="w-3.5 h-3.5" />} label="Rez. i fundit" value={user.lastBookingDate ? new Date(user.lastBookingDate).toLocaleDateString('sq-AL') : 'Nuk ka'} />
          {user.companyName && <InfoField icon={<Building2 className="w-3.5 h-3.5" />} label="Kompania" value={user.companyName} />}
          <InfoField icon={<Hash className="w-3.5 h-3.5" />} label="ID" value={user.id.slice(0, 20) + '...'} />
        </div>
      </div>
    </div>
  );
}

function UserDetailBookings({ bookings }: { bookings: Booking[] }) {
  const SC: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700', active: 'bg-green-100 text-green-700', completed: 'bg-gray-100 text-gray-600', cancelled: 'bg-red-100 text-red-700' };
  const SN: Record<string, string> = { pending: 'Ne pritje', confirmed: 'Konfirmuar', active: 'Aktiv', completed: 'Perfunduar', cancelled: 'Anuluar' };
  if (bookings.length === 0) return <div className="text-center py-12 text-dark-400 text-sm">Nuk ka rezervime.</div>;
  return (
    <div className="space-y-2">
      {bookings.map(b => (
        <div key={b.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-dark-900">{new Date(b.pickup_date).toLocaleDateString('sq-AL')} → {new Date(b.return_date).toLocaleDateString('sq-AL')}</p>
            <p className="text-[11px] text-dark-400">{b.total_days} dite · {b.pickup_location}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SC[b.status] || 'bg-gray-100 text-gray-600'}`}>{SN[b.status] || b.status}</span>
            <span className="text-sm font-bold text-dark-900">{b.total_price} EUR</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function UserDetailActivity({ user, bookings }: { user: UserReport; bookings: Booking[] }) {
  const totalRevenue = bookings.filter(b => b.status === 'completed' || b.payment_status === 'paid').reduce((s, b) => s + Number(b.total_price), 0);
  const avgValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;
  const uniqueCompanies = new Set(bookings.map(b => b.company_id)).size;
  const lastActivity = bookings.length > 0 ? new Date(bookings[0].created_at).toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Nuk ka aktivitet';
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-dark-400 mb-1">Shpenzimi total</p><p className="text-xl font-bold text-dark-950">{user.totalSpent.toFixed(0)} EUR</p></div>
        <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-dark-400 mb-1">Mesatare/rezervim</p><p className="text-xl font-bold text-dark-950">{avgValue.toFixed(0)} EUR</p></div>
        <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-dark-400 mb-1">Kompani te ndryshme</p><p className="text-xl font-bold text-dark-950">{uniqueCompanies}</p></div>
        <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-dark-400 mb-1">Aktiviteti i fundit</p><p className="text-sm font-semibold text-dark-950">{lastActivity}</p></div>
      </div>
      <div className="space-y-3">
        <ProgressBar label="Shkalla e perfundimit" value={user.bookingsCount > 0 ? (user.completedBookings / user.bookingsCount) * 100 : 0} color="bg-green-500" />
        <ProgressBar label="Shkalla e anulimit" value={user.bookingsCount > 0 ? (user.cancelledBookings / user.bookingsCount) * 100 : 0} color="bg-red-400" />
      </div>
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-dark-500">{label}</span>
        <span className="font-semibold text-dark-900">{value.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SortTh({ label, field, current, dir, onSort, align }: { label: string; field: string; current: string; dir: 'asc' | 'desc'; onSort: (f: 'name' | 'created_at' | 'bookings' | 'spent') => void; align: 'left' | 'right' }) {
  return (
    <th className={`text-${align} px-5 py-3 text-[11px] font-semibold text-dark-400 uppercase tracking-wider`}>
      <button onClick={() => onSort(field as 'name' | 'created_at' | 'bookings' | 'spent')} className={`flex items-center gap-1 ${align === 'right' ? 'ml-auto' : ''} hover:text-dark-700 transition-colors`}>
        {label}<ArrowUpDown className={`w-3 h-3 ${current === field ? 'text-primary-600' : 'text-dark-300'}`} />
      </button>
    </th>
  );
}

function StatCard({ icon, label, value, bg, iconBg }: { icon: React.ReactNode; label: string; value: number; bg: string; iconBg: string }) {
  return (
    <div className={`${bg} rounded-2xl border border-gray-100 p-4`}>
      <div className={`${iconBg} w-9 h-9 rounded-lg flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-xl font-bold text-dark-950">{value}</p>
      <p className="text-xs text-dark-500 mt-0.5">{label}</p>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-dark-500 mt-0.5">{label}</p>
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
      <p className="text-sm text-dark-800 font-medium pl-5 break-all">{value}</p>
    </div>
  );
}
