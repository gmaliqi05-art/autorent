import { supabase } from './supabase';

/**
 * Krijon nje Stripe Checkout Session per nje booking ekzistues
 * dhe e ridrejton perdoruesin ne URL-n e Stripe-it.
 *
 * Booking-u duhet te jete krijuar tashme me payment_status='pending'.
 * Webhook-u `stripe-webhook` do ta beje update si 'paid' pas pageses.
 */
export async function startStripeCheckout(bookingId: string): Promise<{ error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { error: 'Duhet te jeni i kycur per te paguar.' };
  }

  const baseUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
  const successUrl = `${baseUrl}/dashboard/rezervimet?payment=success`;
  const cancelUrl = `${baseUrl}/dashboard/rezervimet?payment=cancelled`;

  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`;

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookingId, successUrl, cancelUrl }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ error: 'Unknown' }));
      return { error: errBody.error || 'Pagesa nuk mund te filloje.' };
    }

    const { url } = await response.json();
    if (!url) {
      return { error: 'Stripe nuk ktheu URL pagese.' };
    }

    // Ridrejtim ne Stripe Checkout
    window.location.href = url;
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Gabim i panjohur',
    };
  }
}
