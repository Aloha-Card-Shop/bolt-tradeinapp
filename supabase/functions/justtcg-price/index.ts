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

// Try to extract a condition price from diverse API shapes, including JustTCG variants array
function extractPriceForCondition(card: any, condition: string, flags?: { isHolo?: boolean; isReverseHolo?: boolean; }) {
  const aliases: Record<string, string[]> = {
    mint: ['mint', 'm', 'near mint (sealed?)'],
    near_mint: ['near_mint', 'near-mint', 'near mint', 'nearmint', 'nm'],
    lightly_played: ['lightly_played', 'lightly-played', 'lightly played', 'lp'],
    moderately_played: ['moderately_played', 'moderately-played', 'moderately played', 'mp'],
    heavily_played: ['heavily_played', 'heavily-played', 'heavily played', 'hp'],
    damaged: ['damaged', 'poor', 'dp', 'd'],
  };

  const priceFieldPrefs = ['marketPrice', 'market', 'avg', 'average', 'mid', 'price', 'low'];
  const condKeys = aliases[condition] ?? [condition];

  // 1) JustTCG canonical shape: variants[] with { condition, printing, price }
  const variants = Array.isArray(card?.variants) ? card.variants : undefined;
  if (variants) {
    const norm = (s: string) => String(s || '').toLowerCase().replace(/[_\-\s]+/g, '_').trim();
    const targetConds = new Set(condKeys.map((k) => norm(k)));

    // Filter by matching condition
    let candidates = variants.filter((v: any) => targetConds.has(norm(v?.condition)) && typeof v?.price === 'number');

    // Prefer printing based on flags (Foil when holo/reverse, else Normal)
    const preferFoil = !!(flags?.isHolo || flags?.isReverseHolo);
    const scorePrinting = (p: string | undefined) => {
      const s = String(p || '').toLowerCase();
      if (preferFoil) return /foil|holo/.test(s) ? 2 : 1;
      // prefer Normal when not foil
      return /normal/.test(s) ? 2 : (/foil|holo/.test(s) ? 1 : 0);
    };

    if (candidates.length > 0) {
      candidates.sort((a: any, b: any) => scorePrinting(b?.printing) - scorePrinting(a?.printing));
      const price = candidates[0]?.price;
      if (typeof price === 'number' && price > 0) return price;
    }
  }

  // 2) Other possible shapes from different providers
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

  // 3) Top-level simple fallbacks
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

    const { productId, condition, isFirstEdition, isHolo, isReverseHolo, game, setName, cardName, cardNumber } = await req.json();

    if (!productId) {
      return new Response(JSON.stringify({ error: 'productId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Prepare optional filters for JustTCG API
    const condMap: Record<string, string> = { mint: 'M', near_mint: 'NM', lightly_played: 'LP', moderately_played: 'MP', heavily_played: 'HP', damaged: 'D' };
    const normCondKey = String(condition ?? '').toLowerCase().replace(/[\s\-]+/g, '_');
    const condParam = condMap[normCondKey] ?? undefined;
    const printingParam = (isHolo || isReverseHolo) ? 'Foil' : 'Normal';

    // Try multiple possible parameter names for identifiers (TCGplayer product or JustTCG card id)
    const paramCandidates = ['tcgplayerId', 'tcgPlayerId', 'tcgplayer_id', 'tcgplayerProductId', 'productId', 'cardId', 'card_id', 'id'];

    let payload: any = null;
    let cards: any[] = [];
    let lastStatus: number | undefined;
    let lastDetail: string | undefined;

    for (const param of paramCandidates) {
      const url = `https://api.justtcg.com/v1/cards?${param}=${encodeURIComponent(productId)}${game ? `&game=${encodeURIComponent(String(game))}` : ''}${condParam ? `&condition=${encodeURIComponent(condParam)}` : ''}${printingParam ? `&printing=${encodeURIComponent(printingParam)}` : ''}`;
      console.log(`[justtcg] Fetch attempt with param="${param}" url=${url}`);

      const jtRes = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'accept': 'application/json',
        },
      });

      if (!jtRes.ok) {
        lastStatus = jtRes.status;
        lastDetail = await jtRes.text();
        console.log(`[justtcg] Non-OK response for param=${param} status=${jtRes.status} detailSnippet=${(lastDetail || '').slice(0, 200)}`);
        continue;
      }

      try {
        payload = await jtRes.json();
      } catch (e) {
        console.log(`[justtcg] Failed to parse JSON for param=${param}:`, e);
        continue;
      }

      cards = payload?.cards ?? payload?.data ?? payload?.results ?? payload?.items ?? [];
      console.log(`[justtcg] Parsed payload keys: ${Object.keys(payload || {}).join(', ')}; cardsLength=${Array.isArray(cards) ? cards.length : 'n/a'}`);

      if (Array.isArray(cards) && cards.length > 0) {
        break;
      }
    }

    if (!Array.isArray(cards) || cards.length === 0) {
      // If we had an error earlier, return that for easier debugging
      if (lastStatus && lastDetail) {
        return new Response(JSON.stringify({ price: '0.00', unavailable: true, method: 'justtcg', lastStatus, detail: (lastDetail || '').slice(0, 500) }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      return new Response(JSON.stringify({ price: '0.00', unavailable: true, method: 'justtcg' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Exact-match filter by setName, cardName, and cardNumber if provided
    const normalize = (s: any) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizeNumber = (n: any) => {
      const s = String(n ?? '').toLowerCase().trim();
      const main = (s.split('/')[0] || s).replace(/\s+/g, '');
      return normalize(main);
    };
    const providedSet = normalize(typeof setName === 'string' ? setName : '');
    const providedName = normalize(typeof cardName === 'string' ? cardName : '');

    const providedNum = (() => {
      if (!cardNumber) return '';
      if (typeof cardNumber === 'object') {
        const raw = cardNumber.raw ?? cardNumber.formatted ?? cardNumber.number ?? cardNumber.displayName ?? cardNumber.value;
        return normalizeNumber(raw);
      }
      return normalizeNumber(cardNumber);
    })();

    const matchesAll = (card: any) => {
      const cName = normalize(card?.name ?? card?.cardName ?? card?.title);
      const sName = normalize(card?.set?.name ?? card?.setName ?? card?.set ?? card?.series?.name);
      const cNum = normalizeNumber(card?.number ?? card?.cardNumber ?? card?.no ?? card?.collector_number ?? card?.collectorNumber);

      if (providedSet && !(sName.includes(providedSet) || providedSet.includes(sName))) return false;
      if (providedName && !(cName === providedName || cName.includes(providedName))) return false;
      if (providedNum && cNum !== providedNum) return false;
      return true;
    };

    const filtered = cards.filter(matchesAll);
    const candidateCards = filtered.length > 0 ? filtered : cards;
    console.log(`[justtcg] Exact-match filter: before=${cards.length} after=${filtered.length} set="${setName ?? ''}" name="${cardName ?? ''}" number="${String(cardNumber ?? '')}"`);

    // Prefer a variant that best matches the requested flags
    let selected = candidateCards[0];
    if (candidateCards.length > 1) {
      const scored = candidateCards
        .map((c: any) => ({ c, s: scoreVariant(c, { isFirstEdition, isHolo, isReverseHolo }) }))
        .sort((a: any, b: any) => b.s - a.s);
      selected = scored[0].c;
    }

    // Build condition price map and enforce monotonicity (worse condition <= better)
    const condOrder = ['mint', 'near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged'];
    const rawPrices: Record<string, number | undefined> = {};
    for (const cond of condOrder) {
      rawPrices[cond] = extractPriceForCondition(selected, cond, { isHolo, isReverseHolo });
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
