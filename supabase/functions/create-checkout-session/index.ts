import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@17.5.0";
import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit, extractRateLimitKey } from "../_shared/rateLimit.ts";

interface CheckoutRequest {
  bookingId: string;
  successUrl: string;
  cancelUrl: string;
}

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse(req, { error: "Missing authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeSecret) {
      return jsonResponse(req, { error: "Stripe not configured" }, 500);
    }

    // Verifiko user-in
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return jsonResponse(req, { error: "Unauthorized" }, 401);
    }
    const userId = userData.user.id;

    // Rate limit: 10 checkout sessions/min per user (anti spam)
    const adminForRateLimit = createClient(supabaseUrl, serviceKey);
    const allowed = await checkRateLimit(adminForRateLimit, {
      key: extractRateLimitKey(req, "create-checkout-session", userId),
      maxCount: 10,
      windowSeconds: 60,
    });
    if (!allowed) {
      return jsonResponse(req, {
        error: "Too many requests. Provoni perseri pas nje minute.",
      }, 429);
    }

    // Parse body
    const body = (await req.json()) as CheckoutRequest;
    const { bookingId, successUrl, cancelUrl } = body;
    if (!bookingId || !successUrl || !cancelUrl) {
      return jsonResponse(req, {
        error: "Missing required fields: bookingId, successUrl, cancelUrl",
      }, 400);
    }

    // Merr booking-un + vetura + kompani (me service role per te bypass-uar RLS,
    // por verifikojme manualisht qe booking-u i takon ketij user-i)
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: booking, error: bookingErr } = await admin
      .from("bookings")
      .select(`
        id, client_id, total_price, deposit_amount, status, payment_status, payment_method,
        pickup_date, return_date, total_days, stripe_session_id,
        vehicle:vehicles(id, brand, model, year, main_image_url),
        company:companies(id, name)
      `)
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingErr || !booking) {
      return jsonResponse(req, { error: "Booking not found" }, 404);
    }

    if (booking.client_id !== userId) {
      return jsonResponse(req, { error: "Forbidden" }, 403);
    }

    if (booking.payment_status === "paid") {
      return jsonResponse(req, { error: "Booking already paid" }, 400);
    }

    if (booking.status === "cancelled") {
      return jsonResponse(req, { error: "Booking is cancelled" }, 400);
    }

    const vehicle = (booking as any).vehicle;
    const company = (booking as any).company;
    const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : "Automjet";
    const companyName = company?.name || "RentaKar";
    const totalAmount = Number(booking.total_price); // ne EUR
    const totalAmountCents = Math.round(totalAmount * 100);

    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-12-18.acacia" });

    // Reuse i nje session-i ekzistues nese eshte ende valid:
    //  - Useri klikon 2 here 'Vazhdo te Stripe' -> kthen URL-en e te njejtit session
    //  - Pa duplikim, pa orphan sessions ne Stripe Dashboard
    //  - Idempotency edhe kur DB update i pas-thirrjes deshton
    const existingSessionId = (booking as any).stripe_session_id;
    if (existingSessionId) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(existingSessionId);
        // Session i hapur dhe i papaguar -> ri-perdor (s'eshte expired/complete/canceled)
        if (existing.status === "open" && existing.payment_status === "unpaid" && existing.url) {
          return jsonResponse(req, {
            sessionId: existing.id,
            url: existing.url,
            reused: true,
          });
        }
      } catch (err) {
        // Session id i ruajtur por jovalid ne Stripe (deleted, test mode swap, etj.)
        // Pastroji nga DB para se te krijojme te ri qe te shmangim ri-retrying
        // permanent te te njejtit id te vdekur ne thirrjet e ardhshme.
        console.warn("Failed to retrieve existing session, clearing stale id:", err);
        await admin.from("bookings").update({ stripe_session_id: null }).eq("id", booking.id);
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${vehicleName} — ${companyName}`,
              description: `${booking.total_days} dite | ${booking.pickup_date} → ${booking.return_date}`,
              ...(vehicle?.main_image_url ? { images: [vehicle.main_image_url] } : {}),
            },
            unit_amount: totalAmountCents, // ne cents
          },
          quantity: 1,
        },
      ],
      client_reference_id: booking.id,
      customer_email: userData.user.email,
      metadata: {
        booking_id: booking.id,
        client_id: userId,
        company_id: company?.id || "",
        vehicle_id: vehicle?.id || "",
      },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
      cancel_url: `${cancelUrl}?booking_id=${booking.id}`,
    }, {
      // Idempotency key i lidhur me bookingId + amount + retry-bucket prej koh-it
      // perafert (15-min bucket): brenda nje dritareje 15min, retries kthejne
      // te njejtin session; pas 15min mund te krijohet nje i ri (psh klienti
      // u kthye dite me vone me 'Vazhdo pagesen').
      idempotencyKey: `checkout-${booking.id}-${totalAmountCents}-${Math.floor(Date.now() / (15 * 60 * 1000))}`,
    });

    // Ruaj session.id ne booking per tracking. Nese update deshton (psh
    // network), reuse-logjika ne fillim te request-it tjeter do gjeje
    // session-in e ri ne Stripe permes idempotency (te njejtin response).
    const { error: updateErr } = await admin
      .from("bookings")
      .update({
        stripe_session_id: session.id,
        payment_method: "stripe",
      })
      .eq("id", booking.id);
    if (updateErr) {
      console.error("Failed to save stripe_session_id:", updateErr);
      // S'kthen 500 sepse session eshte krijuar ne Stripe — useri mund te paguaje
    }

    return jsonResponse(req, {
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return jsonResponse(req, {
      error: err instanceof Error ? err.message : "Unknown error",
    }, 500);
  }
});
