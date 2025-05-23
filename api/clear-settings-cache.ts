
import { clearSettingsCache } from './calculate-value';

// API handler to clear the settings cache
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { game } = await req.json();
    
    // Clear either a specific game's cache or the entire cache
    clearSettingsCache(game);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: game 
          ? `Cache cleared for game: ${game}` 
          : 'Entire settings cache cleared'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error clearing cache:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to clear cache' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
