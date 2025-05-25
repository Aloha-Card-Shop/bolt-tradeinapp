
// Helper function to normalize game type strings
export const normalizeGameType = (gameType?: string): string => {
  if (!gameType) return 'pokemon';
  
  const normalized = gameType.toLowerCase().trim();
  
  if (['pokémon', 'pokemon'].includes(normalized)) return 'pokemon';
  if (['japanese-pokemon', 'japanese pokemon', 'pokemon (japanese)', 'pokemon japanese'].includes(normalized)) 
    return 'japanese-pokemon';
  
  // fallback to pokemon for any unsupported game types
  return ['pokemon', 'japanese-pokemon'].includes(normalized)
    ? normalized
    : 'pokemon';
};
