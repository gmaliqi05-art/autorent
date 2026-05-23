import { supabase } from './supabase';
import type { Currency, CurrencyRate } from './types';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  ALL: 'L',
  MKD: 'ден',
  RSD: 'дин',
};

const LOCALE_BY_CURRENCY: Record<Currency, string> = {
  EUR: 'de-DE',
  USD: 'en-US',
  GBP: 'en-GB',
  CHF: 'de-CH',
  ALL: 'sq-AL',
  MKD: 'mk-MK',
  RSD: 'sr-RS',
};

export function formatCurrency(
  amount: number,
  currency: Currency = 'EUR',
  options: Intl.NumberFormatOptions = {},
): string {
  try {
    return new Intl.NumberFormat(LOCALE_BY_CURRENCY[currency] ?? 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options,
    }).format(amount);
  } catch {
    // Fallback nese Intl nuk e njeh valuten
    const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
    return `${amount.toFixed(2)} ${symbol}`;
  }
}

export function currencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

let ratesCache: { rates: Record<string, number>; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minuta

async function fetchRates(): Promise<Record<string, number>> {
  if (ratesCache && Date.now() - ratesCache.fetchedAt < CACHE_TTL_MS) {
    return ratesCache.rates;
  }
  const { data, error } = await supabase
    .from('currency_rates')
    .select('base_currency, quote_currency, rate')
    .eq('base_currency', 'EUR');

  if (error || !data) return ratesCache?.rates ?? { EUR: 1 };

  const map: Record<string, number> = { EUR: 1 };
  (data as Pick<CurrencyRate, 'base_currency' | 'quote_currency' | 'rate'>[]).forEach((r) => {
    map[r.quote_currency] = Number(r.rate);
  });

  ratesCache = { rates: map, fetchedAt: Date.now() };
  return map;
}

/**
 * Konverton midis valutash duke perdorur EUR si pivot.
 * Te gjitha kursat ne DB jane base=EUR -> quote=X.
 */
export async function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
): Promise<number> {
  if (from === to) return amount;
  const rates = await fetchRates();

  // amount në from-currency -> EUR
  const amountInEur = from === 'EUR' ? amount : amount / (rates[from] ?? 1);
  // EUR -> to-currency
  const amountInTo = to === 'EUR' ? amountInEur : amountInEur * (rates[to] ?? 1);

  return Math.round(amountInTo * 100) / 100;
}

export function clearCurrencyCache(): void {
  ratesCache = null;
}
