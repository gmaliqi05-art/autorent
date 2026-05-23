// Edge function: create-identity-verification
//
// Krijon nje Stripe Identity Verification Session per klientin aktual.
// Kthen URL e Stripe-hosted faqes ku klienti do te ngarkoje dokumentet.
//
// POST /functions/v1/create-identity-verification
// Body: { returnUrl: string }  (URL ku ridrejton pas verifikimit)
// Response: { sessionId, clientSecret, url }
//
// Authorization: kerkon JWT te perdoruesit (vetem client mund te thirre).
// verify_jwt = true (default).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@17.5.0";
import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";

interface ReqBody {
  returnUrl?: string;
}

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!stripeSecret || !supabaseUrl || !serviceKey || !anonKey) {
    return jsonResponse(req, { error: "Server not configured" }, 500);
  }

  // Verifikoj user-in
  const authHeader = req.headers.get("authorization") || "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return jsonResponse(req, { error: "Unauthorized" }, 401);
  }
  const userId = userData.user.id;

  let body: ReqBody;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // returnUrl validation — vetem origjina jone
  const allowedOrigins = (Deno.env.get("CORS_ALLOWED_ORIGINS") || "https://rentcars.life,http://localhost:5173")
    .split(",")
    .map((o) => o.trim());
  const returnUrl = body.returnUrl || `${allowedOrigins[0]}/dashboard/profili?identity_verification=complete`;
  try {
    const parsed = new URL(returnUrl);
    const matches = allowedOrigins.some((o) => returnUrl.startsWith(o));
    if (!matches) {
      console.warn("[identity] returnUrl outside allowed origins:", parsed.origin);
      return jsonResponse(req, { error: "Invalid returnUrl origin" }, 400);
    }
  } catch {
    return jsonResponse(req, { error: "Invalid returnUrl" }, 400);
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2024-12-18.acacia" });

  // Krijo verification session
  let session: Stripe.Identity.VerificationSession;
  try {
    session = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: { user_id: userId },
      return_url: returnUrl,
      options: {
        document: {
          allowed_types: ["driving_license", "passport", "id_card"],
          require_id_number: true,
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
    });
  } catch (err) {
    console.error("[identity] Stripe session create failed:", err);
    return jsonResponse(req, {
      error: err instanceof Error ? err.message : "Stripe error",
    }, 500);
  }

  // Mban session-in ne DB me service_role
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Krijo ose update rresht ekzistues client_documents
  const { data: existing } = await admin
    .from("client_documents")
    .select("client_id")
    .eq("client_id", userId)
    .maybeSingle();

  if (existing) {
    await admin
      .from("client_documents")
      .update({
        stripe_verification_session_id: session.id,
        stripe_verification_status: session.status,
        updated_at: new Date().toISOString(),
      })
      .eq("client_id", userId);
  } else {
    await admin.from("client_documents").insert({
      client_id: userId,
      stripe_verification_session_id: session.id,
      stripe_verification_status: session.status,
    });
  }

  return jsonResponse(req, {
    sessionId: session.id,
    clientSecret: session.client_secret,
    url: session.url,
    status: session.status,
  });
});
