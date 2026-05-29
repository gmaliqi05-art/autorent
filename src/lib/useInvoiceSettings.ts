/**
 * Hook qe lexon platform-wide invoice settings nga `platform_settings`
 * (key='invoice_settings'). Perdoret kryesisht per:
 *  - VAT/tax percent ne booking calculator (kur show_vat=true)
 *  - Currency default per generate-invoice-pdf
 *  - Payment terms days
 *
 * Cache ne memorie per session — settings ndryshojne rralle.
 */
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export interface InvoiceSettings {
  show_vat: boolean;
  vat_rate: number;
  currency: string;
  payment_terms_days: number;
  invoice_prefix: string;
  invoice_start_number: number;
  auto_issue: boolean;
}

const DEFAULTS: InvoiceSettings = {
  show_vat: false,
  vat_rate: 20,
  currency: 'EUR',
  payment_terms_days: 14,
  invoice_prefix: 'INV',
  invoice_start_number: 1,
  auto_issue: false,
};

// Cache module-level — nje fetch per session
let cached: InvoiceSettings | null = null;
let inflight: Promise<InvoiceSettings> | null = null;

async function fetchSettings(): Promise<InvoiceSettings> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'invoice_settings')
      .maybeSingle();
    const merged = { ...DEFAULTS, ...((data?.value as Partial<InvoiceSettings>) ?? {}) };
    cached = merged;
    return merged;
  })();
  return inflight;
}

export function useInvoiceSettings(): InvoiceSettings {
  const [settings, setSettings] = useState<InvoiceSettings>(cached ?? DEFAULTS);

  useEffect(() => {
    if (cached) {
      setSettings(cached);
      return;
    }
    let mounted = true;
    void fetchSettings().then((s) => {
      if (mounted) setSettings(s);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return settings;
}

/** Vlere tax-i qe duhet aplikuar (0 nese show_vat = false) */
export function getEffectiveTaxPercent(settings: InvoiceSettings): number {
  return settings.show_vat ? Number(settings.vat_rate || 0) : 0;
}
