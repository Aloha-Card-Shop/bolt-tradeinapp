import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RAW_JUSTTCG_API_KEY = Deno.env.get("JUSTTCG_API_KEY");
const DEFAULT_JUSTTCG_API_KEY = RAW_JUSTTCG_API_KEY?.trim().replace(/^['"]|['"]$/g, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-justtcg-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Allow override via header or POST body for testing purposes
    let overrideKey = req.headers.get("x-justtcg-key")?.trim() || "";
    if (!overrideKey && req.method === "POST") {
      const body = await req.json().catch(() => null) as any;
      if (body?.key) overrideKey = String(body.key).trim();
    }

    const JUSTTCG_API_KEY = overrideKey || DEFAULT_JUSTTCG_API_KEY;

    if (!JUSTTCG_API_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing JUSTTCG_API_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL("https://api.justtcg.com/v1/games");
    const masked = `${JUSTTCG_API_KEY.slice(0, 4)}...${JUSTTCG_API_KEY.slice(-4)}`;
    console.log("[justtcg-ping] Testing key against /games", { key: masked, override: Boolean(overrideKey) });

    // Attempt 1: x-justtcg-key (preferred)
    const justKeyHeaders = { "x-justtcg-key": JUSTTCG_API_KEY, "accept": "application/json" } as Record<string, string>;
    const upstreamJust = await fetch(url.toString(), { headers: justKeyHeaders });
    const textJust = await upstreamJust.text();
    let dataJust: unknown;
    try { dataJust = JSON.parse(textJust); } catch { dataJust = { raw: textJust }; }
    console.log("[justtcg-ping] x-justtcg-key result", { status: upstreamJust.status, ok: upstreamJust.ok });

    if (upstreamJust.ok) {
      return new Response(
        JSON.stringify({ ok: true, status: upstreamJust.status, scheme: "x-justtcg-key", data: dataJust, meta: { keyPreview: masked } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Attempt 2: Authorization Bearer
    const bearerHeaders = { Authorization: `Bearer ${JUSTTCG_API_KEY}` } as Record<string, string>;
    const upstreamBearer = await fetch(url.toString(), { headers: bearerHeaders });
    const textBearer = await upstreamBearer.text();
    let dataBearer: unknown;
    try { dataBearer = JSON.parse(textBearer); } catch { dataBearer = { raw: textBearer }; }
    console.log("[justtcg-ping] Bearer result", { status: upstreamBearer.status, ok: upstreamBearer.ok });

    if (upstreamBearer.ok) {
      return new Response(
        JSON.stringify({ ok: true, status: upstreamBearer.status, scheme: "bearer", data: dataBearer, meta: { keyPreview: masked } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Attempt 3: x-api-key fallback
    const apiKeyHeaders = { "x-api-key": JUSTTCG_API_KEY, "X-API-Key": JUSTTCG_API_KEY, "accept": "application/json" } as Record<string, string>;
    const upstreamApiKey = await fetch(url.toString(), { headers: apiKeyHeaders });
    const textApiKey = await upstreamApiKey.text();
    let dataApiKey: unknown;
    try { dataApiKey = JSON.parse(textApiKey); } catch { dataApiKey = { raw: textApiKey }; }
    console.log("[justtcg-ping] x-api-key result", { status: upstreamApiKey.status, ok: upstreamApiKey.ok });

    const scheme = upstreamApiKey.ok ? "x-api-key" : null;
    return new Response(
      JSON.stringify({
        ok: upstreamApiKey.ok,
        status: upstreamApiKey.status,
        scheme,
        attempts: {
          xJustKey: { status: upstreamJust.status, ok: upstreamJust.ok },
          bearer: { status: upstreamBearer.status, ok: upstreamBearer.ok },
          xApiKey: { status: upstreamApiKey.status, ok: upstreamApiKey.ok },
        },
        data: upstreamApiKey.ok ? dataApiKey : (upstreamBearer.ok ? dataBearer : dataJust),
        meta: { keyPreview: masked },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[justtcg-ping] error:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
