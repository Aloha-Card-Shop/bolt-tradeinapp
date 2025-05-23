
// Helper function to normalize game type strings
export const normalizeGameType = (gameType?: string): string => {
  if (!gameType) return 'pokemon';
  
  const normalized = gameType.toLowerCase().trim();
  
  if (['pokémon', 'pokemon'].includes(normalized)) return 'pokemon';
  if (['japanese-pokemon', 'japanese pokemon', 'pokemon (japanese)', 'pokemon japanese'].includes(normalized)) 
    return 'japanese-pokemon';
  if (['magic', 'magic: the gathering', 'mtg', 'magic the gathering'].includes(normalized)) 
    return 'magic';
  
  // fallback
  return ['pokemon', 'japanese-pokemon', 'magic', 'yugioh', 'sports', 'other'].includes(normalized)
    ? normalized
    : 'pokemon';
};
