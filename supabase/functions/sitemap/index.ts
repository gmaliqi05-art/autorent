import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

// Sitemap.xml dinamik per SEO.
// Deployment: `supabase functions deploy sitemap --no-verify-jwt`
// (publik — Google duhet ta lexoje pa autentikim)
//
// Konfigurim:
// - Vendos rewrite ne hostin tend qe /sitemap.xml te shkoje tek kjo function:
//     URL: https://<project-ref>.supabase.co/functions/v1/sitemap
// - Ose perdor /sitemap.xml direkt nga ky endpoint ne robots.txt

const SITE_URL = Deno.env.get("SITE_URL") || "https://rentcars.life";

interface VehicleRow {
  id: string;
  updated_at: string;
}

interface CompanyRow {
  slug: string;
  updated_at: string;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc: string, lastmod: string | null, priority: number, changefreq: string): string {
  const lastmodTag = lastmod ? `    <lastmod>${lastmod.split("T")[0]}</lastmod>\n` : "";
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
${lastmodTag}    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Faqet statike
  const staticPages: Array<[string, number, string]> = [
    ["/", 1.0, "daily"],
    ["/automjetet", 0.9, "daily"],
    ["/politika-privatesise", 0.3, "yearly"],
    ["/kushtet-perdorimit", 0.3, "yearly"],
    ["/politika-cookie", 0.3, "yearly"],
    ["/njoftim-ligjor", 0.3, "yearly"],
    ["/te-drejtat-gdpr", 0.3, "yearly"],
  ];

  // Veturat e publikuara
  const { data: vehiclesData } = await supabase
    .from("vehicles")
    .select("id, updated_at")
    .eq("is_published", true)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(50000);

  const vehicles = (vehiclesData || []) as VehicleRow[];

  // Kompanite e aprovuara (mund t'i shtojme pages kompani me vone)
  const { data: companiesData } = await supabase
    .from("companies")
    .select("slug, updated_at")
    .eq("status", "approved")
    .limit(50000);

  const companies = (companiesData || []) as CompanyRow[];

  const urls: string[] = [];

  for (const [path, priority, changefreq] of staticPages) {
    urls.push(urlEntry(`${SITE_URL}${path}`, null, priority, changefreq));
  }

  for (const v of vehicles) {
    urls.push(urlEntry(`${SITE_URL}/automjetet/${v.id}`, v.updated_at, 0.8, "weekly"));
  }

  // Kompanite — endpoint per kompani nuk ekziston ne UI ende, por sigurojme placeholder
  // per kur ta shtojme me vone. Per momentin nuk i shtojme deri kur te kete faqe.
  void companies;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
});
