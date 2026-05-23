import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, ShieldCheck, Sparkles, Check, X, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/currency';
import type { InsurancePlan, Currency } from '../../lib/types';

interface Props {
  companyId: string;
  totalDays: number;
  selectedId: string | null;
  onSelect: (plan: InsurancePlan | null) => void;
  displayCurrency?: Currency;
}

const TIER_ICON = {
  basic: Shield,
  standard: ShieldCheck,
  premium: Sparkles,
  platinum: Sparkles,
} as const;

const TIER_COLOR = {
  basic: 'border-gray-200 bg-white',
  standard: 'border-primary-200 bg-primary-50/30',
  premium: 'border-amber-200 bg-amber-50/30',
  platinum: 'border-purple-200 bg-purple-50/30',
} as const;

export default function InsurancePlanSelector({
  companyId,
  totalDays,
  selectedId,
  onSelect,
  displayCurrency = 'EUR',
}: Props) {
  const { i18n, t } = useTranslation();
  const lang = (i18n.language?.split('-')[0] || 'en') as 'sq' | 'en' | 'de';
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Plane te kompanise + plane platform-wide (company_id IS NULL)
      const { data } = await supabase
        .from('insurance_plans')
        .select('*')
        .eq('is_active', true)
        .or(`company_id.eq.${companyId},company_id.is.null`)
        .order('sort_order', { ascending: true });
      if (!cancelled) {
        setPlans((data ?? []) as InsurancePlan[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [companyId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-sm text-dark-500 bg-gray-50 rounded-xl p-4 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span>{t('insurance.noPlansAvailable', 'Nuk ka plane sigurimi te konfiguruara. Vazhdo me sigurimin baze te pergjegjesise.')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {plans.map((plan) => {
        const Icon = TIER_ICON[plan.tier];
        const name = (plan as unknown as Record<string, string | undefined>)[`name_${lang}`] || plan.name_en || plan.code;
        const desc = (plan as unknown as Record<string, string | undefined>)[`description_${lang}`] || plan.description_en || '';
        const totalPrice = Number(plan.price_per_day) * totalDays;
        const isSelected = selectedId === plan.id;

        return (
          <button
            key={plan.id}
            type="button"
            onClick={() => onSelect(plan)}
            className={`w-full text-left rounded-xl border-2 transition-all p-4 ${
              isSelected
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100'
                : TIER_COLOR[plan.tier]
            } hover:border-primary-300`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-primary-100 text-primary-700' : 'bg-white text-dark-600'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-dark-900">{name}</h4>
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-dark-100 text-dark-600">
                      {plan.tier}
                    </span>
                  </div>
                  {desc && <p className="text-xs text-dark-500 mt-1 line-clamp-2">{desc}</p>}
                  <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-dark-500">
                    <Feature on={plan.includes_cdw} label="CDW" />
                    <Feature on={plan.includes_theft_protection} label={t('insurance.theft', 'Vjedhje')} />
                    <Feature on={plan.includes_glass_tire} label={t('insurance.glassTire', 'Xhama/Goma')} />
                    <Feature on={plan.includes_roadside_assistance} label={t('insurance.roadside', 'Asistenca rrugore')} />
                    <Feature on={plan.includes_personal_accident} label={t('insurance.personalAccident', 'Aksident personal')} />
                  </div>
                  {Number(plan.deductible_amount) > 0 ? (
                    <p className="text-[11px] text-dark-400 mt-2">
                      {t('insurance.deductible', 'Depozita ne risk:')} <span className="font-semibold text-dark-700">{formatCurrency(Number(plan.deductible_amount), plan.currency)}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                      <Check className="w-3 h-3" /> {t('insurance.zeroDeductible', 'Zero depozite')}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-dark-400">{t('insurance.perDay', '/ dite')}</p>
                <p className="text-lg font-bold text-dark-900">{formatCurrency(Number(plan.price_per_day), displayCurrency)}</p>
                {totalDays > 1 && (
                  <p className="text-[11px] text-dark-500 mt-0.5">
                    {formatCurrency(totalPrice, displayCurrency)} {t('insurance.total', 'gjithsej')}
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`w-full text-left rounded-xl border-2 transition-all p-3 text-sm ${
          selectedId === null
            ? 'border-primary-500 bg-primary-50'
            : 'border-dashed border-gray-300 hover:border-gray-400 bg-white'
        }`}
      >
        <span className="text-dark-600">{t('insurance.declineAll', 'Refuzo te gjitha planet — vazhdo me sigurimin baze')}</span>
      </button>
    </div>
  );
}

function Feature({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {on ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-gray-300" />}
      <span className={on ? 'text-dark-700' : 'text-gray-400 line-through'}>{label}</span>
    </span>
  );
}
