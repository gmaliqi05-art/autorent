/**
 * 🔒 PROTECTED FILE — DO NOT DELETE OR REVERT
 *
 * Stripe.js singleton i ngarkuar nje here per te gjithe app-in.
 * Perdoret nga komponentet qe perfshijne Stripe Elements (Cash Hold form).
 */
import { loadStripe, type Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!pk) {
      console.warn('[Stripe] VITE_STRIPE_PUBLISHABLE_KEY mungon — Stripe Elements nuk do te punojne');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(pk);
  }
  return stripePromise;
}

/**
 * Therret edge function-in create-cash-hold dhe kthen clientSecret e PaymentIntent.
 */
export async function createCashHold(bookingId: string, accessToken: string): Promise<
  | { clientSecret: string; paymentIntentId: string; holdAmount: number }
  | { error: string }
> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-cash-hold`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bookingId }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({ error: 'Unknown' }));
    return { error: body.error || 'Gabim ne krijimin e hold-it' };
  }
  return resp.json();
}

/**
 * Therret edge function-in release-cash-hold (vetem company owner).
 */
export async function releaseCashHold(bookingId: string, accessToken: string): Promise<
  { success: true } | { error: string }
> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/release-cash-hold`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bookingId }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({ error: 'Unknown' }));
    return { error: body.error || 'Gabim ne lirim te hold-it' };
  }
  return { success: true };
}

/**
 * Therret edge function-in capture-cash-hold (vetem company owner).
 * Opsionale: amountToCapture per kapje te pjesshme.
 */
export async function captureCashHold(
  bookingId: string,
  accessToken: string,
  options: { amountToCapture?: number; reason?: string } = {},
): Promise<{ success: true; capturedAmount: number } | { error: string }> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-cash-hold`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bookingId, ...options }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({ error: 'Unknown' }));
    return { error: body.error || 'Gabim ne kapje te hold-it' };
  }
  return resp.json();
}
