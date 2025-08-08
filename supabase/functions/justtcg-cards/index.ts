import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RAW = Deno.env.get("JUSTTCG_API_KEY") ?? "";
const API_KEY = RAW.trim().replace(/^['"]|['"]$/g, "");
const AUTH_HEADERS = { "X-API-Key": API_KEY, "accept": "application/json" } as Record<string, string>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

type SingleLookup = {
  tcgplayerId?: string;
  cardId?: string;
  variantId?: string;
  printing?: string;
  condition?: string;
  q?: string;
  game?: string;
  set?: string; // expects set id
  limit?: number;
  offset?: number;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "Missing JUSTTCG_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Use POST with a body to define lookup/search." }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));

    // Batch: if an array is provided, directly POST to /cards with that array
    if (Array.isArray(body)) {
      console.log("[justtcg-cards] BATCH POST /cards", { count: body.length, key: API_KEY ? `${API_KEY.slice(0,4)}...${API_KEY.slice(-4)}` : "none" });
      const upstream = await fetch("https://api.justtcg.com/v1/cards", {
        method: "POST",
        headers: {
          ...AUTH_HEADERS,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const text = await upstream.text();
      let data: unknown;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      console.log("[justtcg-cards] BATCH response", { status: upstream.status, ok: upstream.ok });
      return new Response(JSON.stringify(data), {
        status: upstream.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Single search/lookup: map known params into query string for GET /cards
    const params: SingleLookup = body || {};

    const url = new URL("https://api.justtcg.com/v1/cards");

    const setIf = (k: string, v: unknown) => {
      if (v !== undefined && v !== null && String(v).length > 0) {
        url.searchParams.set(k, String(v));
      }
    };

    setIf("q", params.q);
    setIf("printing", params.printing);
    setIf("condition", params.condition);
    setIf("limit", params.limit);
    setIf("offset", params.offset);
    setIf("game", params.game);
    setIf("set", params.set);
    setIf("tcgplayerId", params.tcgplayerId);
    setIf("cardId", params.cardId);
    setIf("variantId", params.variantId);

    const upstream = await fetch(url.toString(), {
      headers: AUTH_HEADERS,
    });

    const text = await upstream.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    console.log("[justtcg-cards] GET /cards response", { status: upstream.status, ok: upstream.ok, url: url.toString(), key: API_KEY ? `${API_KEY.slice(0,4)}...${API_KEY.slice(-4)}` : "none" });

    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("justtcg-cards error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
