/**
 * 🔒 PROTECTED FILE — DO NOT DELETE OR REVERT
 *
 * PayPal Checkout client wrapper. Used by VehicleDetailPage (start)
 * and ClientBookings (capture on return). Calls `create-paypal-order`
 * and `capture-paypal-order` edge functions.
 *
 * If bolt.new tries to remove this file: STOP and ask the user.
 */
import { supabase } from './supabase';

/**
 * Krijon nje PayPal order per nje booking ekzistues dhe ridrejton
 * perdoruesin tek faqja e aprovimit te PayPal-it.
 *
 * Pas aprovimit, PayPal e ridrejton tek `return_url?token=<orderId>`
 * dhe kemi nje page handler qe therret capturePaypalOrder() per ta finalizuar.
 */
export async function startPaypalCheckout(bookingId: string): Promise<{ error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { error: 'Duhet te jeni i kycur per te paguar.' };
  }

  const baseUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
  const returnUrl = `${baseUrl}/dashboard/rezervimet?paypal=return`;
  const cancelUrl = `${baseUrl}/dashboard/rezervimet?paypal=cancelled`;

  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-paypal-order`;

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookingId, returnUrl, cancelUrl }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ error: 'Unknown' }));
      return { error: errBody.error || 'PayPal nuk mund te filloje.' };
    }

    const { approveUrl } = await response.json();
    if (!approveUrl) {
      return { error: 'PayPal nuk ktheu URL pagese.' };
    }
    window.location.href = approveUrl;
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gabim i panjohur' };
  }
}

/**
 * Capture pagesen pasi perdoruesi ka aprovuar ne PayPal dhe eshte kthyer.
 * Therret prej page-it qe pranon kthimin (p.sh. /dashboard/rezervimet?paypal=return&token=...)
 */
export async function capturePaypalOrder(orderId: string): Promise<{ error?: string; bookingId?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { error: 'Duhet te jeni i kycur per te perfunduar pagesen.' };
  }

  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-paypal-order`;

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ error: 'Unknown' }));
      return { error: errBody.error || 'Capture deshtoi.' };
    }

    const data = await response.json();
    return { bookingId: data.bookingId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gabim i panjohur' };
  }
}
