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

  if (!JUSTTCG_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing JUSTTCG_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    let gameParam = "";

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body && body.game) gameParam = String(body.game);
    } else {
      const u = new URL(req.url);
      gameParam = u.searchParams.get("game") ?? "";
    }

    if (!gameParam) {
      return new Response(JSON.stringify({ error: "Missing required 'game' parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL("https://api.justtcg.com/v1/sets");
    url.searchParams.set("game", gameParam);

    const masked = JUSTTCG_API_KEY ? `${JUSTTCG_API_KEY.slice(0, 4)}...${JUSTTCG_API_KEY.slice(-4)}` : "none";
    console.log("[justtcg-sets] GET /sets", { url: url.toString(), game: gameParam, key: masked });

    const upstream = await fetch(url.toString(), {
      headers: {
        "x-api-key": JUSTTCG_API_KEY,
        "X-API-Key": JUSTTCG_API_KEY,
      },
    });

    const data = await upstream.json();

    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("justtcg-sets error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
