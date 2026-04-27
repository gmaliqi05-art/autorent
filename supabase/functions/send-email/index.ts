import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  recipientEmail: string;
  recipientName: string;
  emailType: string;
  templateData: Record<string, any>;
  referenceId?: string;
  referenceType?: string;
}

function replacePlaceholders(template: string, data: Record<string, any>): string {
  let result = template;

  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, String(value || ''));
  }

  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const emailRequest: EmailRequest = await req.json();
    const { recipientEmail, recipientName, emailType, templateData, referenceId, referenceType } = emailRequest;

    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', emailType)
      .eq('is_active', true)
      .maybeSingle();

    if (templateError || !template) {
      console.error('Template not found:', templateError);

      const { error: logError } = await supabase
        .from('email_logs')
        .insert({
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          email_type: emailType,
          subject: 'Unknown',
          template_data: templateData,
          status: 'failed',
          error_message: `Template not found: ${emailType}`,
          reference_id: referenceId,
          reference_type: referenceType,
        });

      if (logError) {
        console.error('Error logging failed email:', logError);
      }

      return new Response(
        JSON.stringify({ error: 'Email template not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const subject = replacePlaceholders(template.subject_template, templateData);
    const htmlBody = replacePlaceholders(template.html_template, templateData);
    const textBody = template.text_template
      ? replacePlaceholders(template.text_template, templateData)
      : '';

    const emailLogData = {
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      email_type: emailType,
      subject,
      template_data: templateData,
      status: 'queued',
      reference_id: referenceId,
      reference_type: referenceType,
    };

    const { data: emailLog, error: logInsertError } = await supabase
      .from('email_logs')
      .insert(emailLogData)
      .select()
      .single();

    if (logInsertError) {
      console.error('Error creating email log:', logInsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to log email' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Email queued successfully:', {
      id: emailLog.id,
      recipient: recipientEmail,
      type: emailType,
      subject,
    });

    const { error: updateError } = await supabase
      .from('email_logs')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', emailLog.id);

    if (updateError) {
      console.error('Error updating email status:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email queued successfully',
        emailId: emailLog.id,
        preview: {
          to: recipientEmail,
          subject,
          body: textBody || htmlBody.substring(0, 200) + '...',
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in send-email function:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
