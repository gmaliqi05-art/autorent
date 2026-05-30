import { Award, Gem, Star, Trophy } from 'lucide-react';
import type { LoyaltyTier, LoyaltyTierInfo } from '../../lib/types';

interface TierBadgeProps {
  tier: LoyaltyTierInfo;
  variant?: 'compact' | 'full';
}

const tierStyles: Record<LoyaltyTier, {
  label: string;
  icon: React.ReactNode;
  bg: string;
  text: string;
  glow: string;
  ring: string;
}> = {
  bronze: {
    label: 'Bronze',
    icon: <Award className="w-4 h-4" />,
    bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
    text: 'text-orange-50',
    glow: 'shadow-orange-500/30',
    ring: 'ring-orange-200',
  },
  silver: {
    label: 'Silver',
    icon: <Star className="w-4 h-4" />,
    bg: 'bg-gradient-to-br from-gray-400 to-gray-600',
    text: 'text-gray-50',
    glow: 'shadow-gray-500/30',
    ring: 'ring-gray-200',
  },
  gold: {
    label: 'Gold',
    icon: <Trophy className="w-4 h-4" />,
    bg: 'bg-gradient-to-br from-yellow-400 to-amber-600',
    text: 'text-yellow-50',
    glow: 'shadow-amber-500/30',
    ring: 'ring-amber-200',
  },
  platinum: {
    label: 'Platinum',
    icon: <Gem className="w-4 h-4" />,
    bg: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600',
    text: 'text-cyan-50',
    glow: 'shadow-blue-500/40',
    ring: 'ring-blue-200',
  },
};

export default function TierBadge({ tier, variant = 'full' }: TierBadgeProps) {
  const style = tierStyles[tier.tier];

  if (variant === 'compact') {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${style.bg} ${style.text} shadow ${style.glow}`}>
        {style.icon}
        {style.label}
      </span>
    );
  }

  return (
    <div className={`relative rounded-2xl ${style.bg} p-5 text-white shadow-lg ${style.glow} ring-1 ${style.ring}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            {style.icon}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Niveli yt</p>
            <p className="text-2xl font-bold leading-tight">{style.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-80">Fituar total</p>
          <p className="text-lg font-bold">{tier.total_earned.toLocaleString()}</p>
        </div>
      </div>

      {tier.tier !== 'platinum' && tier.tier_max && (
        <>
          <div className="flex items-center justify-between text-[11px] mb-1.5 opacity-90">
            <span>{tier.tier_min}</span>
            <span className="font-semibold">{tier.points_to_next} pikë te tjera per nivelin tjetër</span>
            <span>{tier.tier_max}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${Math.max(2, Math.min(100, tier.progress_pct))}%` }}
            />
          </div>
        </>
      )}

      {tier.tier === 'platinum' && (
        <div className="text-center py-1">
          <p className="text-xs opacity-90">Niveli maksimum — falënderim per besnikërinë!</p>
        </div>
      )}
    </div>
  );
}

export const TIER_LABELS = tierStyles;
