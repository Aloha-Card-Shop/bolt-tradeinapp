
import { TradeInItem } from '../../../hooks/useTradeInList';

/**
 * Calculates the display value based on payment type and quantity
 */
export function calculateDisplayValue(
  paymentType: 'cash' | 'trade' | null, 
  cashValue: number, 
  tradeValue: number, 
  quantity: number
): number {
  if (!paymentType) return 0;
  const value = paymentType === 'cash' ? cashValue : tradeValue;
  return value * quantity;
}

/**
 * Determines if values have changed from previous calculations
 */
export function haveValuesChanged(
  calculatedCashValue: number,
  prevCalculatedCashValue: number,
  calculatedTradeValue: number,
  prevCalculatedTradeValue: number
): boolean {
  // Consider small floating point differences as unchanged (less than 1 cent)
  const cashDiff = Math.abs(calculatedCashValue - prevCalculatedCashValue);
  const tradeDiff = Math.abs(calculatedTradeValue - prevCalculatedTradeValue);
  
  return cashDiff > 0.01 || tradeDiff > 0.01;
}

/**
 * Creates updated item values based on calculation results
 */
export function createValueUpdates(
  item: TradeInItem,
  calculatedCashValue: number,
  calculatedTradeValue: number, 
  calculationError: string | undefined,
  usedFallback: boolean,
  fallbackReason: string | undefined,
  marketPriceSet: boolean
): Partial<TradeInItem> {
  const updates: Partial<TradeInItem> = {};
  
  // For debugging
  console.log(`createValueUpdates: Creating updates for ${item.card?.name}`, {
    calculatedCashValue,
    calculatedTradeValue,
    currentCashValue: item.cashValue,
    currentTradeValue: item.tradeValue,
    paymentType: item.paymentType,
    marketPriceSet,
    initialCalculation: item.initialCalculation
  });
  
  // Update cash value if not manually set
  if (item.cashValue === undefined) {
    updates.cashValue = calculatedCashValue;
  }
  
  // Update trade value if not manually set
  if (item.tradeValue === undefined) {
    updates.tradeValue = calculatedTradeValue;
  }

  // Set payment type to cash if price is valid and no payment type selected
  if (item.price > 0 && !item.paymentType && !marketPriceSet) {
    updates.paymentType = 'cash';
  }
  
  // Add any error information
  if (calculationError) {
    updates.error = calculationError;
  }
  
  // Add fallback information
  if (usedFallback) {
    updates.usedFallback = true;
    updates.fallbackReason = fallbackReason;
  }
  
  // If this was an initial calculation, mark it as completed
  if (item.initialCalculation) {
    updates.initialCalculation = false;
  }
  
  return updates;
}
