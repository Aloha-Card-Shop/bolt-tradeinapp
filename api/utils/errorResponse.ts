
import { CalculationResult } from '../src/types/calculation';
import { 
  DEFAULT_FALLBACK_CASH_PERCENTAGE, 
  DEFAULT_FALLBACK_TRADE_PERCENTAGE,
  ERROR_MESSAGES
} from '../src/constants/fallbackValues';

// Create structured response with errors and fallback info
export function createErrorResponse(
  baseValue: number,
  errorMessage: string, 
  fallbackReason: keyof typeof ERROR_MESSAGES
): CalculationResult {
  // Calculate fallback values
  const cashValue = parseFloat((baseValue * (DEFAULT_FALLBACK_CASH_PERCENTAGE / 100)).toFixed(2));
  const tradeValue = parseFloat((baseValue * (DEFAULT_FALLBACK_TRADE_PERCENTAGE / 100)).toFixed(2));
  
  // Return structured response with the appropriate error message from constants
  return {
    cashValue,
    tradeValue,
    usedFallback: true,
    fallbackReason,
    error: ERROR_MESSAGES[fallbackReason] || errorMessage
  };
}
