
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
 * Generate a SKU for a graded card using PSA certification number
 * @param certNumber PSA certification number
 * @param grade Card grade (1-10)
 * @param condition Card condition
 * @returns A formatted SKU string for graded cards
 */
export const generateGradedSku = (
  certNumber: string,
  grade: string | number,
  condition: string
): string => {
  const conditionCode = getConditionCode(condition);
  return `PSA-${certNumber}-${grade}-${conditionCode}`;
};

/**
 * Generate a SKU for a card based on its attributes
 * @param tcgplayerId TCGplayer ID of the card
 * @param isFirstEdition Whether the card is first edition
 * @param isHolo Whether the card is holo
 * @param condition Card condition
 * @param isReverseHolo Whether the card is reverse holo
 * @param certificationData Optional certification data for graded cards
 * @returns A formatted SKU string
 */
export const generateSku = (
  tcgplayerId: string | undefined,
  isFirstEdition: boolean,
  isHolo: boolean,
  condition: string,
  isReverseHolo?: boolean,
  certificationData?: {
    isCertified?: boolean;
    certNumber?: string;
    grade?: string | number;
  }
): string => {
  // Check if this is a graded card
  if (certificationData?.isCertified && certificationData?.certNumber && certificationData?.grade) {
    return generateGradedSku(certificationData.certNumber, certificationData.grade, condition);
  }
  
  // Fall back to ungraded card SKU
  if (!tcgplayerId) return 'UNKNOWN';
  
  const editionHoloCode = getEditionHoloCode(isFirstEdition, isHolo, isReverseHolo);
  const conditionCode = getConditionCode(condition);
  
  return `${tcgplayerId}-${editionHoloCode}${conditionCode}`;
};

/**
 * Parse a graded card SKU back into its components
 * @param sku The graded SKU string to parse
 * @returns Object containing the parsed components or null if invalid
 */
export const parseGradedSku = (sku: string): {
  certNumber: string;
  grade: string;
  conditionCode: string;
} | null => {
  const match = sku.match(/^PSA-(.+)-(.+)-([A-Z])$/);
  if (!match) return null;
  
  const [, certNumber, grade, conditionCode] = match;
  
  return {
    certNumber,
    grade,
    conditionCode
  };
};

/**
 * Check if a SKU is for a graded card
 * @param sku The SKU string to check
 * @returns True if the SKU is for a graded card
 */
export const isGradedSku = (sku: string): boolean => {
  return sku.startsWith('PSA-');
};

/**
 * Parse a SKU back into its components (handles both graded and ungraded)
 * @param sku The SKU string to parse
 * @returns Object containing the parsed components
 */
export const parseSku = (sku: string): {
  tcgplayerId?: string;
  editionHoloCode?: string;
  conditionCode: string;
  certNumber?: string;
  grade?: string;
  isGraded: boolean;
} | null => {
  // Check if it's a graded card SKU
  if (isGradedSku(sku)) {
    const gradedData = parseGradedSku(sku);
    if (!gradedData) return null;
    
    return {
      certNumber: gradedData.certNumber,
      grade: gradedData.grade,
      conditionCode: gradedData.conditionCode,
      isGraded: true
    };
  }
  
  // Parse ungraded card SKU
  const match = sku.match(/^(.+)-([a-z]{2})([A-Z])$/);
  if (!match) return null;
  
  const [, tcgplayerId, editionHoloCode, conditionCode] = match;
  
  return {
    tcgplayerId,
    editionHoloCode,
    conditionCode,
    isGraded: false
  };
};
