// Helper i perbashket per rate limiting permes Postgres RPC.

import { createClient } from "npm:@supabase/supabase-js@2.57.4";

interface RateLimitOptions {
  /** Identifier i unik per perdoruesin/IP-n (p.sh. "send-email:user_uuid") */
  key: string;
  /** Nr maksimal i thirrjeve te lejuara brenda window-it */
  maxCount: number;
  /** Gjatesia e window-it ne sekonda (default 60) */
  windowSeconds?: number;
}

/**
 * Kontrollon nese thirrja eshte e lejuar. Kthen true nese eshte ok, false nese ka kaluar limitin.
 * Perdoruesi RPC me service_role per te bypass-uar RLS.
 */
export async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  options: RateLimitOptions,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: options.key,
    p_max_count: options.maxCount,
    p_window_seconds: options.windowSeconds ?? 60,
  });
  if (error) {
    console.error("Rate limit RPC error:", error);
    // Fail-open: nese DB jashte sherbimit, lejojme thirrjen
    return true;
  }
  return Boolean(data);
}

/**
 * Helper: nxjerr nje identifier per request-in (user_id ose IP fallback).
 */
export function extractRateLimitKey(req: Request, prefix: string, userId?: string): string {
  if (userId) return `${prefix}:user:${userId}`;
  // Fallback ne IP (nga CF-Connecting-IP ose X-Forwarded-For)
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return `${prefix}:ip:${ip}`;
}
