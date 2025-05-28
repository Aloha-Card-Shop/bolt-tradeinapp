
import { normalizeGameType } from './utils/gameUtils';
import { calculateValues } from './utils/calculateValues';
import { createErrorResponse } from './utils/errorResponse';
import { logFallbackEvent } from './utils/fallbackLogger';

// Standard API handler
export default async function handler(req: Request): Promise<Response> {
  console.log(`[REQUEST] POST /api/calculate-value`);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.warn('[ERROR] Method not allowed:', req.method);
    return new Response(
      JSON.stringify({ 
        error: 'Method not allowed',
        cashValue: 0,
        tradeValue: 0,
        usedFallback: true,
        fallbackReason: 'METHOD_NOT_ALLOWED'
      }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Extract and validate request body
    const reqBody = await req.json();
    const { game, baseValue, userId } = reqBody;
    console.log(`[INFO] Processing calculation for game: ${game}, value: ${baseValue}, user: ${userId || 'anonymous'}`);

    // Validate baseValue
    const numericBase = Number(baseValue);
    if (isNaN(numericBase) || numericBase < 0) {
      console.warn(`[ERROR] Invalid baseValue: ${baseValue}, parsed as: ${numericBase}`);
      
      return new Response(
        JSON.stringify({ 
          error: 'Invalid baseValue',
          details: { received: baseValue, parsed: numericBase },
          cashValue: 0,
          tradeValue: 0,
          usedFallback: true,
          fallbackReason: 'INVALID_INPUT'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Skip calculation if baseValue is 0
    if (numericBase === 0) {
      console.log('[INFO] Base value is 0, skipping calculation');
      return new Response(
        JSON.stringify({ cashValue: 0, tradeValue: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Normalize game type
    const gameKey = normalizeGameType(game);
    console.log(`[INFO] Normalized game type from "${game}" to "${gameKey}"`);
    
    // Calculate values
    const result = await calculateValues({
      game: gameKey,
      baseValue: numericBase,
      userId
    });

    // Return the calculated values
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[ERROR] Unhandled exception in calculate-value API:', err);
    
    // Get base value from request body, defaulting to 0 if not present
    let baseValue = 0;
    let game = 'unknown';
    let userId;
    
    try {
      const reqBody = await req.json();
      baseValue = Number(reqBody?.baseValue) || 0;
      game = reqBody?.game || 'unknown';
      userId = reqBody?.userId;
    } catch (parseError) {
      console.error('[ERROR] Could not parse request body:', parseError);
    }
    
    // Log catastrophic error
    try {
      await logFallbackEvent(
        game, 
        baseValue, 
        `Calculation error: ${err.message || 'Unknown error'}`,
        userId
      );
    } catch (logError) {
      console.error('[ERROR] Failed to log calculation error:', logError);
    }
    
    // Return fallback values with detailed error information
    return new Response(
      JSON.stringify(createErrorResponse(baseValue, err.message || 'Unknown calculation error', 'UNKNOWN_ERROR')),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
