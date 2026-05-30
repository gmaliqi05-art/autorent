import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Loader2, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLoyalty } from '../../lib/useLoyalty';

interface LoyaltyRedeemWidgetProps {
  userId: string;
  bookingTotal: number;
  redeemedPoints: number;
  onChange: (points: number) => void;
}

const POINTS_PER_EUR = 10;

export default function LoyaltyRedeemWidget({
  userId,
  bookingTotal,
  redeemedPoints,
  onChange,
}: LoyaltyRedeemWidgetProps) {
  const { t } = useTranslation();
  const { balance, loading } = useLoyalty(userId);
  const [maxRedeemable, setMaxRedeemable] = useState(0);
  const [enabled, setEnabled] = useState(redeemedPoints > 0);

  // Recompute max kur ndryshon total ose balance.
  useEffect(() => {
    let cancelled = false;
    async function loadMax() {
      const { data } = await supabase.rpc('get_max_redeemable_points', { p_booking_total: bookingTotal });
      if (!cancelled) setMaxRedeemable(Number(data || 0));
    }
    if (balance && balance.total_points > 0 && bookingTotal > 0.5) {
      loadMax();
    } else {
      setMaxRedeemable(0);
    }
    return () => { cancelled = true; };
  }, [bookingTotal, balance?.total_points]);

  // Round redeemed points te shumefishi me i afert i POINTS_PER_EUR kur ndryshon enabled.
  useEffect(() => {
    if (!enabled && redeemedPoints > 0) {
      onChange(0);
    }
    // Kur aktivizohet, vendos default-in (max ose 100 cilido qe eshte me i vogel)
    if (enabled && redeemedPoints === 0 && maxRedeemable > 0) {
      onChange(Math.min(maxRedeemable, 100));
    }
  }, [enabled, maxRedeemable]); // eslint-disable-line react-hooks/exhaustive-deps

  const discountEur = useMemo(() => redeemedPoints / POINTS_PER_EUR, [redeemedPoints]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-2 text-sm text-dark-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('loyaltyRedeem.loading', 'Po ngarkohet balanca...')}
      </div>
    );
  }

  if (!balance || balance.total_points <= 0) {
    return null;
  }

  if (maxRedeemable <= 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
        <Trophy className="w-5 h-5 text-amber-600 shrink-0" />
        <div className="text-xs text-amber-800">
          {t('loyaltyRedeem.tooSmall', 'Booking-u eshte shumë i vogel për te perdorur pikë.')}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 border border-amber-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-dark-900">
              {t('loyaltyRedeem.title', 'Përdor pikët e besnikërisë')}
            </p>
            <p className="text-[11px] text-dark-500">
              {t('loyaltyRedeem.balance', 'Balanca: {{points}} pikë (≈ €{{eur}})', {
                points: balance.total_points,
                eur: (balance.total_points / POINTS_PER_EUR).toFixed(2),
              })}
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={e => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
        </label>
      </div>

      {enabled && (
        <div className="space-y-3">
          <input
            type="range"
            min={0}
            max={maxRedeemable}
            step={10}
            value={redeemedPoints}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-500">0 pikë</span>
            <button
              type="button"
              onClick={() => onChange(maxRedeemable)}
              className="text-amber-700 hover:text-amber-800 font-medium hover:underline"
            >
              {t('loyaltyRedeem.useMax', 'Përdor maksimumin')} ({maxRedeemable})
            </button>
          </div>
          <div className="flex items-center justify-between bg-white border border-amber-200 rounded-xl px-4 py-2.5">
            <div>
              <p className="text-xs text-dark-500">{t('loyaltyRedeem.applied', 'Aplikuar')}</p>
              <p className="text-sm font-bold text-dark-900">
                {redeemedPoints} {t('loyaltyRedeem.points', 'pikë')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-dark-500">{t('loyaltyRedeem.discount', 'Zbritja')}</p>
              <p className="text-sm font-bold text-green-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                -€{discountEur.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
