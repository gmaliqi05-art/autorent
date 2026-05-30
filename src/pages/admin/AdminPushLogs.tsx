import { useState, useEffect } from 'react';
import { Bell, Loader2, CheckCircle2, XCircle, AlertTriangle, Slash, Ban, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import { format } from 'date-fns';

interface PushLog {
  id: string;
  user_id: string | null;
  notification_id: string | null;
  status: 'sent' | 'partial' | 'failed' | 'no_subscriptions' | 'push_disabled' | 'no_vapid';
  subscriptions_total: number;
  sent_count: number;
  expired_count: number;
  error_message: string | null;
  created_at: string;
  profile?: { full_name: string | null; email: string | null } | null;
}

const ITEMS_PER_PAGE = 25;

const STATUS_CONFIG: Record<PushLog['status'], { label: string; color: string; icon: React.ReactNode }> = {
  sent: { label: 'Sent', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  partial: { label: 'Partial', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <AlertTriangle className="w-3 h-3" /> },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle className="w-3 h-3" /> },
  no_subscriptions: { label: 'No subs', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <Slash className="w-3 h-3" /> },
  push_disabled: { label: 'Push off', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Ban className="w-3 h-3" /> },
  no_vapid: { label: 'No VAPID', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle className="w-3 h-3" /> },
};

export default function AdminPushLogs() {
  const [logs, setLogs] = useState<PushLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => { void loadLogs(); }, [statusFilter, page]);
  useEffect(() => { void loadCounts(); }, []);

  async function loadCounts() {
    // Count per status (last 7 days) — perdor 6 thirrje per status, ne paralele
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const statuses: PushLog['status'][] = ['sent', 'partial', 'failed', 'no_subscriptions', 'push_disabled', 'no_vapid'];
    const results = await Promise.all(
      statuses.map(s =>
        supabase.from('push_send_log').select('id', { count: 'exact', head: true }).eq('status', s).gte('created_at', since),
      ),
    );
    const next: Record<string, number> = {};
    statuses.forEach((s, i) => { next[s] = results[i].count ?? 0; });
    setCounts(next);
  }

  async function loadLogs() {
    setLoading(true);
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    let query = supabase
      .from('push_send_log')
      .select('id, user_id, notification_id, status, subscriptions_total, sent_count, expired_count, error_message, created_at')
      .order('created_at', { ascending: false })
      .range(from, to);
    if (statusFilter) query = query.eq('status', statusFilter);
    const { data } = await query;

    const rows = (data || []) as PushLog[];

    // Lookup profiles per user_id
    const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean))) as string[];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.id as string, { full_name: p.full_name, email: p.email }]));
      rows.forEach(r => { if (r.user_id) r.profile = profileMap.get(r.user_id) || null; });
    }

    setLogs(rows);
    setLoading(false);
  }

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const failureRate = totalCount > 0 ? Math.round(((counts.failed + counts.partial) / totalCount) * 100) : 0;

  return (
    <DashboardLayout navItems={adminNavItems} navGroups={adminNavGroups} title="Push Notification Logs">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary-600" />
              Push Notification Logs
            </h1>
            <p className="text-sm text-dark-500 mt-1">Historiku i te gjitha push notifications dergesa (7 ditet e fundit).</p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total (7d)" value={totalCount} />
          <StatCard label="Sent" value={counts.sent ?? 0} color="text-green-700" />
          <StatCard label="Failed + Partial" value={(counts.failed ?? 0) + (counts.partial ?? 0)} color="text-red-700" />
          <StatCard label="Failure rate" value={`${failureRate}%`} color={failureRate > 5 ? 'text-red-700' : 'text-dark-900'} />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          <FilterChip active={!statusFilter} onClick={() => { setStatusFilter(''); setPage(1); }}>Te gjitha</FilterChip>
          {(Object.keys(STATUS_CONFIG) as PushLog['status'][]).map(s => (
            <FilterChip key={s} active={statusFilter === s} onClick={() => { setStatusFilter(s); setPage(1); }}>
              {STATUS_CONFIG[s].label} {counts[s] !== undefined && <span className="ml-1 opacity-60">({counts[s]})</span>}
            </FilterChip>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-dark-500">Asnje log per filtrin e zgjedhur.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <Th>Koha</Th>
                    <Th>User</Th>
                    <Th>Status</Th>
                    <Th className="text-center">Subs</Th>
                    <Th className="text-center">Sent</Th>
                    <Th className="text-center">Expired</Th>
                    <Th>Error</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map(log => {
                    const cfg = STATUS_CONFIG[log.status];
                    return (
                      <tr key={log.id} className="hover:bg-gray-50/50">
                        <Td>{format(new Date(log.created_at), 'dd/MM HH:mm:ss')}</Td>
                        <Td>
                          {log.profile ? (
                            <div>
                              <div className="font-medium text-dark-900">{log.profile.full_name || '—'}</div>
                              <div className="text-xs text-dark-500">{log.profile.email}</div>
                            </div>
                          ) : (
                            <span className="text-dark-400 text-xs">{log.user_id?.slice(0, 8) || '—'}</span>
                          )}
                        </Td>
                        <Td>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.color}`}>
                            {cfg.icon}
                            {cfg.label}
                          </span>
                        </Td>
                        <Td className="text-center text-dark-700">{log.subscriptions_total}</Td>
                        <Td className="text-center text-green-700 font-medium">{log.sent_count}</Td>
                        <Td className="text-center text-orange-700">{log.expired_count || '—'}</Td>
                        <Td className="text-xs text-red-700 max-w-xs truncate">{log.error_message || '—'}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-500">Faqe {page}</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" /> Mbrapa
              </button>
              <button
                type="button"
                disabled={logs.length < ITEMS_PER_PAGE}
                onClick={() => setPage(p => p + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
              >
                Para <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, color = 'text-dark-900' }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="text-xs font-medium text-dark-500 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
        active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-dark-600 border-gray-200 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider ${className}`}>{children}</th>;
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm ${className}`}>{children}</td>;
}
