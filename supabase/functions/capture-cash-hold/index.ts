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
        internal_notes, client_email, client_name,
        vehicle:vehicles(brand, model),
        company:companies(owner_id, name)
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
    // Idempotency key i lidhur me bookingId + amount + 'capture' — Stripe garanton
    // qe retry-t e te njejtit request kthejne te njejtin response (mbron nga
    // double-capture ne network failures). Amount perfshihet sepse partial captures
    // me amount-e te ndryshme jane requests semantikisht te ndryshme.
    const captured = await stripe.paymentIntents.capture(
      booking.cash_hold_payment_intent_id,
      { amount_to_capture: captureAmount },
      { idempotencyKey: `capture-${bookingId}-${captureAmount}` },
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

    // Dergo email klientit qe garancia u kap
    try {
      // deno-lint-ignore no-explicit-any
      const v = (booking as any).vehicle;
      // deno-lint-ignore no-explicit-any
      const c = (booking as any).company;
      await admin.functions.invoke("send-email", {
        body: {
          recipientEmail: booking.client_email,
          recipientName: booking.client_name,
          emailType: "cash_hold_captured",
          templateData: {
            recipientName: booking.client_name || "Klient",
            vehicleName: v ? `${v.brand} ${v.model}` : "Automjet",
            companyName: c?.name || "RentaKar",
            capturedAmount: captureAmount / 100,
            reason: reason || "Pa shpjegim",
            supportEmail: "info@rentcars.life",
          },
          referenceId: bookingId,
          referenceType: "booking",
        },
      });
    } catch (e) {
      console.error("send-email failed (non-blocking):", e);
    }

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
