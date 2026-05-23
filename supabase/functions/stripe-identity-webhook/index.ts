// Edge function: stripe-identity-webhook
//
// Pranon webhooks nga Stripe per Identity verification events.
// Perditeson client_documents kur verifikimi ndryshon status.
//
// Eventet qe trajtohen:
// - identity.verification_session.verified         => verified=true, OCR data ruajtur
// - identity.verification_session.requires_input   => rejection_reason ruajtur
// - identity.verification_session.canceled         => status=canceled
// - identity.verification_session.processing       => status=processing
//
// Deploy: supabase functions deploy stripe-identity-webhook --no-verify-jwt
//
// Env vars:
//   STRIPE_SECRET_KEY
//   STRIPE_IDENTITY_WEBHOOK_SECRET  (diferent nga STRIPE_WEBHOOK_SECRET i checkout-it)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@17.5.0";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_IDENTITY_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceKey) {
    console.error("[identity-webhook] Missing env vars");
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
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[identity-webhook] Signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.user_id;

    if (!userId) {
      console.warn("[identity-webhook] No user_id in metadata for session", session.id);
      return new Response("Missing metadata.user_id", { status: 200 });
    }

    switch (event.type) {
      case "identity.verification_session.verified": {
        // Marrim verified outputs (kerkojne expand)
        const fullSession = await stripe.identity.verificationSessions.retrieve(session.id, {
          expand: ["verified_outputs"],
        });
        const v = fullSession.verified_outputs as Record<string, unknown> | null;

        const extractedData = {
          first_name: v?.first_name ?? null,
          last_name: v?.last_name ?? null,
          dob: v?.dob ?? null,
          id_number: v?.id_number ?? null,
          address: v?.address ?? null,
          document_type: (fullSession.last_verification_report as { document?: { type?: string } } | null)?.document?.type ?? null,
        };

        const { error: updErr } = await admin
          .from("client_documents")
          .update({
            verified: true,
            verified_at: new Date().toISOString(),
            verified_via: "stripe_identity",
            stripe_verification_session_id: session.id,
            stripe_verification_status: "verified",
            stripe_verified_at: new Date().toISOString(),
            stripe_extracted_data: extractedData,
            rejection_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq("client_id", userId);

        if (updErr) {
          console.error("[identity-webhook] Update failed:", updErr);
          return new Response("Update failed", { status: 500 });
        }

        // Krijo notification per klientin
        await admin.from("notifications").insert({
          user_id: userId,
          title: "Verifikimi i patentës u krye!",
          message: "Patenta juaj u verifikua me sukses përmes Stripe Identity. Tani mund të bëni rezervime.",
          type: "identity_verified",
          reference_id: null,
          reference_type: "client_documents",
        });

        console.log(`[identity-webhook] Verified user ${userId} via session ${session.id}`);
        break;
      }

      case "identity.verification_session.requires_input": {
        const reason = (session.last_error?.reason ?? "Verifikimi dështoi. Provoni përsëri ose ngarkoni dokumente manualisht.");
        await admin
          .from("client_documents")
          .update({
            stripe_verification_status: "requires_input",
            rejection_reason: reason,
            updated_at: new Date().toISOString(),
          })
          .eq("client_id", userId);

        await admin.from("notifications").insert({
          user_id: userId,
          title: "Verifikimi i patentës kërkon veprim",
          message: reason,
          type: "identity_requires_input",
          reference_type: "client_documents",
        });

        console.log(`[identity-webhook] Requires input for user ${userId}: ${reason}`);
        break;
      }

      case "identity.verification_session.canceled": {
        await admin
          .from("client_documents")
          .update({
            stripe_verification_status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("client_id", userId);
        console.log(`[identity-webhook] Canceled session for user ${userId}`);
        break;
      }

      case "identity.verification_session.processing": {
        await admin
          .from("client_documents")
          .update({
            stripe_verification_status: "processing",
            updated_at: new Date().toISOString(),
          })
          .eq("client_id", userId);
        break;
      }

      default:
        console.log(`[identity-webhook] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error("[identity-webhook] Handler error:", err);
    return new Response("Handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
