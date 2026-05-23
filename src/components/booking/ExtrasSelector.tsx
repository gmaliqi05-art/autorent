import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Baby, Navigation, Wifi, Users, Snowflake, Mountain, Smartphone, Package, Plus, Minus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/currency';
import type { VehicleExtra, Currency } from '../../lib/types';
import type { ExtraSelection } from '../../lib/bookingCalculator';

interface Props {
  companyId: string;
  totalDays: number;
  selections: ExtraSelection[];
  onChange: (next: ExtraSelection[]) => void;
  displayCurrency?: Currency;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Baby,
  Navigation,
  Wifi,
  Users,
  Snowflake,
  Mountain,
  Smartphone,
  Package,
};

export default function ExtrasSelector({
  companyId,
  totalDays,
  selections,
  onChange,
  displayCurrency = 'EUR',
}: Props) {
  const { i18n, t } = useTranslation();
  const lang = (i18n.language?.split('-')[0] || 'en') as 'sq' | 'en' | 'de';
  const [extras, setExtras] = useState<VehicleExtra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('vehicle_extras')
        .select('*')
        .eq('is_active', true)
        .or(`company_id.eq.${companyId},company_id.is.null`)
        .order('sort_order', { ascending: true });
      if (!cancelled) {
        setExtras((data ?? []) as VehicleExtra[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [companyId]);

  function setQuantity(extra: VehicleExtra, qty: number) {
    const clamped = Math.max(0, Math.min(extra.max_quantity, qty));
    const others = selections.filter((s) => s.extra.id !== extra.id);
    if (clamped === 0) {
      onChange(others);
    } else {
      onChange([...others, { extra, quantity: clamped }]);
    }
  }

  function getQuantity(extraId: string): number {
    return selections.find((s) => s.extra.id === extraId)?.quantity ?? 0;
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (extras.length === 0) {
    return (
      <div className="text-sm text-dark-500 bg-gray-50 rounded-xl p-4">
        {t('extras.noneAvailable', 'Nuk ka shtesa te disponueshme per kete kompani.')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {extras.map((extra) => {
        const quantity = getQuantity(extra.id);
        const name = (extra as unknown as Record<string, string | undefined>)[`name_${lang}`] || extra.name_en || extra.code;
        const desc = (extra as unknown as Record<string, string | undefined>)[`description_${lang}`] || extra.description_en || '';
        const Icon = ICON_MAP[extra.icon] ?? Package;
        const isSelected = quantity > 0;
        const lineTotal = (Number(extra.price_per_day) * totalDays + Number(extra.price_per_rental)) * quantity;

        return (
          <div
            key={extra.id}
            className={`rounded-xl border-2 p-4 transition-all ${
              isSelected ? 'border-primary-500 bg-primary-50/40' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-dark-500'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-semibold text-dark-900 text-sm">{name}</h5>
                {desc && <p className="text-xs text-dark-500 mt-0.5 line-clamp-2">{desc}</p>}
                <p className="text-xs font-semibold text-primary-600 mt-1.5">
                  {formatCurrency(Number(extra.price_per_day), displayCurrency)} {t('extras.perDay', '/ dite')}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              {extra.max_quantity > 1 ? (
                <div className="inline-flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-0.5">
                  <button
                    type="button"
                    onClick={() => setQuantity(extra, quantity - 1)}
                    disabled={quantity === 0}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    aria-label="Decrement"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-semibold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(extra, quantity + 1)}
                    disabled={quantity >= extra.max_quantity}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    aria-label="Increment"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quantity > 0}
                    onChange={(e) => setQuantity(extra, e.target.checked ? 1 : 0)}
                    className="w-4 h-4 rounded text-primary-600"
                  />
                  <span className="text-xs text-dark-600">{t('extras.add', 'Shto')}</span>
                </label>
              )}

              {lineTotal > 0 && (
                <span className="text-sm font-bold text-dark-900">
                  {formatCurrency(lineTotal, displayCurrency)}
                </span>
              )}
            </div>

            {extra.requires_extra_license && (
              <p className="mt-2 text-[10px] text-amber-600 bg-amber-50 rounded-md px-2 py-1">
                {t('extras.requiresLicense', 'Kerkohet patente shtese gjate marrjes.')}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
