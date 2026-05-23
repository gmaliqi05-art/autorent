// Edge function: update-currency-rates
// Lexon ECB Reference Rates (XML) dhe perditeson tabelen currency_rates.
// Thirret nga cron (pg_cron -> http_post) cdo 24 ore.
//
// Ka opsion CRON_SECRET nese duhet siguri ekstra (kontroll header X-Cron-Secret).
// Per valutat qe ECB nuk i jep (ALL, MKD, RSD), perdor manual override nese ka ne env
// ose mban vleren ekzistuese ne DB (nuk e shkruan mbi).
//
// Env vars te kerkuara:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-inject nga Supabase)
//   ECB_FALLBACK_ALL  (opsional, default 100)
//   ECB_FALLBACK_MKD  (opsional, default 61.5)
//   ECB_FALLBACK_RSD  (opsional, default 117)
//   CRON_SECRET       (opsional, per autorizim)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const ECB_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const SUPPORTED_QUOTES = ["USD", "GBP", "CHF"] as const;
const BALKAN_FALLBACKS: Record<string, number> = {
  ALL: 100,
  MKD: 61.5,
  RSD: 117,
};

interface RateRow {
  base_currency: string;
  quote_currency: string;
  rate: number;
  source: string;
}

function parseEcbXml(xml: string): Record<string, number> {
  const rates: Record<string, number> = {};
  const cubeRegex = /<Cube\s+currency=['"]([A-Z]{3})['"]\s+rate=['"]([0-9.]+)['"]\s*\/>/g;
  let match: RegExpExecArray | null;
  while ((match = cubeRegex.exec(xml)) !== null) {
    rates[match[1]] = Number(match[2]);
  }
  return rates;
}

Deno.serve(async (req) => {
  // Authorization (opsionale)
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== cronSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Fetch ECB rates
  let ecbRates: Record<string, number> = {};
  let ecbOk = false;
  try {
    const resp = await fetch(ECB_URL, {
      headers: { "User-Agent": "RentaKar/1.0 (currency-cron)" },
    });
    if (!resp.ok) throw new Error(`ECB returned ${resp.status}`);
    const xml = await resp.text();
    ecbRates = parseEcbXml(xml);
    ecbOk = Object.keys(ecbRates).length > 0;
  } catch (err) {
    console.error("[currency-cron] ECB fetch failed:", err);
  }

  // 2) Build rows
  const rows: RateRow[] = [];

  // EUR -> EUR = 1 (identity)
  rows.push({ base_currency: "EUR", quote_currency: "EUR", rate: 1, source: "identity" });

  // EUR -> USD/GBP/CHF nga ECB
  for (const q of SUPPORTED_QUOTES) {
    if (ecbRates[q]) {
      rows.push({ base_currency: "EUR", quote_currency: q, rate: ecbRates[q], source: "ecb" });
    }
  }

  // EUR -> ALL/MKD/RSD: ECB s'i jep — perdor fallback nga env ose default
  for (const cur of Object.keys(BALKAN_FALLBACKS)) {
    const envOverride = Deno.env.get(`ECB_FALLBACK_${cur}`);
    const rate = envOverride ? Number(envOverride) : BALKAN_FALLBACKS[cur];
    if (Number.isFinite(rate) && rate > 0) {
      rows.push({ base_currency: "EUR", quote_currency: cur, rate, source: envOverride ? "env" : "fallback" });
    }
  }

  // 3) Upsert ne DB
  const { error: upsertError } = await supabase
    .from("currency_rates")
    .upsert(
      rows.map((r) => ({ ...r, fetched_at: new Date().toISOString() })),
      { onConflict: "base_currency,quote_currency" },
    );

  if (upsertError) {
    console.error("[currency-cron] upsert failed:", upsertError);
    return new Response(
      JSON.stringify({ error: upsertError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      ecb_ok: ecbOk,
      updated: rows.length,
      rates: rows.map((r) => ({ q: r.quote_currency, r: r.rate, s: r.source })),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
