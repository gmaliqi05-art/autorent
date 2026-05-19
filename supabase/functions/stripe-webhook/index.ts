import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@17.5.0";

// Webhook-u i Stripe-it NUK perdor CORS-in normal (Stripe nuk eshte browser).
// Stripe nuk dergon JWT — verifikimi behet me signing secret.
// Deploy me: `supabase functions deploy stripe-webhook --no-verify-jwt`

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceKey) {
    console.error("Missing env vars");
    return new Response("Server not configured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = new Stripe(stripeSecret, { apiVersion: "2024-12-18.acacia" });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (err) {
    console.error("Signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id || session.client_reference_id;
        if (!bookingId) {
          console.error("No booking_id in session metadata");
          break;
        }

        if (session.payment_status === "paid") {
          await admin
            .from("bookings")
            .update({
              payment_status: "paid",
              status: "confirmed",
              stripe_payment_intent_id: session.payment_intent as string,
              paid_at: new Date().toISOString(),
            })
            .eq("id", bookingId);

          // Update fatura si paid (nese ekziston)
          await admin
            .from("invoices")
            .update({
              status: "paid",
              payment_status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("booking_id", bookingId);

          console.log(`Booking ${bookingId} marked as paid`);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id || session.client_reference_id;
        if (bookingId) {
          // E lejmë booking-un pending por shenojme qe sesioni skadoi
          console.log(`Checkout session expired for booking ${bookingId}`);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const bookingId = intent.metadata?.booking_id;
        if (bookingId) {
          await admin
            .from("bookings")
            .update({
              payment_status: "failed",
            })
            .eq("id", bookingId);
          console.log(`Booking ${bookingId} payment failed`);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const intentId = typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;
        if (intentId) {
          await admin
            .from("bookings")
            .update({
              payment_status: "refunded",
              status: "cancelled",
            })
            .eq("stripe_payment_intent_id", intentId);
          console.log(`Payment refunded for intent ${intentId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
