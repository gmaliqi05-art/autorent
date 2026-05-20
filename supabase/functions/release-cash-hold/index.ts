/**
 * 🔒 PROTECTED EDGE FUNCTION
 *
 * Liron (cancel) Stripe Authorization hold-in nje kompani e thirre kur
 * klienti ka paguar kesh ne lokal. Klientit nuk i merren para — autorizimi
 * largohet menjehere nga karta.
 *
 * Authorization: vetem owner i kompanise se booking-ut (ose super_admin).
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

    const { bookingId } = await req.json();
    if (!bookingId) return jsonResponse(req, { error: "Missing bookingId" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: booking, error: bookingErr } = await admin
      .from("bookings")
      .select(`
        id, company_id, cash_hold_payment_intent_id, cash_hold_status,
        company:companies(owner_id)
      `)
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingErr || !booking) return jsonResponse(req, { error: "Booking not found" }, 404);

    // Vetem owner i kompanise (ose super_admin) lejohet
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

    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-12-18.acacia" });
    const cancelled = await stripe.paymentIntents.cancel(booking.cash_hold_payment_intent_id);

    if (cancelled.status !== "canceled") {
      return jsonResponse(req, {
        error: `Cancel deshtoi, status: ${cancelled.status}`,
      }, 502);
    }

    // Update booking — hold-i u lirua, klienti pagoi kesh
    await admin
      .from("bookings")
      .update({
        cash_hold_status: "released",
        cash_hold_resolved_at: new Date().toISOString(),
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    // Update fatura nese ekziston
    await admin
      .from("invoices")
      .update({
        status: "paid",
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("booking_id", bookingId);

    return jsonResponse(req, { success: true, status: "released" });
  } catch (err) {
    console.error("release-cash-hold error:", err);
    return jsonResponse(req, {
      error: err instanceof Error ? err.message : "Unknown error",
    }, 500);
  }
});
