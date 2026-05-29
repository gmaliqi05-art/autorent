/**
 * 🔒 PROTECTED EDGE FUNCTION
 *
 * Refund flow per anulim booking-u te paguar:
 *  - Lejon klientin (ose super_admin) qe te anuloje + marre refund
 *  - Per Stripe paymentintents: krijon Stripe Refund me amount = total - cancellation_fee
 *  - Per cash/bank_transfer: thjesht shenon status=cancelled (asgje per refund nese paid)
 *  - Per PayPal: per momentin shenon status=cancelled (refund manual nga admin ne PayPal Dashboard)
 *
 * Autorizimi:
 *  - Klient: vetem booking-un e tij
 *  - Super_admin: cdo booking
 *
 * Idempotency:
 *  - Stripe call perdor idempotencyKey = refund-{bookingId}
 *  - Nese stripe_refund_id ekziston, kthen direkt success pa thirre Stripe
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@17.5.0";
import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";

interface CancelRequest {
  bookingId: string;
  cancellationFee?: number; // ne EUR, default 0
}

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return jsonResponse(req, { error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse(req, { error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return jsonResponse(req, { error: "Unauthorized" }, 401);
    const userId = userData.user.id;
    const isSuperAdmin = userData.user.app_metadata?.role === "super_admin";

    const { bookingId, cancellationFee = 0 } = (await req.json()) as CancelRequest;
    if (!bookingId) return jsonResponse(req, { error: "Missing bookingId" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: booking, error: bookingErr } = await admin
      .from("bookings")
      .select(
        "id, client_id, payment_method, payment_status, status, total_price, currency, " +
        "stripe_payment_intent_id, stripe_refund_id, refund_amount",
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingErr || !booking) return jsonResponse(req, { error: "Booking not found" }, 404);

    // Auth: vetem klienti i booking-ut ose super_admin
    if (booking.client_id !== userId && !isSuperAdmin) {
      return jsonResponse(req, { error: "Forbidden" }, 403);
    }

    // Status checks
    if (booking.status === "cancelled") {
      return jsonResponse(req, { error: "Booking is already cancelled", alreadyCancelled: true }, 400);
    }
    if (booking.status === "active" || booking.status === "completed") {
      return jsonResponse(req, { error: "Cannot cancel an active or completed booking" }, 400);
    }

    // Llogaritja e refund-it: total - cancellation_fee, kufizuar ne 0
    const totalCents = Math.round(Number(booking.total_price) * 100);
    const feeCents = Math.max(0, Math.round(Number(cancellationFee || 0) * 100));
    const refundCents = Math.max(0, totalCents - feeCents);
    const refundAmountEur = refundCents / 100;

    // Result envelope qe kthehet ne UI per tregimin e te dhenave
    const result: Record<string, unknown> = {
      bookingId,
      cancellationFee,
      refundAmount: refundAmountEur,
      refundedVia: "none",
    };

    // 1. Idempotency check — nese tashme ka refund_id, kthej success direkt
    if (booking.stripe_refund_id) {
      result.refundedVia = "stripe";
      result.alreadyRefunded = true;
      result.stripeRefundId = booking.stripe_refund_id;
      return jsonResponse(req, { success: true, ...result }, 200);
    }

    // 2. Refund vetem nese booking eshte paguar realisht
    const isStripePaid =
      booking.payment_method === "stripe" &&
      booking.payment_status === "paid" &&
      !!booking.stripe_payment_intent_id;

    if (isStripePaid && refundCents > 0) {
      if (!stripeSecret) return jsonResponse(req, { error: "Stripe not configured" }, 500);

      const stripe = new Stripe(stripeSecret, { apiVersion: "2024-12-18.acacia" });

      try {
        const refund = await stripe.refunds.create({
          payment_intent: booking.stripe_payment_intent_id as string,
          amount: refundCents,
          reason: "requested_by_customer",
          metadata: { booking_id: bookingId, cancelled_by: userId },
        }, {
          idempotencyKey: `refund-${bookingId}`,
        });

        result.refundedVia = "stripe";
        result.stripeRefundId = refund.id;
        result.stripeStatus = refund.status;
      } catch (err) {
        console.error("Stripe refund failed:", err);
        return jsonResponse(req, {
          error: "Stripe refund failed",
          details: err instanceof Error ? err.message : "Unknown",
        }, 502);
      }
    } else if (booking.payment_method === "paypal" && booking.payment_status === "paid") {
      // PayPal refund-i kerkon nje thirrje te ndare; per momentin shenojme manual
      result.refundedVia = "paypal_manual";
      result.note = "PayPal refund duhet te procesohet manualisht nga admin ne PayPal Dashboard.";
    } else if (booking.payment_method === "bank_transfer" && booking.payment_status === "paid") {
      result.refundedVia = "bank_manual";
      result.note = "Refund per bank transfer behet manualisht. Klienti do njoftohet me email.";
    } else {
      // Cash ose pending — nuk ka refund qe duhet bere
      result.refundedVia = "none";
    }

    // 3. Update DB me cdo te dhene
    const updatePayload: Record<string, unknown> = {
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: userId,
      cancellation_fee: feeCents / 100,
    };

    if (result.stripeRefundId) {
      updatePayload.stripe_refund_id = result.stripeRefundId;
      updatePayload.refund_amount = refundAmountEur;
      updatePayload.refunded_at = new Date().toISOString();
      updatePayload.payment_status = refundCents >= totalCents ? "refunded" : "paid";
    }

    const { error: updateErr } = await admin
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId);

    if (updateErr) {
      console.error("DB update failed:", updateErr);
      return jsonResponse(req, {
        error: "Refund processed but DB update failed",
        ...result,
      }, 500);
    }

    // 4. Notification + push (template_key per i18n proper)
    await admin.from("notifications").insert({
      user_id: booking.client_id,
      title: "Rezervimi u anulua",
      message: result.refundedVia === "stripe"
        ? `Anulim i konfirmuar. Refund ${refundAmountEur} ${booking.currency || 'EUR'} ne karten tuaj brenda 5-10 ditesh.`
        : `Anulim i konfirmuar.`,
      type: "booking_cancelled",
      reference_id: bookingId,
      reference_type: "booking",
    });

    return jsonResponse(req, { success: true, ...result }, 200);
  } catch (err) {
    console.error("Error:", err);
    return jsonResponse(req, {
      error: "Internal server error",
      message: err instanceof Error ? err.message : "Unknown",
    }, 500);
  }
});
