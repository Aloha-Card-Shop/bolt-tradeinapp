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

    // Attempt 4: x-justtcg-api-key (alternative header name)
    const altJustHeaders = { "x-justtcg-api-key": JUSTTCG_API_KEY, "X-JustTCG-API-Key": JUSTTCG_API_KEY, "accept": "application/json" } as Record<string, string>;
    const upstreamAltJust = await fetch(url.toString(), { headers: altJustHeaders });
    const textAltJust = await upstreamAltJust.text();
    let dataAltJust: unknown;
    try { dataAltJust = JSON.parse(textAltJust); } catch { dataAltJust = { raw: textAltJust }; }
    console.log("[justtcg-ping] x-justtcg-api-key result", { status: upstreamAltJust.status, ok: upstreamAltJust.ok });

    // Attempt 5: Query param apiKey
    const urlApiKey = new URL(url.toString());
    urlApiKey.searchParams.set("apiKey", JUSTTCG_API_KEY);
    const upstreamQueryApiKey = await fetch(urlApiKey.toString(), { headers: { accept: "application/json" } });
    const textQueryApiKey = await upstreamQueryApiKey.text();
    let dataQueryApiKey: unknown;
    try { dataQueryApiKey = JSON.parse(textQueryApiKey); } catch { dataQueryApiKey = { raw: textQueryApiKey }; }
    console.log("[justtcg-ping] ?apiKey= result", { status: upstreamQueryApiKey.status, ok: upstreamQueryApiKey.ok });

    // Attempt 6: Query param key
    const urlKey = new URL(url.toString());
    urlKey.searchParams.set("key", JUSTTCG_API_KEY);
    const upstreamQueryKey = await fetch(urlKey.toString(), { headers: { accept: "application/json" } });
    const textQueryKey = await upstreamQueryKey.text();
    let dataQueryKey: unknown;
    try { dataQueryKey = JSON.parse(textQueryKey); } catch { dataQueryKey = { raw: textQueryKey }; }
    console.log("[justtcg-ping] ?key= result", { status: upstreamQueryKey.status, ok: upstreamQueryKey.ok });

    // Collate attempts and choose best response
    const attempts = {
      xJustKey: { status: upstreamJust.status, ok: upstreamJust.ok },
      bearer: { status: upstreamBearer.status, ok: upstreamBearer.ok },
      xApiKey: { status: upstreamApiKey.status, ok: upstreamApiKey.ok },
      xJustTcgApiKey: { status: upstreamAltJust.status, ok: upstreamAltJust.ok },
      queryApiKey: { status: upstreamQueryApiKey.status, ok: upstreamQueryApiKey.ok },
      queryKey: { status: upstreamQueryKey.status, ok: upstreamQueryKey.ok },
    } as const;

    const successOrder = [
      { scheme: "x-justtcg-key", ok: upstreamJust.ok, status: upstreamJust.status, data: dataJust },
      { scheme: "bearer", ok: upstreamBearer.ok, status: upstreamBearer.status, data: dataBearer },
      { scheme: "x-api-key", ok: upstreamApiKey.ok, status: upstreamApiKey.status, data: dataApiKey },
      { scheme: "x-justtcg-api-key", ok: upstreamAltJust.ok, status: upstreamAltJust.status, data: dataAltJust },
      { scheme: "query-apiKey", ok: upstreamQueryApiKey.ok, status: upstreamQueryApiKey.status, data: dataQueryApiKey },
      { scheme: "query-key", ok: upstreamQueryKey.ok, status: upstreamQueryKey.status, data: dataQueryKey },
    ];

    const firstSuccess = successOrder.find(a => a.ok);

    if (firstSuccess) {
      return new Response(
        JSON.stringify({ ok: true, status: firstSuccess.status, scheme: firstSuccess.scheme, data: firstSuccess.data, meta: { keyPreview: masked }, attempts }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If none succeeded, return combined diagnostics
    return new Response(
      JSON.stringify({
        ok: false,
        status: upstreamQueryKey.status,
        scheme: null,
        attempts,
        data: dataQueryKey,
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
