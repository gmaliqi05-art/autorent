/**
 * 🔒 PROTECTED EDGE FUNCTION
 *
 * Kap (capture) Stripe Authorization hold-in si penalitet kur klienti
 * NUK shfaqet ose nuk paguan ne lokal. Shuma e autorizuar debiten realisht.
 *
 * Authorization: vetem owner i kompanise se booking-ut (ose super_admin).
 *
 * I mundshem te kapesh edhe nje shume me te vogel se hold-i (psh kompania
 * vendos te marrë vetëm 50€ në vend të 100€ të plota).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@17.5.0";
import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";

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

    if (!stripeSecret) return jsonResponse(req, { error: "Stripe not configured" }, 500);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return jsonResponse(req, { error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const { bookingId, amountToCapture, reason } = await req.json();
    if (!bookingId) return jsonResponse(req, { error: "Missing bookingId" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: booking, error: bookingErr } = await admin
      .from("bookings")
      .select(`
        id, company_id, cash_hold_payment_intent_id, cash_hold_status, cash_hold_amount,
        internal_notes,
        company:companies(owner_id)
      `)
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingErr || !booking) return jsonResponse(req, { error: "Booking not found" }, 404);

    // deno-lint-ignore no-explicit-any
    const ownerId = (booking as any).company?.owner_id;
    const isSuperAdmin = userData.user.app_metadata?.role === "super_admin";
    if (ownerId !== userId && !isSuperAdmin) {
      return jsonResponse(req, { error: "Forbidden" }, 403);
    }

    if (!booking.cash_hold_payment_intent_id) {
      return jsonResponse(req, { error: "Nuk ka hold per kete booking" }, 400);
    }
    if (booking.cash_hold_status !== "authorized") {
      return jsonResponse(req, {
        error: `Hold tashme ne status: ${booking.cash_hold_status}`,
      }, 400);
    }

    const maxAmount = Number(booking.cash_hold_amount) * 100; // ne cents
    const captureAmount = amountToCapture
      ? Math.min(Math.round(Number(amountToCapture) * 100), maxAmount)
      : maxAmount;

    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-12-18.acacia" });
    const captured = await stripe.paymentIntents.capture(
      booking.cash_hold_payment_intent_id,
      { amount_to_capture: captureAmount },
    );

    if (captured.status !== "succeeded") {
      return jsonResponse(req, {
        error: `Capture deshtoi, status: ${captured.status}`,
      }, 502);
    }

    const note = reason
      ? `${booking.internal_notes || ""}\n[${new Date().toISOString().split('T')[0]}] Penalitet kapur: ${captureAmount / 100}€ - ${reason}`
      : `${booking.internal_notes || ""}\n[${new Date().toISOString().split('T')[0]}] Penalitet kapur: ${captureAmount / 100}€`;

    await admin
      .from("bookings")
      .update({
        cash_hold_status: "captured",
        cash_hold_resolved_at: new Date().toISOString(),
        internal_notes: note.trim(),
      })
      .eq("id", bookingId);

    return jsonResponse(req, {
      success: true,
      status: "captured",
      capturedAmount: captureAmount / 100,
    });
  } catch (err) {
    console.error("capture-cash-hold error:", err);
    return jsonResponse(req, {
      error: err instanceof Error ? err.message : "Unknown error",
    }, 500);
  }
});
