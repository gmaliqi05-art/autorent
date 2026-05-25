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

  // Idempotency: INSERT event.id me ON CONFLICT DO NOTHING. Nese eshte
  // procesuar tashme, kthej 200 OK pa re-procesim — Stripe e konsideron
  // dergesen e suksesshme dhe nuk ri-dergon.
  const { data: insertedEvent, error: insertErr } = await admin
    .from("stripe_webhook_events")
    .insert({
      event_id: event.id,
      event_type: event.type,
      payload_summary: { livemode: event.livemode, created: event.created },
    })
    .select("event_id")
    .maybeSingle();

  if (insertErr && insertErr.code !== "23505") {
    // Gabim tjeter perveç duplicate — log dhe kthe 500 qe Stripe te ri-dergoje
    console.error("Failed to record webhook event:", insertErr);
    return new Response(`DB error: ${insertErr.message}`, { status: 500 });
  }

  if (!insertedEvent) {
    // event_id ekzistonte tashme — duplicate, skip processing
    console.log(`Stripe webhook event ${event.id} (${event.type}) tashme i procesuar, skipohet`);
    return new Response(
      JSON.stringify({ received: true, duplicate: true, event_id: event.id }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

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

          // Krijo notifications per klient + pronar (auto-trigger push)
          const { data: bk } = await admin
            .from("bookings")
            .select("client_id, company_id, total_price, currency, vehicle:vehicles(brand, model), company:companies(owner_id, name)")
            .eq("id", bookingId)
            .maybeSingle();

          if (bk) {
            // deno-lint-ignore no-explicit-any
            const b = bk as any;
            const vehicleName = `${b.vehicle?.brand || ""} ${b.vehicle?.model || ""}`.trim();
            const amount = b.total_price ? `${b.total_price} ${b.currency || "EUR"}` : "";

            const rows: Array<Record<string, unknown>> = [];
            if (b.client_id) {
              rows.push({
                user_id: b.client_id,
                title: "Pagesa u konfirmua",
                message: `Pagesa juaj ${amount} per ${vehicleName} u krye me sukses.`,
                type: "payment_success",
                reference_id: bookingId,
                reference_type: "booking",
              });
            }
            if (b.company?.owner_id) {
              rows.push({
                user_id: b.company.owner_id,
                title: "Pagese e re per booking",
                message: `${amount} u arketua per ${vehicleName}.`,
                type: "payment_success",
                reference_id: bookingId,
                reference_type: "booking",
              });
            }
            if (rows.length > 0) {
              const { error: nErr } = await admin.from("notifications").insert(rows);
              if (nErr) console.error("notification insert failed:", nErr);
            }
          }

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

          const { data: bk } = await admin
            .from("bookings")
            .select("client_id, vehicle:vehicles(brand, model)")
            .eq("id", bookingId)
            .maybeSingle();
          // deno-lint-ignore no-explicit-any
          const b = bk as any;
          if (b?.client_id) {
            await admin.from("notifications").insert({
              user_id: b.client_id,
              title: "Pagesa nuk u krye",
              message: `Pagesa per ${b.vehicle?.brand || ""} ${b.vehicle?.model || ""} deshtoi. Provo perseri.`,
              type: "payment_failed",
              reference_id: bookingId,
              reference_type: "booking",
            });
          }
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
