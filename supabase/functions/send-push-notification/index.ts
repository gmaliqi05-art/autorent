/**
 * send-push-notification
 *
 * Dergon Web Push notifications te te gjitha pajisjet e nje user-i.
 *
 * Authorization (njera nga te dyja):
 *  - `Authorization: Bearer <service_role JWT>` (per edge functions te tjera)
 *  - `x-push-secret: <push_secret>` (per DB triggers nepermjet pg_net)
 *
 * Klienti i browser-it nuk e thrret kete funksion direkt.
 *
 * Body:
 *  {
 *    user_id: string,
 *    title: string,
 *    body: string,
 *    url?: string,         // path qe hapet ne click (default "/dashboard")
 *    icon?: string,
 *    tag?: string,         // grupon notification-et
 *    data?: object,
 *  }
 *
 * Env:
 *  SUPABASE_URL
 *  SUPABASE_SERVICE_ROLE_KEY
 *  VAPID_PUBLIC_KEY
 *  VAPID_PRIVATE_KEY
 *  VAPID_SUBJECT          (mailto:contact@rentcars.life)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import webpush from "npm:web-push@3.6.7";

interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

interface Subscription {
  id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

// Constant-time string comparison per mbrojtje nga timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

type LogStatus = "sent" | "partial" | "failed" | "no_subscriptions" | "push_disabled" | "no_vapid";

async function logResult(
  supabase: ReturnType<typeof createClient>,
  fields: {
    user_id?: string;
    notification_id?: string | null;
    status: LogStatus;
    subscriptions_total?: number;
    sent_count?: number;
    expired_count?: number;
    error_message?: string;
  },
): Promise<void> {
  // Fire-and-forget; nese log-imi deshton vete, mos blockoji response.
  try {
    await supabase.from("push_send_log").insert({
      user_id: fields.user_id ?? null,
      notification_id: fields.notification_id ?? null,
      status: fields.status,
      subscriptions_total: fields.subscriptions_total ?? 0,
      sent_count: fields.sent_count ?? 0,
      expired_count: fields.expired_count ?? 0,
      error_message: fields.error_message ?? null,
    });
  } catch (err) {
    console.error("[push] log insert failed:", err);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:contact@rentcars.life";

  if (!supabaseUrl || !serviceKey) {
    return new Response("Supabase env missing", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  if (!vapidPublic || !vapidPrivate) {
    await logResult(supabase, { status: "no_vapid", error_message: "VAPID keys not configured" });
    return new Response("VAPID keys not configured", { status: 500 });
  }

  // Auth: ose Bearer = service_role, ose x-push-secret = vault push_secret.
  const authHeader = req.headers.get("authorization") || "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "");
  const pushSecret = req.headers.get("x-push-secret") || "";

  let authorized = false;
  if (bearer && timingSafeEqual(bearer, serviceKey)) {
    authorized = true;
  } else if (pushSecret) {
    const { data: ok } = await supabase.rpc("is_push_secret_valid", { p_secret: pushSecret });
    authorized = ok === true;
  }
  if (!authorized) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: PushPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!payload.user_id || !payload.title || !payload.body) {
    return new Response("Missing required fields", { status: 400 });
  }

  // Kontrollo preferencat
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("push_enabled")
    .eq("user_id", payload.user_id)
    .maybeSingle();

  const notificationId = (payload.data?.notification_id as string | undefined) ?? null;

  if (prefs && prefs.push_enabled === false) {
    await logResult(supabase, {
      user_id: payload.user_id,
      notification_id: notificationId,
      status: "push_disabled",
    });
    return new Response(
      JSON.stringify({ skipped: true, reason: "push_disabled" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // Merr subscription-et e user-it
  const { data: subs, error: subsErr } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh_key, auth_key")
    .eq("user_id", payload.user_id);

  if (subsErr) {
    await logResult(supabase, {
      user_id: payload.user_id,
      notification_id: notificationId,
      status: "failed",
      error_message: `DB error: ${subsErr.message}`,
    });
    return new Response(`DB error: ${subsErr.message}`, { status: 500 });
  }
  if (!subs || subs.length === 0) {
    await logResult(supabase, {
      user_id: payload.user_id,
      notification_id: notificationId,
      status: "no_subscriptions",
    });
    return new Response(
      JSON.stringify({ sent: 0, reason: "no_subscriptions" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/dashboard",
    icon: payload.icon || "/icons/icon-192.png",
    tag: payload.tag,
    data: payload.data || {},
  });

  let sent = 0;
  const expiredIds: string[] = [];
  const errors: string[] = [];

  await Promise.all(
    (subs as Subscription[]).map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key,
            },
          },
          pushPayload,
          { TTL: 3600 },
        );
        sent++;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription ka skaduar — fshije
          expiredIds.push(sub.id);
        } else {
          errors.push(`${statusCode ?? "?"}: ${(err as Error).message ?? "unknown"}`);
          console.error("[push] send failed:", statusCode, err);
        }
      }
    }),
  );

  if (expiredIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", expiredIds);
  }
  if (sent > 0) {
    // perditeso last_used_at
    await supabase
      .from("push_subscriptions")
      .update({ last_used_at: new Date().toISOString() })
      .eq("user_id", payload.user_id);
  }

  const logStatus: LogStatus =
    sent === subs.length
      ? "sent"
      : sent > 0
        ? "partial"
        : "failed";

  await logResult(supabase, {
    user_id: payload.user_id,
    notification_id: notificationId,
    status: logStatus,
    subscriptions_total: subs.length,
    sent_count: sent,
    expired_count: expiredIds.length,
    error_message: errors.length > 0 ? errors.join("; ").slice(0, 1000) : undefined,
  });

  return new Response(
    JSON.stringify({ sent, expired: expiredIds.length, total: subs.length }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
