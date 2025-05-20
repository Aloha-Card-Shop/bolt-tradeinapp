
// Default percentages for fallback calculations
export const DEFAULT_FALLBACK_CASH_PERCENTAGE = 35;
export const DEFAULT_FALLBACK_TRADE_PERCENTAGE = 50;

// Standard error messages for different fallback scenarios
export const ERROR_MESSAGES = {
  CALCULATION_FAILED: 'Unable to calculate accurate trade value.',
  DATABASE_ERROR: 'Database error occurred. Using estimated values.',
  NO_SETTINGS_FOUND: 'No trade value settings found for this game type.',
  NO_PRICE_RANGE_MATCH: 'No price bracket found for this value.',
  API_ERROR: 'Error connecting to the calculation service.',
  METHOD_NOT_ALLOWED: 'Invalid request method.',
  INVALID_INPUT: 'Invalid input values provided.',
  UNKNOWN_ERROR: 'An unknown error occurred during calculation.'
};
