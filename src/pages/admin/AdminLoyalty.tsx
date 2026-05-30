import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Users, TrendingUp, ArrowDownCircle, Search, Loader2, Gift, Award } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminNavItems, adminNavGroups } from '../../lib/adminNav';
import type { LoyaltyTransaction, LoyaltyTransactionType, Referral } from '../../lib/types';

interface TopReferrerRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  referral_code: string | null;
  total_referrals: number;
  rewarded_referrals: number;
}

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface TxWithUser extends LoyaltyTransaction {
  profile?: UserRow | null;
}

const txTypeBadges: Record<LoyaltyTransactionType, { label: string; cls: string }> = {
  booking_earned: { label: 'Booking', cls: 'bg-blue-50 text-blue-700' },
  referral_bonus: { label: 'Referim', cls: 'bg-purple-50 text-purple-700' },
  welcome_bonus: { label: 'Mirëseardhje', cls: 'bg-green-50 text-green-700' },
  redeemed: { label: 'Përdorur', cls: 'bg-amber-50 text-amber-700' },
  admin_adjustment: { label: 'Rregullim', cls: 'bg-gray-100 text-gray-700' },
  expired: { label: 'Skaduar', cls: 'bg-red-50 text-red-700' },
};

const referralStatusColors: Record<Referral['status'], string> = {
  pending: 'bg-amber-50 text-amber-700',
  qualified: 'bg-blue-50 text-blue-700',
  rewarded: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-50 text-gray-500',
};

export default function AdminLoyalty() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    totalEarned: 0,
    totalRedeemed: 0,
    activeReferrals: 0,
    rewardedReferrals: 0,
  });
  const [topReferrers, setTopReferrers] = useState<TopReferrerRow[]>([]);
  const [transactions, setTransactions] = useState<TxWithUser[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUserId, setFoundUserId] = useState<string | null>(null);
  const [userTransactions, setUserTransactions] = useState<LoyaltyTransaction[]>([]);
  const [userReferrals, setUserReferrals] = useState<Referral[]>([]);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [searching, setSearching] = useState(false);

  const loadGlobalStats = useCallback(async () => {
    const [earnedRes, redeemedRes, refRes] = await Promise.all([
      supabase.from('loyalty_transactions').select('points').gt('points', 0),
      supabase.from('loyalty_transactions').select('points').lt('points', 0),
      supabase.from('referrals').select('status'),
    ]);
    const totalEarned = (earnedRes.data || []).reduce((s: number, t: { points: number }) => s + Number(t.points || 0), 0);
    const totalRedeemed = Math.abs((redeemedRes.data || []).reduce((s: number, t: { points: number }) => s + Number(t.points || 0), 0));
    const refs = (refRes.data || []) as { status: Referral['status'] }[];
    setGlobalStats({
      totalEarned,
      totalRedeemed,
      activeReferrals: refs.filter(r => r.status === 'pending' || r.status === 'qualified').length,
      rewardedReferrals: refs.filter(r => r.status === 'rewarded').length,
    });
  }, []);

  const loadTopReferrers = useCallback(async () => {
    // Aggregimi nuk eshte i mire ne PostgREST direkt, perdor RPC ose dy queries.
    const { data: refs } = await supabase
      .from('referrals')
      .select('referrer_id, status');
    const byUser: Record<string, { total: number; rewarded: number }> = {};
    (refs || []).forEach((r: { referrer_id: string; status: Referral['status'] }) => {
      if (!byUser[r.referrer_id]) byUser[r.referrer_id] = { total: 0, rewarded: 0 };
      byUser[r.referrer_id].total++;
      if (r.status === 'rewarded') byUser[r.referrer_id].rewarded++;
    });
    const userIds = Object.keys(byUser).sort((a, b) => byUser[b].rewarded - byUser[a].rewarded).slice(0, 10);
    if (userIds.length === 0) {
      setTopReferrers([]);
      return;
    }
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, referral_code')
      .in('id', userIds);
    const rows: TopReferrerRow[] = userIds.map(uid => {
      const p = (profiles || []).find((x: { id: string }) => x.id === uid) as { id: string; full_name: string | null; email: string | null; referral_code: string | null } | undefined;
      return {
        user_id: uid,
        full_name: p?.full_name || null,
        email: p?.email || null,
        referral_code: p?.referral_code || null,
        total_referrals: byUser[uid].total,
        rewarded_referrals: byUser[uid].rewarded,
      };
    });
    setTopReferrers(rows);
  }, []);

  const loadRecentTransactions = useCallback(async () => {
    const { data } = await supabase
      .from('loyalty_transactions')
      .select('*, profile:user_id(id, full_name, email)')
      .order('created_at', { ascending: false })
      .limit(50);
    setTransactions((data || []) as TxWithUser[]);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadGlobalStats(), loadTopReferrers(), loadRecentTransactions()]);
      setLoading(false);
    })();
  }, [loadGlobalStats, loadTopReferrers, loadRecentTransactions]);

  async function handleSearch() {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setFoundUserId(null);
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', searchEmail.trim().toLowerCase())
      .maybeSingle();
    if (!profile) {
      setSearching(false);
      return;
    }
    setFoundUserId(profile.id);
    const [balRes, txRes, refRes] = await Promise.all([
      supabase.from('user_loyalty_balance').select('total_points').eq('user_id', profile.id).maybeSingle(),
      supabase.from('loyalty_transactions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('referrals').select('*').eq('referrer_id', profile.id).order('created_at', { ascending: false }),
    ]);
    setUserBalance(Number(balRes.data?.total_points || 0));
    setUserTransactions((txRes.data || []) as LoyaltyTransaction[]);
    setUserReferrals((refRes.data || []) as Referral[]);
    setSearching(false);
  }

  if (loading) {
    return (
      <DashboardLayout title="Admin" navItems={adminNavItems} navGroups={adminNavGroups}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 text-primary-500 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin" navItems={adminNavItems} navGroups={adminNavGroups}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-950">{t('adminLoyalty.title', 'Programi i besnikërisë')}</h1>
        <p className="text-dark-500 mt-1 text-[15px]">
          {t('adminLoyalty.subtitle', 'Pikë, referime, dhe statistika globale.')}
        </p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-green-600" />}
          bg="bg-green-50"
          value={globalStats.totalEarned.toLocaleString()}
          label={t('adminLoyalty.totalEarned', 'Pikë te fituara')}
        />
        <StatCard
          icon={<ArrowDownCircle className="w-5 h-5 text-amber-600" />}
          bg="bg-amber-50"
          value={globalStats.totalRedeemed.toLocaleString()}
          label={t('adminLoyalty.totalRedeemed', 'Pikë te perdorura')}
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-600" />}
          bg="bg-blue-50"
          value={globalStats.activeReferrals}
          label={t('adminLoyalty.activeReferrals', 'Referime ne pritje')}
        />
        <StatCard
          icon={<Award className="w-5 h-5 text-purple-600" />}
          bg="bg-purple-50"
          value={globalStats.rewardedReferrals}
          label={t('adminLoyalty.rewardedReferrals', 'Referime te shpërblyera')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top referrers */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-dark-900">
              {t('adminLoyalty.topReferrers', 'Top 10 referuesit')}
            </h2>
          </div>
          {topReferrers.length === 0 ? (
            <p className="px-5 py-8 text-sm text-dark-300 text-center">
              {t('adminLoyalty.noReferrers', 'Asnje referim akoma.')}
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {topReferrers.map((r, idx) => (
                <div key={r.user_id} className="px-5 py-3 flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-gradient-to-br from-amber-300 to-yellow-500 text-white' :
                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                    idx === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-900 truncate">{r.full_name || '—'}</p>
                    <p className="text-[11px] text-dark-400 truncate">{r.email} · <code>{r.referral_code}</code></p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-green-700">{r.rewarded_referrals}</p>
                    <p className="text-[10px] text-dark-400">{t('adminLoyalty.ofN', '{{total}} ne total', { total: r.total_referrals })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User search */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <Search className="w-4 h-4 text-primary-600" />
            <h2 className="text-sm font-semibold text-dark-900">
              {t('adminLoyalty.searchUser', 'Kërko user me email')}
            </h2>
          </div>
          <div className="p-4">
            <div className="flex gap-2 mb-3">
              <input
                type="email"
                value={searchEmail}
                onChange={e => setSearchEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="user@example.com"
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
              <button
                onClick={handleSearch}
                disabled={searching || !searchEmail.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : t('adminLoyalty.search', 'Kërko')}
              </button>
            </div>
            {foundUserId && (
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <Gift className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-dark-500">{t('adminLoyalty.balance', 'Balanca aktuale')}</p>
                    <p className="text-xl font-bold text-dark-900">{userBalance.toLocaleString()} pikë</p>
                  </div>
                </div>
                {userReferrals.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-dark-400 mb-1.5">
                      {t('adminLoyalty.referralsCount', 'Referimet ({{n}})', { n: userReferrals.length })}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {userReferrals.map(r => (
                        <span key={r.id} className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${referralStatusColors[r.status]}`}>
                          {r.status}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-dark-400 mb-1.5">
                    {t('adminLoyalty.history', 'Historiku (50 te fundit)')}
                  </p>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 border border-gray-100 rounded-lg">
                    {userTransactions.map(tx => (
                      <div key={tx.id} className="px-3 py-2 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0 flex-1">
                          <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded mr-1.5 ${txTypeBadges[tx.type].cls}`}>
                            {txTypeBadges[tx.type].label}
                          </span>
                          <span className="text-dark-500 truncate">{tx.description || '—'}</span>
                        </div>
                        <span className={`font-bold tabular-nums shrink-0 ${tx.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.points >= 0 ? '+' : ''}{tx.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {searchEmail && !searching && !foundUserId && (
              <p className="text-xs text-dark-400 italic">{t('adminLoyalty.notFound', 'Useri nuk u gjet.')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-dark-900">
            {t('adminLoyalty.recentTransactions', 'Transaksionet e fundit globale (50)')}
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {transactions.map(tx => (
            <div key={tx.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${txTypeBadges[tx.type].cls}`}>
                    {txTypeBadges[tx.type].label}
                  </span>
                  <span className="text-[11px] text-dark-400">
                    {new Date(tx.created_at).toLocaleString('sq-AL', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <p className="text-xs text-dark-600 truncate">
                  <span className="font-medium text-dark-900">{tx.profile?.full_name || tx.profile?.email || tx.user_id.slice(0, 8)}</span>
                  {' · '}
                  {tx.description || '—'}
                </p>
              </div>
              <span className={`text-sm font-bold tabular-nums shrink-0 ${tx.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {tx.points >= 0 ? '+' : ''}{tx.points}
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="px-5 py-8 text-sm text-dark-300 text-center">
              {t('adminLoyalty.noTransactions', 'Asnje transaksion akoma.')}
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, bg, value, label }: { icon: React.ReactNode; bg: string; value: string | number; label: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-xl font-bold text-dark-950">{value}</p>
      <p className="text-[11px] text-dark-500 mt-0.5">{label}</p>
    </div>
  );
}
