import { supabase } from './supabase';
import { sendBookingInvoiceEmail } from './emailService';

/**
 * Therret edge function-in generate-invoice-pdf dhe shkarkon PDF-in si file.
 * Funksionon per booking-un e dhene; verifikim auth behet ne edge function.
 *
 * @param bookingId UUID i booking-ut
 * @param lang i18n locale per perkthimet ne PDF (default 'sq')
 * @param filename emri i file-it (default `invoice-<bookingId>.pdf`)
 */
export async function downloadInvoicePdf(
  bookingId: string,
  lang: string = 'sq',
  filename?: string,
): Promise<{ error: string | null }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: 'Not authenticated' };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const fnUrl = `${supabaseUrl}/functions/v1/generate-invoice-pdf?lang=${encodeURIComponent(lang)}`;

  let resp: Response;
  try {
    resp = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookingId }),
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

  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `invoice-${bookingId.slice(0, 8)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return { error: null };
}

interface CreateInvoiceParams {
  bookingId: string;
  companyId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  vehicleName: string;
  pickupDate: string;
  returnDate: string;
  totalDays: number;
  pricePerDay: number;
  depositAmount: number;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus?: string;
  status?: 'draft' | 'issued' | 'paid';
}

export async function createInvoice(params: CreateInvoiceParams) {
  const { data: invNum } = await supabase.rpc('generate_invoice_number');
  const invoiceNumber = invNum || `INV-${Date.now().toString(36).toUpperCase()}`;

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      booking_id: params.bookingId,
      company_id: params.companyId,
      client_id: params.clientId,
      client_name: params.clientName,
      client_email: params.clientEmail,
      client_phone: params.clientPhone,
      company_name: params.companyName,
      company_email: params.companyEmail,
      company_phone: params.companyPhone,
      vehicle_name: params.vehicleName,
      pickup_date: params.pickupDate,
      return_date: params.returnDate,
      total_days: params.totalDays,
      price_per_day: params.pricePerDay,
      subtotal: params.totalPrice,
      deposit_amount: params.depositAmount,
      total_price: params.totalPrice,
      payment_method: params.paymentMethod,
      payment_status: params.paymentStatus || 'pending',
      status: params.status || 'draft',
      issued_at: params.status === 'issued' ? new Date().toISOString() : null,
    })
    .select()
    .maybeSingle();

  return { data, error, invoiceNumber };
}

export async function issueInvoiceAndNotify(params: CreateInvoiceParams) {
  const result = await createInvoice({ ...params, status: 'issued' });

  if (!result.error && result.data) {
    const paymentMethodLabel =
      params.paymentMethod === 'stripe' ? 'Karte krediti/debiti' :
      params.paymentMethod === 'paypal' ? 'PayPal' :
      params.paymentMethod === 'bank_transfer' ? 'Transfer bankar' : 'Kesh / Ne lokal';

    await sendBookingInvoiceEmail(
      params.clientEmail,
      params.clientName,
      {
        bookingId: params.bookingId,
        invoiceDate: new Date().toLocaleDateString('sq-AL'),
        clientPhone: params.clientPhone,
        companyName: params.companyName,
        companyEmail: params.companyEmail,
        companyPhone: params.companyPhone,
        vehicleName: params.vehicleName,
        pickupDate: new Date(params.pickupDate).toLocaleDateString('sq-AL'),
        returnDate: new Date(params.returnDate).toLocaleDateString('sq-AL'),
        totalDays: params.totalDays,
        pricePerDay: params.pricePerDay,
        subtotal: params.totalPrice,
        deposit: params.depositAmount,
        paymentMethod: paymentMethodLabel,
        totalPrice: params.totalPrice,
      }
    );
  }

  return result;
}
