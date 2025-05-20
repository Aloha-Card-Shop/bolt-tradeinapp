
// Central place to configure fallback percentages for trade value calculations
export const DEFAULT_FALLBACK_CASH_PERCENTAGE = 35; // 35% of base value
export const DEFAULT_FALLBACK_TRADE_PERCENTAGE = 50; // 50% of base value

// Configure user-facing error messages
export const ERROR_MESSAGES = {
  CALCULATION_FAILED: "Trade value calculation failed. Using default values.",
  NO_SETTINGS_FOUND: "No trade settings found for this game. Using default values.",
  INVALID_PRICE_RANGE: "No price range found for this value. Using default values.",
  DATABASE_ERROR: "Database error occurred. Using default values."
};
