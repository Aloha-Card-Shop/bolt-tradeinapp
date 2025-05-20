
import type { NextApiRequest, NextApiResponse } from 'next';
import { clearSettingsCache } from './calculate-value';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { game } = req.body;
    
    // Clear cache for specific game or all games
    clearSettingsCache(game);
    
    return res.status(200).json({ 
      success: true, 
      message: game ? `Cache cleared for game: ${game}` : 'All game settings cache cleared'
    });
  } catch (error: any) {
    console.error('Error clearing cache:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error clearing cache: ${error.message}`
    });
  }
}
