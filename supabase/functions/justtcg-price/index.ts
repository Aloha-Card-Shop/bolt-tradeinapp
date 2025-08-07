// Supabase Edge Function: justtcg-price
// Fetch ungraded card prices from JustTCG API using TCGPlayer productId
// This function normalizes the response to { price, unavailable?, actualCondition?, method }



const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utility: safely read a nested value by possible keys
function pickNumber(obj: any, keys: string[]): number | undefined {
  for (const key of keys) {
    if (!obj) continue;
    const val = obj[key];
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const num = parseFloat(val.replace?.('$', '') ?? val);
      if (!Number.isNaN(num)) return num;
    }
  }
  return undefined;
}

// Try to extract a condition price from diverse API shapes
function extractPriceForCondition(card: any, condition: string): number | undefined {
  const aliases: Record<string, string[]> = {
    mint: ['mint', 'm'],
    near_mint: ['near_mint', 'nearMint', 'nm'],
    lightly_played: ['lightly_played', 'lightlyPlayed', 'lp'],
    moderately_played: ['moderately_played', 'moderatelyPlayed', 'mp'],
    heavily_played: ['heavily_played', 'heavilyPlayed', 'hp'],
    damaged: ['damaged', 'poor', 'dp'],
  };

  const priceFieldPrefs = ['marketPrice', 'market', 'avg', 'average', 'mid', 'price', 'low'];
  const condKeys = aliases[condition] ?? [condition];

  // Common shapes we might see
  const containers = [
    card?.prices,
    card?.marketPrices,
    card?.tcgplayer?.prices,
  ];

  for (const container of containers) {
    if (!container || typeof container !== 'object') continue;

    for (const key of condKeys) {
      const entry = container[key];
      if (!entry) continue;

      if (typeof entry === 'number') return entry;
      if (typeof entry === 'string') {
        const n = parseFloat(entry.replace?.('$', '') ?? entry);
        if (!Number.isNaN(n)) return n;
      }
      if (typeof entry === 'object') {
        const n = pickNumber(entry, priceFieldPrefs);
        if (n !== undefined) return n;
      }
    }
  }

  // Top-level simple fallbacks
  const fallback = pickNumber(card, priceFieldPrefs);
  if (fallback !== undefined) return fallback;

  return undefined;
}

function scoreVariant(card: any, flags: { isFirstEdition?: boolean; isHolo?: boolean; isReverseHolo?: boolean; }) {
  let score = 0;
  const { isFirstEdition, isHolo, isReverseHolo } = flags;

  const fe = card?.firstEdition ?? card?.first_edition;
  const holo = card?.holo ?? card?.isHolo ?? card?.foil;
  const rHolo = card?.reverseHolo ?? card?.reverse_holo ?? card?.isReverseHolo;

  if (isFirstEdition === true && fe === true) score += 2;
  if (isHolo === true && holo === true) score += 1;
  if (isReverseHolo === true && rHolo === true) score += 1;

  return score;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders } });
  }

  try {
    const apiKey = Deno.env.get('JUSTTCG_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing JUSTTCG_API_KEY' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { productId, condition, isFirstEdition, isHolo, isReverseHolo, game } = await req.json();

    if (!productId) {
      return new Response(JSON.stringify({ error: 'productId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const url = `https://api.justtcg.com/v1/cards?tcgplayerId=${encodeURIComponent(productId)}`;

    const jtRes = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'accept': 'application/json',
      },
    });

    if (!jtRes.ok) {
      const text = await jtRes.text();
      const status = jtRes.status;
      return new Response(JSON.stringify({ error: 'JustTCG request failed', status, detail: text }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const payload = await jtRes.json();
    const cards = payload?.cards ?? payload?.data ?? payload?.results ?? [];

    if (!Array.isArray(cards) || cards.length === 0) {
      return new Response(JSON.stringify({ price: '0.00', unavailable: true, method: 'justtcg' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Prefer a variant that best matches the requested flags
    let selected = cards[0];
    if (cards.length > 1) {
      const scored = cards
        .map((c: any) => ({ c, s: scoreVariant(c, { isFirstEdition, isHolo, isReverseHolo }) }))
        .sort((a: any, b: any) => b.s - a.s);
      selected = scored[0].c;
    }

    // Build condition price map and enforce monotonicity (worse condition <= better)
    const condOrder = ['mint', 'near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged'];
    const rawPrices: Record<string, number | undefined> = {};
    for (const cond of condOrder) {
      rawPrices[cond] = extractPriceForCondition(selected, cond);
    }

    let conditionAnomalyAdjusted = false;
    const adjustments: string[] = [];

    // Enforce non-increasing prices from best to worst condition
    let prev: number | undefined = undefined;
    for (const cond of condOrder) {
      const cur = rawPrices[cond];
      if (prev !== undefined && cur !== undefined && cur > prev) {
        // Cap this worse condition to the previous (better) price
        rawPrices[cond] = prev;
        conditionAnomalyAdjusted = true;
        adjustments.push(`${cond} capped to ${prev.toFixed(2)}`);
      }
      if (rawPrices[cond] !== undefined) {
        prev = rawPrices[cond];
      }
    }

    const requestedCond = String(condition ?? 'near_mint');

    // Helper to find the first available price in fallback order
    const fallbackOrder = ['near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged'];

    const pickPrice = (cond: string): number | undefined => {
      const v = rawPrices[cond];
      return typeof v === 'number' && v > 0 ? v : undefined;
    };

    // Try requested condition first
    let chosenCond = requestedCond;
    let chosen = pickPrice(requestedCond);

    if (!(chosen && chosen > 0)) {
      // Try fallbacks
      for (const cond of fallbackOrder) {
        const v = pickPrice(cond);
        if (v !== undefined) {
          chosen = v;
          chosenCond = cond;
          break;
        }
      }
    }

    if (chosen && chosen > 0) {
      return new Response(
        JSON.stringify({
          price: Number(chosen.toFixed(2)),
          actualCondition: chosenCond,
          method: 'justtcg',
          conditionAnomalyAdjusted,
          adjustmentNote: conditionAnomalyAdjusted ? adjustments.join('; ') : undefined,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ price: '0.00', unavailable: true, method: 'justtcg', conditionAnomalyAdjusted, adjustmentNote: conditionAnomalyAdjusted ? adjustments.join('; ') : undefined }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e), stack: (e as any)?.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
