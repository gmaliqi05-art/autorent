import { supabase } from './supabase';

/**
 * Therr edge function create-identity-verification dhe ridrejton perdoruesin
 * te faqja e Stripe-hosted Identity verification.
 *
 * Pas verifikimit, Stripe ridrejton mbrapsht te returnUrl me query param
 * ?identity_verification=complete. Webhook ne backend perditeson DB.
 */
export async function startIdentityVerification(
  returnPath: string = '/dashboard/profili',
): Promise<{ error: string | null }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: 'Not authenticated' };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
  const returnUrl = `${siteUrl}${returnPath}?identity_verification=complete`;

  let resp: Response;
  try {
    resp = await fetch(`${supabaseUrl}/functions/v1/create-identity-verification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ returnUrl }),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Network error' };
  }

  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try {
      const errBody = await resp.json();
      msg = (errBody as { error?: string }).error || msg;
    } catch { /* ignore */ }
    return { error: msg };
  }

  const data = await resp.json() as { url?: string; error?: string };
  if (!data.url) return { error: data.error || 'Missing verification URL' };

  // Redirect te Stripe-hosted faqja
  window.location.href = data.url;
  return { error: null };
}
