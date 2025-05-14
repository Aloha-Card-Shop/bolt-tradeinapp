
/**
 * Utility functions for generating and managing SKUs based on TCGplayer ID and card attributes
 */

/**
 * Generate an edition/holo code based on card attributes
 * @param isFirstEdition Whether the card is first edition
 * @param isHolo Whether the card is holo
 * @param isReverseHolo Whether the card is reverse holo
 * @returns A two-character code for edition and holo status
 */
export const getEditionHoloCode = (
  isFirstEdition: boolean,
  isHolo: boolean,
  isReverseHolo?: boolean
): string => {
  if (isFirstEdition && isHolo) return 'fh'; // 1st edition holo
  if (isFirstEdition) return 'fe'; // 1st edition
  if (isHolo) return 'ho'; // regular holo
  if (isReverseHolo) return 'rh'; // reverse holo
  return 'un'; // unlimited/normal
};

/**
 * Convert a condition string to its code
 * @param condition Card condition
 * @returns A single character code for the condition
 */
export const getConditionCode = (condition: string): string => {
  const conditionMap: Record<string, string> = {
    'near_mint': 'N',
    'lightly_played': 'L',
    'moderately_played': 'M',
    'heavily_played': 'H',
    'damaged': 'D'
  };
  
  return conditionMap[condition] || 'N';
};

/**
 * Generate a SKU for a card based on its attributes
 * @param tcgplayerId TCGplayer ID of the card
 * @param isFirstEdition Whether the card is first edition
 * @param isHolo Whether the card is holo
 * @param isReverseHolo Whether the card is reverse holo
 * @param condition Card condition
 * @returns A formatted SKU string
 */
export const generateSku = (
  tcgplayerId: string | undefined,
  isFirstEdition: boolean,
  isHolo: boolean,
  condition: string,
  isReverseHolo?: boolean
): string => {
  if (!tcgplayerId) return 'UNKNOWN';
  
  const editionHoloCode = getEditionHoloCode(isFirstEdition, isHolo, isReverseHolo);
  const conditionCode = getConditionCode(condition);
  
  return `${tcgplayerId}-${editionHoloCode}${conditionCode}`;
};

/**
 * Parse a SKU back into its components
 * @param sku The SKU string to parse
 * @returns Object containing the parsed components
 */
export const parseSku = (sku: string): {
  tcgplayerId: string;
  editionHoloCode: string;
  conditionCode: string;
} | null => {
  const match = sku.match(/^(.+)-([a-z]{2})([A-Z])$/);
  if (!match) return null;
  
  const [, tcgplayerId, editionHoloCode, conditionCode] = match;
  
  return {
    tcgplayerId,
    editionHoloCode,
    conditionCode
  };
};
