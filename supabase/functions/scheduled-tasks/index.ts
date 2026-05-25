import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

// Edge Function qe ekzekuton task-e te skeduluara.
// Thirret nga pg_cron cdo 15 minuta (ose me shpesh).
// Verifikon header X-Cron-Secret per t'u siguruar qe vetem cron mund ta thrresi.
//
// Deploy: `supabase functions deploy scheduled-tasks --no-verify-jwt`
// (perdor verifikim me secret te brendshem ne vend te JWT)

interface Booking {
  id: string;
  client_id: string;
  company_id: string;
  vehicle_id: string;
  pickup_date: string;
  return_date: string;
  status: string;
  payment_status: string;
  total_price: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  created_at: string;
}

interface Vehicle {
  brand: string;
  model: string;
}

interface Company {
  name: string;
  phone: string;
  email: string;
  city: string;
}

async function callSendEmail(supabase: ReturnType<typeof createClient>, params: {
  recipientEmail: string;
  recipientName: string;
  emailType: string;
  templateData: Record<string, unknown>;
  referenceId?: string;
  referenceType?: string;
}) {
  // Therrasim direkt funksionin send-email permes pg
  const { error } = await supabase.functions.invoke("send-email", { body: params });
  if (error) console.error("send-email failed:", error);
}

Deno.serve(async (req: Request) => {
  // Vetem POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Verifiko cron secret kunder Vault (jo env var) — me siguri
  const providedSecret = req.headers.get("x-cron-secret");
  if (!providedSecret) {
    return new Response("Missing x-cron-secret header", { status: 401 });
  }
  const { data: isValid, error: verifyErr } = await supabase.rpc(
    "is_cron_secret_valid",
    { p_secret: providedSecret },
  );
  if (verifyErr || !isValid) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split("T")[0];

  const results = {
    reminders_sent: 0,
    auto_cancelled: 0,
    activated: 0,
    completed: 0,
    identity_stale_failed: 0,
    errors: [] as string[],
  };

  // ===== 1. Pickup reminders 24h before =====
  try {
    const { data: upcoming } = await supabase
      .from("bookings")
      .select(`
        id, client_id, company_id, vehicle_id, pickup_date, return_date,
        status, payment_status, total_price, deposit_amount,
        client_name, client_email, client_phone,
        vehicle:vehicles(brand, model),
        company:companies(name, phone, email, city)
      `)
      .eq("status", "confirmed")
      .eq("pickup_date", tomorrow)
      .is("pickup_reminder_sent_at", null);

    for (const b of (upcoming || [])) {
      // deno-lint-ignore no-explicit-any
      const booking = b as any as Booking & { vehicle: Vehicle; company: Company; deposit_amount: number };
      try {
        await callSendEmail(supabase, {
          recipientEmail: booking.client_email,
          recipientName: booking.client_name,
          emailType: "pickup_reminder",
          templateData: {
            vehicleName: `${booking.vehicle?.brand} ${booking.vehicle?.model}`,
            companyName: booking.company?.name || "",
            companyPhone: booking.company?.phone || "",
            pickupDate: new Date(booking.pickup_date).toLocaleDateString("sq-AL"),
            pickupTime: "Sipas marreveshjes",
            pickupLocation: booking.company?.city || "",
            deposit: booking.deposit_amount || 0,
          },
          referenceId: booking.id,
          referenceType: "booking",
        });
        // Notification ne DB → auto-trigger push
        if (booking.client_id) {
          await supabase.from("notifications").insert({
            user_id: booking.client_id,
            title: "Pickup neser",
            message: `${booking.vehicle?.brand} ${booking.vehicle?.model} ju pret neser. Mos harroni dokumentet.`,
            type: "pickup_reminder",
            reference_id: booking.id,
            reference_type: "booking",
          });
        }
        await supabase
          .from("bookings")
          .update({ pickup_reminder_sent_at: new Date().toISOString() })
          .eq("id", booking.id);
        results.reminders_sent++;
      } catch (e) {
        results.errors.push(`reminder ${booking.id}: ${(e as Error).message}`);
      }
    }
  } catch (e) {
    results.errors.push(`reminders block: ${(e as Error).message}`);
  }

  // ===== 2. Auto-cancel pending bookings older than 48h =====
  try {
    const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
    const { data: stale } = await supabase
      .from("bookings")
      .select("id, client_id, client_email, client_name, vehicle:vehicles(brand, model)")
      .eq("status", "pending")
      .lt("created_at", cutoff);

    for (const b of (stale || [])) {
      // deno-lint-ignore no-explicit-any
      const booking = b as any;
      try {
        await supabase
          .from("bookings")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            cancelled_by: null,
            internal_notes: "Auto-cancelled: pending mbi 48h pa konfirmim",
          })
          .eq("id", booking.id);

        await callSendEmail(supabase, {
          recipientEmail: booking.client_email,
          recipientName: booking.client_name,
          emailType: "booking_cancelled",
          templateData: {
            vehicleName: `${booking.vehicle?.brand} ${booking.vehicle?.model}`,
            cancelDate: new Date().toLocaleDateString("sq-AL"),
          },
          referenceId: booking.id,
          referenceType: "booking",
        });
        if (booking.client_id) {
          await supabase.from("notifications").insert({
            user_id: booking.client_id,
            title: "Booking u anulua",
            message: `${booking.vehicle?.brand} ${booking.vehicle?.model} u anulua: 48h pa konfirmim.`,
            type: "booking_cancelled",
            reference_id: booking.id,
            reference_type: "booking",
          });
        }
        results.auto_cancelled++;
      } catch (e) {
        results.errors.push(`auto-cancel ${booking.id}: ${(e as Error).message}`);
      }
    }
  } catch (e) {
    results.errors.push(`auto-cancel block: ${(e as Error).message}`);
  }

  // ===== 3. Activate confirmed bookings on pickup day =====
  try {
    const { data: activating, error: actErr } = await supabase
      .from("bookings")
      .update({ status: "active" })
      .eq("status", "confirmed")
      .lte("pickup_date", today)
      .select("id");
    if (actErr) throw actErr;
    results.activated = activating?.length || 0;
  } catch (e) {
    results.errors.push(`activate block: ${(e as Error).message}`);
  }

  // ===== 3.5. Auto-fail Stripe Identity verifications stuck > 24h =====
  // Risk #1 nga audit: useri ngec ne 'processing' nese webhook humb event-in
  // perfundimtar. Auto-fail i jep mundesi te riprovoje pa kontakt support.
  try {
    const cutoff = new Date(now);
    cutoff.setHours(cutoff.getHours() - 24);
    const cutoffIso = cutoff.toISOString();

    const { data: staleDocs, error: staleErr } = await supabase
      .from("client_documents")
      .update({
        stripe_verification_status: "requires_action",
        rejection_reason: "Verifikimi ngeci ne procesim — provoni perseri.",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_verification_status", "processing")
      .eq("verified", false)
      .lt("updated_at", cutoffIso)
      .select("client_id");

    if (staleErr) throw staleErr;
    results.identity_stale_failed = staleDocs?.length || 0;

    // Notification per cdo user te prekur (push + bell)
    for (const doc of staleDocs || []) {
      try {
        await supabase.from("notifications").insert({
          user_id: doc.client_id,
          title: "Verifikimi i identitetit",
          message: "Verifikimi i patentes ngeci ne procesim. Provoni perseri nga seksioni i profilit.",
          type: "identity_verification_stale",
          template_key: "identity_stale",
          template_vars: {},
        });
      } catch (e) {
        results.errors.push(`identity-notif ${doc.client_id}: ${(e as Error).message}`);
      }
    }
  } catch (e) {
    results.errors.push(`identity stale block: ${(e as Error).message}`);
  }

  // ===== 4. Complete active bookings after return date =====
  try {
    const { data: completing, error: cmpErr } = await supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("status", "active")
      .lt("return_date", today)
      .select("id, client_id, client_email, client_name, vehicle:vehicles(brand, model), pickup_date, return_date");
    if (cmpErr) throw cmpErr;
    results.completed = completing?.length || 0;

    // Dergo email kerkim recensioni
    for (const b of (completing || [])) {
      // deno-lint-ignore no-explicit-any
      const booking = b as any;
      try {
        await callSendEmail(supabase, {
          recipientEmail: booking.client_email,
          recipientName: booking.client_name,
          emailType: "review_request",
          templateData: {
            vehicleName: `${booking.vehicle?.brand} ${booking.vehicle?.model}`,
          },
          referenceId: booking.id,
          referenceType: "booking",
        });
        if (booking.client_id) {
          await supabase.from("notifications").insert({
            user_id: booking.client_id,
            title: "Si shkoi udhetimi?",
            message: `Le nje review per ${booking.vehicle?.brand} ${booking.vehicle?.model}.`,
            type: "review_request",
            reference_id: booking.id,
            reference_type: "booking",
          });
        }
      } catch (e) {
        results.errors.push(`review-req ${booking.id}: ${(e as Error).message}`);
      }
    }
  } catch (e) {
    results.errors.push(`complete block: ${(e as Error).message}`);
  }

  return new Response(JSON.stringify({ ok: true, ...results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
