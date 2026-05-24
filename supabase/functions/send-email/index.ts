import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit, extractRateLimitKey } from "../_shared/rateLimit.ts";

interface EmailRequest {
  recipientEmail: string;
  recipientName: string;
  emailType: string;
  templateData: Record<string, unknown>;
  referenceId?: string;
  referenceType?: string;
}

interface ResendResponse {
  id?: string;
  message?: string;
  name?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function replacePlaceholders(
  template: string,
  data: Record<string, unknown>,
  context: "html" | "text" = "text",
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = data[key];
    if (value === null || value === undefined) return "";
    const str = String(value);
    return context === "html" ? escapeHtml(str) : str;
  });
}

async function sendViaResend(params: {
  apiKey: string;
  from: string;
  replyTo?: string;
  to: string;
  toName: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const body: Record<string, unknown> = {
    from: params.from,
    to: [params.toName ? `${params.toName} <${params.to}>` : params.to],
    subject: params.subject,
    html: params.html,
  };
  if (params.text) body.text = params.text;
  if (params.replyTo) body.reply_to = params.replyTo;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await resp.json().catch(() => ({}))) as ResendResponse;

  if (!resp.ok) {
    const errMsg = data.message || data.name || `HTTP ${resp.status}`;
    return { ok: false, error: errMsg };
  }
  if (!data.id) {
    return { ok: false, error: "Resend did not return an id" };
  }
  return { ok: true, id: data.id };
}

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") ||
      "RentaKar <onboarding@resend.dev>";
    const resendReplyTo = Deno.env.get("RESEND_REPLY_TO");

    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse(req, { error: "Supabase env not configured" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verifiko user-in nga JWT (perdoret per rate-limit key)
    const authHeader = req.headers.get("Authorization");
    let userId: string | undefined;
    if (authHeader) {
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      userId = userData.user?.id;
    }

    // Rate limit: 30 emails/min per user, 10/min per IP nese pa user
    const rateLimitKey = extractRateLimitKey(req, "send-email", userId);
    const allowed = await checkRateLimit(supabase, {
      key: rateLimitKey,
      maxCount: userId ? 30 : 10,
      windowSeconds: 60,
    });
    if (!allowed) {
      return jsonResponse(req, {
        error: "Too many requests. Provoni perseri pas nje minute.",
      }, 429);
    }

    const emailRequest = (await req.json()) as EmailRequest;
    const {
      recipientEmail,
      recipientName,
      emailType,
      templateData,
      referenceId,
      referenceType,
    } = emailRequest;

    if (!recipientEmail || !emailType) {
      return jsonResponse(req, {
        error: "Missing required fields: recipientEmail, emailType",
      }, 400);
    }

    // 1. Merr template-in nga DB
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("template_key", emailType)
      .eq("is_active", true)
      .maybeSingle();

    if (templateError || !template) {
      await supabase.from("email_logs").insert({
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        email_type: emailType,
        subject: "Unknown",
        template_data: templateData,
        status: "failed",
        error_message: `Template not found: ${emailType}`,
        reference_id: referenceId,
        reference_type: referenceType,
      });
      return jsonResponse(req, { error: "Email template not found" }, 404);
    }

    // 2. Render template — escape HTML vlerat ne html_template, te tjerat plain text
    const subject = replacePlaceholders(template.subject_template, templateData, "text");
    const htmlBody = replacePlaceholders(template.html_template, templateData, "html");
    const textBody = template.text_template
      ? replacePlaceholders(template.text_template, templateData, "text")
      : "";

    // 3. Krijo email log si "queued"
    const { data: emailLog, error: logInsertError } = await supabase
      .from("email_logs")
      .insert({
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        email_type: emailType,
        subject,
        template_data: templateData,
        status: "queued",
        reference_id: referenceId,
        reference_type: referenceType,
      })
      .select()
      .single();

    if (logInsertError || !emailLog) {
      console.error("Error creating email log:", logInsertError);
      return jsonResponse(req, { error: "Failed to log email" }, 500);
    }

    // 4. Dergo permes Resend (nese eshte konfiguruar)
    if (!resendApiKey) {
      // Mode "dev" — nuk dergohet realisht, vetem log-ohet
      await supabase
        .from("email_logs")
        .update({
          status: "skipped",
          error_message: "RESEND_API_KEY not configured (dev mode)",
        })
        .eq("id", emailLog.id);

      return jsonResponse(req, {
        success: false,
        warning: "RESEND_API_KEY not configured — email NOT sent",
        emailId: emailLog.id,
      }, 200);
    }

    const sendResult = await sendViaResend({
      apiKey: resendApiKey,
      from: resendFromEmail,
      replyTo: resendReplyTo,
      to: recipientEmail,
      toName: recipientName || "",
      subject,
      html: htmlBody,
      text: textBody,
    });

    if (!sendResult.ok) {
      await supabase
        .from("email_logs")
        .update({
          status: "failed",
          error_message: sendResult.error,
        })
        .eq("id", emailLog.id);

      return jsonResponse(req, {
        success: false,
        error: sendResult.error,
        emailId: emailLog.id,
      }, 502);
    }

    // 5. Update si "sent"
    await supabase
      .from("email_logs")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        provider_message_id: sendResult.id,
      })
      .eq("id", emailLog.id);

    return jsonResponse(req, {
      success: true,
      emailId: emailLog.id,
      providerId: sendResult.id,
    });
  } catch (error) {
    console.error("Error in send-email function:", error);
    return jsonResponse(req, {
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});
