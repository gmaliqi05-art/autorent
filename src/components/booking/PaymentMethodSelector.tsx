import { useEffect, useState } from 'react';
import { CreditCard, Building, Wallet, Banknote, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';

export type PaymentMethodType = 'stripe' | 'paypal' | 'bank_transfer' | 'cash';

interface PaymentMethodSelectorProps {
  selected: PaymentMethodType | '';
  onSelect: (method: PaymentMethodType) => void;
}

interface BankAccount {
  bank_name: string;
  account_holder: string;
  iban: string;
  swift: string;
  currency: string;
}

export default function PaymentMethodSelector({ selected, onSelect }: PaymentMethodSelectorProps) {
  const { t } = useTranslation();
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [bankLoading, setBankLoading] = useState(false);

  const methods: { id: PaymentMethodType; label: string; description: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'stripe',
      label: t('payment.cardLabel'),
      description: t('payment.cardDesc'),
      icon: <CreditCard className="w-5 h-5" />,
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'paypal',
      label: t('payment.paypalLabel'),
      description: t('payment.paypalDesc'),
      icon: <Wallet className="w-5 h-5" />,
      color: 'from-sky-500 to-sky-600',
    },
    {
      id: 'bank_transfer',
      label: t('payment.bankLabel'),
      description: t('payment.bankDesc'),
      icon: <Building className="w-5 h-5" />,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      id: 'cash',
      label: t('payment.cashLabel'),
      description: t('payment.cashDesc'),
      icon: <Banknote className="w-5 h-5" />,
      color: 'from-amber-500 to-amber-600',
    },
  ];

  useEffect(() => {
    if (selected !== 'bank_transfer' || bankAccount) return;
    let cancelled = false;
    setBankLoading(true);
    (async () => {
      const { data } = await supabase
        .from('bank_accounts')
        .select('bank_name, account_holder, iban, swift, currency')
        .eq('is_primary', true)
        .eq('is_active', true)
        .maybeSingle();
      if (!cancelled) {
        setBankAccount(data as BankAccount | null);
        setBankLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected, bankAccount]);

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-dark-950 text-lg">{t('payment.selectMethod')}</h3>
      <p className="text-sm text-dark-500 mb-4">{t('payment.selectMethodDesc')}</p>

      <div className="space-y-2.5">
        {methods.map((method) => {
          const isSelected = selected === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelect(method.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-primary-500 bg-primary-50/50 shadow-sm'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center text-white shrink-0`}>
                {method.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${isSelected ? 'text-primary-700' : 'text-dark-900'}`}>
                  {method.label}
                </p>
                <p className="text-xs text-dark-400 mt-0.5">{method.description}</p>
              </div>
              {isSelected && (
                <CheckCircle2 className="w-5 h-5 text-primary-600 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {selected === 'bank_transfer' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-4">
          <p className="text-sm font-semibold text-emerald-800 mb-2">{t('payment.bankDetailsTitle')}</p>
          {bankLoading ? (
            <p className="text-xs text-emerald-600">{t('payment.loadingDetails')}</p>
          ) : bankAccount ? (
            <div className="space-y-1 text-xs text-emerald-700">
              <p>{t('payment.bankName')}: <span className="font-medium">{bankAccount.bank_name}</span></p>
              <p>{t('payment.iban')}: <span className="font-mono font-medium">{bankAccount.iban}</span></p>
              {bankAccount.swift && <p>{t('payment.swift')}: <span className="font-mono">{bankAccount.swift}</span></p>}
              {bankAccount.account_holder && <p>{t('payment.accountHolder')}: <span className="font-medium">{bankAccount.account_holder}</span></p>}
              <p>{t('payment.currency')}: <span className="font-medium">{bankAccount.currency}</span></p>
              <p className="mt-2 text-emerald-600 italic">{t('payment.bankVerifyNote')}</p>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-xs text-amber-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{t('payment.noBankDetails')}</p>
            </div>
          )}
        </div>
      )}

      {selected === 'cash' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
          <p className="text-sm font-semibold text-amber-800 mb-1">{t('payment.cashTitle')}</p>
          <p className="text-xs text-amber-700">{t('payment.cashNote')}</p>
        </div>
      )}

      {selected === 'stripe' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
          <p className="text-sm font-semibold text-blue-800 mb-1">{t('payment.cardTitle')}</p>
          <p className="text-xs text-blue-700">{t('payment.stripeNote')}</p>
        </div>
      )}

      {selected === 'paypal' && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mt-4">
          <p className="text-sm font-semibold text-sky-800 mb-1">{t('payment.paypalTitle')}</p>
          <p className="text-xs text-sky-700">{t('payment.paypalNote')}</p>
        </div>
      )}
    </div>
  );
}
