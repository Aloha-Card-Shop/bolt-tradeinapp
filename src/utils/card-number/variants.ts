
import { CardNumberObject } from '../../types/card';
import { getCardNumberString, extractNumberBeforeSlash, normalizeCardNumber } from './formatters';

/**
 * Generate all possible variations of a card number for comprehensive searching
 * @param cardNumber The original card number
 * @returns Array of card number variants to search for
 */
export const generateCardNumberVariants = (cardNumber: string | CardNumberObject | undefined): string[] => {
  const originalStr = getCardNumberString(cardNumber);
  if (!originalStr) return [];
  
  const variants = new Set<string>();
  
  // Add the original string
  variants.add(originalStr);
  
  // Add normalized version (without leading zeros)
  const normalized = normalizeCardNumber(originalStr);
  if (normalized !== originalStr) {
    variants.add(normalized);
  }
  
  // If it contains a slash, add variants with and without leading zeros
  if (originalStr.includes('/')) {
    const [numPart, setPart] = originalStr.split('/', 2);
    
    // Add variant with leading zeros removed
    variants.add(parseInt(numPart, 10) + '/' + setPart);
    
    // Add just the number part before the slash
    variants.add(numPart);
    variants.add(parseInt(numPart, 10).toString());
    
    // Add version with up to 3 leading zeros
    variants.add(numPart.padStart(3, '0') + '/' + setPart);
    variants.add(numPart.padStart(2, '0') + '/' + setPart);
  } else {
    // For numbers without slash, add versions with leading zeros
    if (/^\d+$/.test(originalStr)) {
      variants.add(originalStr.padStart(3, '0'));
      variants.add(originalStr.padStart(2, '0'));
      
      // Add version with leading zeros removed
      variants.add(originalStr.replace(/^0+/, ''));
    }
  }
  
  return [...variants];
};

/**
 * Check if a search term is likely to be a card number
 * @param searchTerm The search term to check
 * @returns True if the term appears to be a card number
 */
export const isLikelyCardNumber = (searchTerm: string): boolean => {
  if (!searchTerm) return false;
  
  // Basic check: Contains only digits
  const isJustNumber = /^\d+$/.test(searchTerm.trim());
  
  // Check if it looks like a card number with a slash pattern (e.g., "123/456")
  const isSlashPattern = /^\d+\/\w+$/.test(searchTerm.trim());
  
  // Check if it's a letter followed by numbers (e.g., "SW123")
  const isLetterNumber = /^[A-Za-z]+[-]?\d+$/.test(searchTerm.trim());
  
  return (isJustNumber && searchTerm.trim().length > 0) || isSlashPattern || isLetterNumber;
};
