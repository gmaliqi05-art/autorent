import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../lib/currency';
import type { BookingPriceBreakdown } from '../../lib/bookingCalculator';

interface Props {
  breakdown: BookingPriceBreakdown;
  days: number;
  pricePerDay: number;
  showDepositSeparately?: boolean;
}

export default function PriceBreakdown({
  breakdown,
  days,
  pricePerDay,
  showDepositSeparately = true,
}: Props) {
  const { t } = useTranslation();
  const c = breakdown.currency;

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
      <Row
        label={t('price.basePerDay', 'Cmimi baze per dite')}
        value={`${formatCurrency(pricePerDay, c)} × ${days} ${t('price.daysShort', 'dite')}`}
        amount={breakdown.baseRental}
        currency={c}
      />

      {breakdown.insuranceTotal > 0 && (
        <Row
          label={t('price.insurance', 'Sigurim')}
          amount={breakdown.insuranceTotal}
          currency={c}
        />
      )}

      {breakdown.extrasBreakdown.length > 0 && (
        <div className="border-t border-gray-50">
          <div className="px-4 py-2.5 text-xs font-semibold text-dark-500 uppercase tracking-wider bg-gray-50/50">
            {t('price.extras', 'Shtesa')}
          </div>
          {breakdown.extrasBreakdown.map((ex) => (
            <Row
              key={ex.code}
              label={`${ex.name}${ex.quantity > 1 ? ` × ${ex.quantity}` : ''}`}
              amount={ex.line_total}
              currency={c}
              compact
            />
          ))}
        </div>
      )}

      {breakdown.youngDriverFee > 0 && (
        <Row
          label={t('price.youngDriverFee', 'Tarife shoferi i ri (< 25 vjeç)')}
          amount={breakdown.youngDriverFee}
          currency={c}
        />
      )}

      {breakdown.oneWayFee > 0 && (
        <Row
          label={t('price.oneWayFee', 'Dorzimi ne nje vendndodhje tjeter')}
          amount={breakdown.oneWayFee}
          currency={c}
        />
      )}

      {breakdown.discount > 0 && (
        <Row
          label={t('price.discount', 'Zbritja')}
          amount={-breakdown.discount}
          currency={c}
          negative
        />
      )}

      {breakdown.tax > 0 && (
        <Row
          label={t('price.tax', 'TVSH')}
          amount={breakdown.tax}
          currency={c}
        />
      )}

      <div className="px-4 py-4 flex justify-between bg-primary-50 border-t border-primary-100">
        <span className="font-bold text-dark-900">{t('price.totalToPay', 'Totali per pagese')}</span>
        <span className="text-xl font-bold text-primary-600">{formatCurrency(breakdown.total, c)}</span>
      </div>

      {showDepositSeparately && breakdown.deposit > 0 && (
        <div className="px-4 py-3 flex justify-between bg-amber-50/50 border-t border-amber-100 text-sm">
          <span className="text-dark-600">{t('price.depositRefundable', 'Depozita (kthehet pas kthimit te automjetit)')}</span>
          <span className="font-semibold text-dark-900">{formatCurrency(breakdown.deposit, c)}</span>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  amount,
  currency,
  negative,
  compact,
}: {
  label: string;
  value?: string;
  amount: number;
  currency: import('../../lib/types').Currency;
  negative?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`${compact ? 'px-4 py-2' : 'px-4 py-3'} flex justify-between text-sm border-t border-gray-50 first:border-t-0`}>
      <span className="text-dark-500">{label}</span>
      <span className="flex items-center gap-2">
        {value && <span className="text-xs text-dark-400">{value}</span>}
        <span className={`font-medium ${negative ? 'text-emerald-600' : 'text-dark-900'}`}>
          {negative ? '−' : ''}{formatCurrency(Math.abs(amount), currency)}
        </span>
      </span>
    </div>
  );
}
