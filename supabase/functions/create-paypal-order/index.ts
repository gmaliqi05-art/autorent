import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit, extractRateLimitKey } from "../_shared/rateLimit.ts";

// PayPal REST API base — switch nga sandbox ne live duke vendosur PAYPAL_ENV=live
function paypalApiBase(): string {
  const env = (Deno.env.get("PAYPAL_ENV") || "sandbox").toLowerCase();
  return env === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getPaypalAccessToken(clientId: string, secret: string): Promise<string> {
  const resp = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!resp.ok) {
    throw new Error(`PayPal auth failed: ${resp.status}`);
  }
  const data = await resp.json();
  return data.access_token;
}

interface CreateOrderRequest {
  bookingId: string;
  returnUrl: string;
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
    if (!authHeader) return jsonResponse(req, { error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const paypalSecret = Deno.env.get("PAYPAL_SECRET");

    if (!paypalClientId || !paypalSecret) {
      return jsonResponse(req, { error: "PayPal not configured" }, 500);
    }

    // Verifiko user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return jsonResponse(req, { error: "Unauthorized" }, 401);
    }
    const userId = userData.user.id;

    // Rate limit
    const admin = createClient(supabaseUrl, serviceKey);
    const allowed = await checkRateLimit(admin, {
      key: extractRateLimitKey(req, "create-paypal-order", userId),
      maxCount: 10,
      windowSeconds: 60,
    });
    if (!allowed) {
      return jsonResponse(req, { error: "Too many requests" }, 429);
    }

    // Parse body
    const body = (await req.json()) as CreateOrderRequest;
    const { bookingId, returnUrl, cancelUrl } = body;
    if (!bookingId || !returnUrl || !cancelUrl) {
      return jsonResponse(req, { error: "Missing required fields" }, 400);
    }

    // Merr booking
    const { data: booking, error: bookingErr } = await admin
      .from("bookings")
      .select(`id, client_id, total_price, status, payment_status, vehicle:vehicles(brand, model, year), company:companies(name)`)
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

    // deno-lint-ignore no-explicit-any
    const vehicle = (booking as any).vehicle;
    // deno-lint-ignore no-explicit-any
    const company = (booking as any).company;
    const vehicleName = vehicle
      ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}`
      : "Automjet";

    // Krijo PayPal order
    const accessToken = await getPaypalAccessToken(paypalClientId, paypalSecret);
    const orderResp = await fetch(`${paypalApiBase()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: booking.id,
          description: `${vehicleName} - ${company?.name || "RentaKar"}`,
          custom_id: booking.id,
          amount: {
            currency_code: "EUR",
            value: Number(booking.total_price).toFixed(2),
          },
        }],
        application_context: {
          brand_name: "RentaKar",
          locale: "en-US",
          landing_page: "LOGIN",
          user_action: "PAY_NOW",
          return_url: `${returnUrl}?booking_id=${booking.id}`,
          cancel_url: `${cancelUrl}?booking_id=${booking.id}`,
        },
      }),
    });

    if (!orderResp.ok) {
      const errText = await orderResp.text();
      console.error("PayPal order creation failed:", errText);
      return jsonResponse(req, { error: "PayPal order creation failed" }, 502);
    }

    const order = await orderResp.json();
    const approveLink = order.links?.find((l: { rel: string; href: string }) =>
      l.rel === "approve"
    )?.href;

    // Ruaj order ID ne booking
    await admin
      .from("bookings")
      .update({
        paypal_order_id: order.id,
        payment_method: "paypal",
      })
      .eq("id", booking.id);

    return jsonResponse(req, {
      orderId: order.id,
      approveUrl: approveLink,
    });
  } catch (err) {
    console.error("create-paypal-order error:", err);
    return jsonResponse(req, {
      error: err instanceof Error ? err.message : "Unknown error",
    }, 500);
  }
});
