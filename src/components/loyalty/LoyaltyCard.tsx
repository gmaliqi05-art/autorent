import { useState } from 'react';
import { Trophy, Gift, Copy, Check, Share2, Users, TrendingUp, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLoyalty } from '../../lib/useLoyalty';
import type { LoyaltyTransaction, Referral } from '../../lib/types';

interface LoyaltyCardProps {
  userId: string;
  referralCode: string | null | undefined;
}

const txTypeLabels: Record<LoyaltyTransaction['type'], string> = {
  booking_earned: 'Booking',
  referral_bonus: 'Bonus referimi',
  welcome_bonus: 'Mirëseardhje',
  redeemed: 'Përdorur',
  admin_adjustment: 'Rregullim',
  expired: 'Skaduar',
};

const referralStatusColors: Record<Referral['status'], string> = {
  pending: 'bg-amber-50 text-amber-700',
  qualified: 'bg-blue-50 text-blue-700',
  rewarded: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-50 text-gray-500',
};

const referralStatusLabels: Record<Referral['status'], string> = {
  pending: 'Në pritje',
  qualified: 'Kualifikuar',
  rewarded: 'Shpërblyer',
  cancelled: 'Anuluar',
};

export default function LoyaltyCard({ userId, referralCode }: LoyaltyCardProps) {
  const { t } = useTranslation();
  const { balance, transactions, referrals, loading } = useLoyalty(userId);
  const [copied, setCopied] = useState(false);

  const referralUrl = typeof window !== 'undefined' && referralCode
    ? `${window.location.origin}/regjistrohu?ref=${referralCode}`
    : '';

  async function copyCode() {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  async function shareLink() {
    if (!referralUrl) return;
    const text = t('loyalty.shareText', 'Më bashkohu në RentaKar dhe merr pikë mirëseardhjeje:');
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'RentaKar',
          text: `${text} ${referralCode}`,
          url: referralUrl,
        });
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(referralUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* ignore */ }
    }
  }

  if (loading && !balance) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    );
  }

  const totalPoints = balance?.total_points || 0;
  const totalEarned = balance?.total_earned || 0;
  const equivalentEur = (totalPoints / 10).toFixed(2);

  return (
    <div className="space-y-4">
      {/* Hero: Points balance + referral code */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -right-2 top-12 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium uppercase tracking-wider text-white/80">
                {t('loyalty.title', 'Programi i besnikërisë')}
              </span>
            </div>
            <p className="text-5xl font-bold mb-1">{totalPoints.toLocaleString()}</p>
            <p className="text-sm text-white/85">
              {t('loyalty.pointsBalance', 'pikë të disponueshme')}
            </p>
            <p className="text-xs text-white/70 mt-2">
              ≈ €{equivalentEur} {t('loyalty.equivalent', 'vlerë (1 pikë = €0.10)')}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <Gift className="w-5 h-5 text-primary-600" />
            </div>
            <span className="text-sm font-semibold text-dark-900">
              {t('loyalty.referFriends', 'Refero shokët')}
            </span>
          </div>
          <p className="text-xs text-dark-500 mb-3">
            {t('loyalty.referralExplain', 'Merr 100 pikë për çdo person që krijon llogari me kodin tënd dhe kryen booking-un e parë.')}
          </p>
          {referralCode ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <code className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono font-bold text-dark-900 tracking-wider text-center">
                  {referralCode}
                </code>
                <button
                  onClick={copyCode}
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-dark-700 rounded-lg transition-colors"
                  title={t('loyalty.copy', 'Kopjo')}
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={shareLink}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4" />
                {t('loyalty.share', 'Shpërndaj linkun')}
              </button>
            </>
          ) : (
            <p className="text-xs text-dark-400 italic">
              {t('loyalty.codeGenerating', 'Kodi po gjenerohet...')}
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-dark-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium uppercase tracking-wider">
              {t('loyalty.earned', 'Fituar')}
            </span>
          </div>
          <p className="text-xl font-bold text-dark-900">{totalEarned.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-dark-400 mb-1">
            <Users className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium uppercase tracking-wider">
              {t('loyalty.referrals', 'Referimet')}
            </span>
          </div>
          <p className="text-xl font-bold text-dark-900">{referrals.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-dark-400 mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium uppercase tracking-wider">
              {t('loyalty.rewarded', 'Shpërblyer')}
            </span>
          </div>
          <p className="text-xl font-bold text-dark-900">
            {referrals.filter(r => r.status === 'rewarded').length}
          </p>
        </div>
      </div>

      {/* Recent transactions */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-dark-900">
              {t('loyalty.recentActivity', 'Aktiviteti i fundit')}
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {transactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dark-400">
                      {txTypeLabels[tx.type]}
                    </span>
                    <span className="text-[10px] text-dark-300">
                      {new Date(tx.created_at).toLocaleDateString('sq-AL', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-xs text-dark-600 truncate">{tx.description || '—'}</p>
                </div>
                <span className={`text-sm font-bold tabular-nums ${tx.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.points >= 0 ? '+' : ''}{tx.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referrals list */}
      {referrals.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-dark-900">
              {t('loyalty.yourReferrals', 'Referimet e tua')}
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {referrals.slice(0, 5).map(ref => (
              <div key={ref.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <p className="text-xs text-dark-600">
                  {new Date(ref.created_at).toLocaleDateString('sq-AL')}
                </p>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${referralStatusColors[ref.status]}`}>
                  {referralStatusLabels[ref.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {transactions.length === 0 && referrals.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <Gift className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-dark-500 mb-1">
            {t('loyalty.emptyTitle', 'Filloni të mblidhni pikë!')}
          </p>
          <p className="text-xs text-dark-400">
            {t('loyalty.emptyDescr', 'Bëni booking-un tuaj të parë ose ftoni një shok për të filluar.')}
          </p>
        </div>
      )}
    </div>
  );
}
