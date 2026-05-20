/**
 * 🔒 PROTECTED EDGE FUNCTION
 *
 * Krijon nje Stripe PaymentIntent me capture_method='manual' per nje booking
 * me payment_method='cash'. Karta e klientit AUTORIZOHET (jo i tërheq) per
 * shumen e depozites si garanci.
 *
 * Klienti pastaj e konfirmon ne frontend me Stripe Elements + clientSecret.
 *
 * Flow:
 *  1. Klienti zgjedh cash ne checkout
 *  2. Krijohet booking-u
 *  3. Therret kjo function -> kthen clientSecret
 *  4. Frontend perdor Stripe Elements per te konfirmuar
 *  5. Webhook (payment_intent.requires_capture) -> update cash_hold_status='authorized'
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@17.5.0";
import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit, extractRateLimitKey } from "../_shared/rateLimit.ts";

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

    if (!stripeSecret) {
      return jsonResponse(req, { error: "Stripe not configured" }, 500);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return jsonResponse(req, { error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);

    // Rate limit (10/min per user)
    const allowed = await checkRateLimit(admin, {
      key: extractRateLimitKey(req, "create-cash-hold", userId),
      maxCount: 10,
      windowSeconds: 60,
    });
    if (!allowed) return jsonResponse(req, { error: "Too many requests" }, 429);

    const { bookingId } = await req.json();
    if (!bookingId) return jsonResponse(req, { error: "Missing bookingId" }, 400);

    // Merr booking
    const { data: booking, error: bookingErr } = await admin
      .from("bookings")
      .select(`
        id, client_id, deposit_amount, total_price, status, payment_status, payment_method,
        cash_hold_payment_intent_id, cash_hold_status,
        vehicle:vehicles(brand, model, year),
        company:companies(name)
      `)
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingErr || !booking) return jsonResponse(req, { error: "Booking not found" }, 404);
    if (booking.client_id !== userId) return jsonResponse(req, { error: "Forbidden" }, 403);
    if (booking.payment_method !== "cash") {
      return jsonResponse(req, { error: "Booking nuk eshte me kesh" }, 400);
    }
    if (booking.cash_hold_status === "authorized") {
      return jsonResponse(req, { error: "Hold-i ekziston tashme" }, 400);
    }
    if (booking.status === "cancelled") {
      return jsonResponse(req, { error: "Booking eshte i anuluar" }, 400);
    }

    // Default 100 EUR nese nuk ka deposit_amount
    const holdAmountEur = Number(booking.deposit_amount) > 0
      ? Number(booking.deposit_amount)
      : 100;

    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-12-18.acacia" });

    // deno-lint-ignore no-explicit-any
    const vehicle = (booking as any).vehicle;
    // deno-lint-ignore no-explicit-any
    const company = (booking as any).company;
    const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : "Automjet";

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(holdAmountEur * 100),
      currency: "eur",
      capture_method: "manual", // KJO eshte celesi — autorize por mos i merr
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      receipt_email: userData.user.email ?? undefined,
      description: `Garanci kesh: ${vehicleName} - ${company?.name || "RentaKar"}`,
      metadata: {
        booking_id: booking.id,
        client_id: userId,
        kind: "cash_hold",
      },
    });

    // Ruaj intent.id ne booking
    await admin
      .from("bookings")
      .update({
        cash_hold_payment_intent_id: intent.id,
        cash_hold_amount: holdAmountEur,
        cash_hold_status: "authorized", // Update preliminar (webhook do ta konfirmoje)
      })
      .eq("id", booking.id);

    return jsonResponse(req, {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      holdAmount: holdAmountEur,
    });
  } catch (err) {
    console.error("create-cash-hold error:", err);
    return jsonResponse(req, {
      error: err instanceof Error ? err.message : "Unknown error",
    }, 500);
  }
});
