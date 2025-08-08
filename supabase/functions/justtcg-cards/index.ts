import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const JUSTTCG_API_KEY = Deno.env.get("JUSTTCG_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  if (!JUSTTCG_API_KEY) {
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
      const upstream = await fetch("https://api.justtcg.com/v1/cards", {
        method: "POST",
        headers: {
          "X-API-Key": JUSTTCG_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await upstream.json();
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
      headers: {
        "X-API-Key": JUSTTCG_API_KEY,
      },
    });

    const data = await upstream.json();

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
