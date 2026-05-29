import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import type { LoyaltyBalance, LoyaltyTransaction, Referral } from './types';

interface UseLoyaltyResult {
  balance: LoyaltyBalance | null;
  transactions: LoyaltyTransaction[];
  referrals: Referral[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useLoyalty(userId: string | undefined | null): UseLoyaltyResult {
  const [balance, setBalance] = useState<LoyaltyBalance | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setBalance(null);
      setTransactions([]);
      setReferrals([]);
      return;
    }
    setLoading(true);
    const [balRes, txRes, refRes] = await Promise.all([
      supabase.from('user_loyalty_balance').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('loyalty_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      supabase.from('referrals').select('*').eq('referrer_id', userId).order('created_at', { ascending: false }).limit(50),
    ]);
    setBalance((balRes.data as LoyaltyBalance) || null);
    setTransactions((txRes.data || []) as LoyaltyTransaction[]);
    setReferrals((refRes.data || []) as Referral[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { balance, transactions, referrals, loading, refetch: fetchAll };
}

export async function applyReferralCode(code: string): Promise<{ success: boolean; error?: string; referrer_name?: string }> {
  const { data, error } = await supabase.rpc('apply_referral_code', { p_code: code });
  if (error) return { success: false, error: error.message };
  return data as { success: boolean; error?: string; referrer_name?: string };
}
