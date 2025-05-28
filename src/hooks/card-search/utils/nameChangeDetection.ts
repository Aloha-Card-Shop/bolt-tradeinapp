
/**
 * Helper function to detect if card name has changed significantly
 */
export const hasSignificantNameChange = (oldName: string, newName: string): boolean => {
  if (!oldName || !newName) return false;
  
  // If the new name is significantly shorter, consider it a new search
  if (newName.length < oldName.length * 0.5) return true;
  
  // Split into words and check if they're completely different
  const oldWords = oldName.toLowerCase().split(/\s+/).filter(Boolean);
  const newWords = newName.toLowerCase().split(/\s+/).filter(Boolean);
  
  // If no words overlap, it's a significant change
  if (newWords.length > 0 && oldWords.length > 0) {
    const hasOverlap = newWords.some(newWord => 
      oldWords.some(oldWord => 
        oldWord.includes(newWord) || newWord.includes(oldWord)
      )
    );
    return !hasOverlap;
  }
  
  return false;
};
