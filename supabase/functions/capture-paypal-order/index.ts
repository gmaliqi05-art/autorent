import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";

// Pas qe perdoruesi aprovon ne PayPal dhe kthehet ne return_url,
// front-end therret kete function qe te capture-oje pagesen.

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
  if (!resp.ok) throw new Error(`PayPal auth failed: ${resp.status}`);
  const data = await resp.json();
  return data.access_token;
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

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return jsonResponse(req, { error: "Unauthorized" }, 401);
    }
    const userId = userData.user.id;

    const { orderId } = await req.json();
    if (!orderId) {
      return jsonResponse(req, { error: "Missing orderId" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Gjej booking qe i takon ketij orderId + user-i
    const { data: booking } = await admin
      .from("bookings")
      .select("id, client_id, payment_status, total_price")
      .eq("paypal_order_id", orderId)
      .eq("client_id", userId)
      .maybeSingle();

    if (!booking) {
      return jsonResponse(req, { error: "Booking not found" }, 404);
    }

    if (booking.payment_status === "paid") {
      return jsonResponse(req, { success: true, alreadyPaid: true });
    }

    // Capture order ne PayPal
    const accessToken = await getPaypalAccessToken(paypalClientId, paypalSecret);
    const captureResp = await fetch(
      `${paypalApiBase()}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const captureData = await captureResp.json();
    if (!captureResp.ok) {
      console.error("PayPal capture failed:", captureData);
      return jsonResponse(req, {
        error: captureData.message || "PayPal capture failed",
      }, 502);
    }

    if (captureData.status !== "COMPLETED") {
      return jsonResponse(req, {
        error: `Capture status: ${captureData.status}`,
      }, 502);
    }

    const captureId =
      captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;

    // Update booking
    await admin
      .from("bookings")
      .update({
        payment_status: "paid",
        status: "confirmed",
        paypal_capture_id: captureId,
        paid_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    // Update invoice nese ekziston
    await admin
      .from("invoices")
      .update({
        status: "paid",
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("booking_id", booking.id);

    return jsonResponse(req, {
      success: true,
      bookingId: booking.id,
      captureId,
    });
  } catch (err) {
    console.error("capture-paypal-order error:", err);
    return jsonResponse(req, {
      error: err instanceof Error ? err.message : "Unknown error",
    }, 500);
  }
});
