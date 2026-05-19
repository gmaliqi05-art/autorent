// Shared CORS helper for all Edge Functions.
// CORS_ALLOWED_ORIGINS env var = comma-separated list of allowed origins.
// Example: "https://rentcars.life,http://localhost:5173"

const DEFAULT_ALLOWED = ["https://rentcars.life", "http://localhost:5173"];

function getAllowedOrigins(): string[] {
  const envValue = Deno.env.get("CORS_ALLOWED_ORIGINS");
  if (!envValue) return DEFAULT_ALLOWED;
  return envValue.split(",").map((o) => o.trim()).filter(Boolean);
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = getAllowedOrigins();
  const matched = origin && allowed.includes(origin) ? origin : allowed[0];

  return {
    "Access-Control-Allow-Origin": matched,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Client-Info, Apikey, Stripe-Signature",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export function handleCorsPreflight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req.headers.get("origin")),
    });
  }
  return null;
}

export function jsonResponse(
  req: Request,
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req.headers.get("origin")),
      "Content-Type": "application/json",
    },
  });
}
