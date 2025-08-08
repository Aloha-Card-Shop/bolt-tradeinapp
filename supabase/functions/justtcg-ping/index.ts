import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RAW = Deno.env.get("JUSTTCG_API_KEY") ?? "";
const API_KEY = RAW.trim().replace(/^['"]|['"]$/g, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

const AUTH_HEADERS = { "X-API-Key": API_KEY, "accept": "application/json" } as Record<string, string>;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing JUSTTCG_API_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const masked = `${API_KEY.slice(0, 4)}...${API_KEY.slice(-4)}`;
    const upstream = await fetch("https://api.justtcg.com/v1/games", { headers: AUTH_HEADERS });

    return new Response(
      JSON.stringify({ ok: upstream.ok, status: upstream.status, meta: { keyPreview: masked } }),
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
