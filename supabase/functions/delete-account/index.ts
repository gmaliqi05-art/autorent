import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse(req, { error: "Missing authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return jsonResponse(req, { error: "Unauthorized" }, 401);
    }

    const userId = userData.user.id;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: activeBookings, error: bookingsErr } = await admin
      .from("bookings")
      .select("id")
      .eq("client_id", userId)
      .in("status", ["pending", "confirmed", "active"]);

    if (bookingsErr) {
      return jsonResponse(req, { error: bookingsErr.message }, 500);
    }

    if (activeBookings && activeBookings.length > 0) {
      return jsonResponse(req, {
        error: "Nuk mund te fshihet llogaria ndersa keni rezervime aktive ose te konfirmuara. Anuloni ose perfundoni rezervimet e para.",
      }, 400);
    }

    // Anonymize bookings for accounting continuity
    await admin
      .from("bookings")
      .update({
        client_name: "Perdorues i fshire",
        client_email: `deleted-${userId}@deleted.local`,
        client_phone: null,
      })
      .eq("client_id", userId);

    // Delete client documents (row cascades via FK, but also clean storage)
    const { data: files } = await admin.storage
      .from("client-documents")
      .list(userId, { limit: 100 });
    if (files && files.length > 0) {
      const paths = files.map((f) => `${userId}/${f.name}`);
      await admin.storage.from("client-documents").remove(paths);
    }
    await admin.from("client_documents").delete().eq("client_id", userId);

    // Delete notifications and reviews
    await admin.from("notifications").delete().eq("user_id", userId);
    await admin.from("reviews").delete().eq("client_id", userId);

    // Delete profile row (RLS permits via admin)
    await admin.from("profiles").delete().eq("id", userId);

    // Finally delete the auth user
    const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
    if (deleteErr) {
      return jsonResponse(req, { error: deleteErr.message }, 500);
    }

    return jsonResponse(req, { success: true });
  } catch (err) {
    return jsonResponse(req, { error: (err as Error).message }, 500);
  }
});
