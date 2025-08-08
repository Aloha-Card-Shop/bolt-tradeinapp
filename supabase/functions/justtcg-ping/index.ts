import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RAW_JUSTTCG_API_KEY = Deno.env.get("JUSTTCG_API_KEY");
const JUSTTCG_API_KEY = RAW_JUSTTCG_API_KEY?.trim().replace(/^['"]|['"]$/g, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!JUSTTCG_API_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing JUSTTCG_API_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL("https://api.justtcg.com/v1/games");
    const masked = `${JUSTTCG_API_KEY.slice(0, 4)}...${JUSTTCG_API_KEY.slice(-4)}`;
    console.log("[justtcg-ping] Testing key against /games", { key: masked });

    // Attempt 1: Authorization Bearer
    const bearerHeaders = {
      Authorization: `Bearer ${JUSTTCG_API_KEY}`,
    } as Record<string, string>;

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

    // Attempt 2: x-api-key fallback
    const apiKeyHeaders = {
      "x-api-key": JUSTTCG_API_KEY,
      "X-API-Key": JUSTTCG_API_KEY,
    } as Record<string, string>;

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
          bearer: { status: upstreamBearer.status, ok: upstreamBearer.ok },
          xApiKey: { status: upstreamApiKey.status, ok: upstreamApiKey.ok },
        },
        data: upstreamApiKey.ok ? dataApiKey : dataBearer,
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
