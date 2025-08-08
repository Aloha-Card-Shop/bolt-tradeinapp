import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RAW = Deno.env.get("JUSTTCG_API_KEY") ?? "";
const API_KEY = RAW.trim().replace(/^['"]|['"]$/g, "");
const AUTH_HEADERS = { "X-API-Key": API_KEY, "accept": "application/json" } as Record<string, string>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
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
    const url = new URL("https://api.justtcg.com/v1/games");

    const masked = API_KEY ? `tcg_${API_KEY.slice(4,8)}...${API_KEY.slice(-4)}` : "none";
    console.log("[justtcg-games] GET /games", { url: url.toString(), key: masked });

    const upstream = await fetch(url.toString(), {
      headers: AUTH_HEADERS,
    });

    const text = await upstream.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    console.log("[justtcg-games] response", { status: upstream.status, ok: upstream.ok });

    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("justtcg-games error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
