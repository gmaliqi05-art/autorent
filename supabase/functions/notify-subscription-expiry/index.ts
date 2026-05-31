import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ResultSummary {
  expiringChecked: number;
  expiringNotified: number;
  expiredChecked: number;
  expiredNotified: number;
  errors: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const summary: ResultSummary = {
      expiringChecked: 0,
      expiringNotified: 0,
      expiredChecked: 0,
      expiredNotified: 0,
      errors: [],
    };

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const cooldownStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const { data: expiringCompanies, error: expiringError } = await supabase
      .from("companies")
      .select("id,name,email,owner_id,subscription_expires_at,subscription_status,subscription_plan_id")
      .eq("subscription_status", "active")
      .gt("subscription_expires_at", now.toISOString())
      .lt("subscription_expires_at", in7Days.toISOString());

    if (expiringError) {
      summary.errors.push(`expiring_query: ${expiringError.message}`);
    } else if (expiringCompanies) {
      summary.expiringChecked = expiringCompanies.length;

      for (const c of expiringCompanies) {
        if (!c.email) continue;

        const { data: recentLog } = await supabase
          .from("email_logs")
          .select("id")
          .eq("recipient_email", c.email)
          .eq("email_type", "subscription_expiring")
          .gt("created_at", cooldownStart)
          .limit(1);

        if (recentLog && recentLog.length > 0) continue;

        const expiryDate = new Date(c.subscription_expires_at);
        const daysLeft = Math.max(
          0,
          Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        );

        const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            recipientEmail: c.email,
            recipientName: c.name,
            emailType: "subscription_expiring",
            templateData: {
              companyName: c.name,
              expiryDate: expiryDate.toLocaleDateString("sq-AL"),
              daysLeft: String(daysLeft),
            },
            referenceId: c.id,
            referenceType: "company",
          }),
        });

        if (sendRes.ok) {
          summary.expiringNotified += 1;

          if (c.owner_id) {
            await supabase.from("notifications").insert({
              user_id: c.owner_id,
              title: "Abonimi po skadon",
              message: `Abonimi juaj skadon ne ${daysLeft} dite. Rinovojeni per te shmangur nderprerjen e sherbimit.`,
              type: "alert",
              reference_id: c.id,
              reference_type: "company",
            });
          }
        } else {
          summary.errors.push(`send_expiring_${c.id}: ${sendRes.status}`);
        }
      }
    }

    const { data: expiredCompanies, error: expiredError } = await supabase
      .from("companies")
      .select("id,name,email,owner_id,subscription_expires_at,subscription_status")
      .eq("subscription_status", "active")
      .lt("subscription_expires_at", now.toISOString());

    if (expiredError) {
      summary.errors.push(`expired_query: ${expiredError.message}`);
    } else if (expiredCompanies) {
      summary.expiredChecked = expiredCompanies.length;

      for (const c of expiredCompanies) {
        await supabase
          .from("companies")
          .update({ subscription_status: "expired" })
          .eq("id", c.id);

        if (!c.email) continue;

        const { data: recentLog } = await supabase
          .from("email_logs")
          .select("id")
          .eq("recipient_email", c.email)
          .eq("email_type", "subscription_expired")
          .gt("created_at", cooldownStart)
          .limit(1);

        if (recentLog && recentLog.length > 0) continue;

        const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            recipientEmail: c.email,
            recipientName: c.name,
            emailType: "subscription_expired",
            templateData: {
              companyName: c.name,
              expiryDate: new Date(c.subscription_expires_at).toLocaleDateString("sq-AL"),
            },
            referenceId: c.id,
            referenceType: "company",
          }),
        });

        if (sendRes.ok) {
          summary.expiredNotified += 1;

          if (c.owner_id) {
            await supabase.from("notifications").insert({
              user_id: c.owner_id,
              title: "Abonimi ka skaduar",
              message: `Abonimi juaj ka skaduar. Rinovojeni qe te vazhdoni te perdorni RentaKar.`,
              type: "alert",
              reference_id: c.id,
              reference_type: "company",
            });
          }
        } else {
          summary.errors.push(`send_expired_${c.id}: ${sendRes.status}`);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, ...summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
