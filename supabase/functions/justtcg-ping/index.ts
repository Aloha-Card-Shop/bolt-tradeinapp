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

    const upstream = await fetch(url.toString(), {
      headers: {
        "x-api-key": JUSTTCG_API_KEY,
        "X-API-Key": JUSTTCG_API_KEY,
      },
    });

    const text = await upstream.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    console.log("[justtcg-ping] Result", { status: upstream.status, ok: upstream.ok });

    return new Response(
      JSON.stringify({ ok: upstream.ok, status: upstream.status, data, meta: { keyPreview: masked } }),
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
