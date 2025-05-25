
// Helper function to normalize game type strings
export const normalizeGameType = (gameType?: string): string => {
  if (!gameType) return 'pokemon';
  
  const normalized = gameType.toLowerCase().trim();
  
  // Handle Pokemon variants
  if (['pokémon', 'pokemon', 'pkmn', 'pokemon-card'].includes(normalized)) return 'pokemon';
  
  // Handle Japanese Pokemon variants
  if (['japanese-pokemon', 'japanese pokemon', 'pokemon (japanese)', 'pokemon japanese', 'jp pokemon'].includes(normalized)) 
    return 'japanese-pokemon';
  
  // For any unsupported game types (magic, yugioh, sports, etc.), default to pokemon
  console.warn(`Unsupported game type: ${gameType}, defaulting to pokemon`);
  return 'pokemon';
};

// Validate if a game type is supported
export const isSupportedGameType = (gameType: string): boolean => {
  const supportedTypes = ['pokemon', 'japanese-pokemon'];
  return supportedTypes.includes(normalizeGameType(gameType));
};

// Get category ID for supported game types
export const getCategoryIdForGame = (gameType: string): number => {
  const normalized = normalizeGameType(gameType);
  
  switch (normalized) {
    case 'pokemon':
      return 2;
    case 'japanese-pokemon':
      return 9;
    default:
      return 2; // Default to pokemon category
  }
};
