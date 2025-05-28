
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
 * Determines if recalculation should occur
 */
export function shouldRecalculate(params: {
  isLoading: boolean;
  price: number;
  cashValue?: number;
  tradeValue?: number;
  paymentType: 'cash' | 'trade' | null;
  initialCalculationState: boolean;
  itemInitialCalculation?: boolean;
  valuesChanged: boolean;
  calculatedCashValue: number;
  calculatedTradeValue: number;
}): boolean {
  const {
    isLoading,
    price,
    cashValue,
    tradeValue,
    paymentType,
    initialCalculationState,
    itemInitialCalculation,
    valuesChanged,
    calculatedCashValue,
    calculatedTradeValue
  } = params;

  // Don't calculate if still loading or no price
  if (isLoading || price <= 0) {
    return false;
  }

  // Always calculate if values are undefined (new/re-added items)
  if (cashValue === undefined || tradeValue === undefined) {
    console.log('shouldRecalculate: Values are undefined, forcing calculation');
    return true;
  }

  // Always calculate if this is an initial calculation
  if (initialCalculationState || itemInitialCalculation) {
    console.log('shouldRecalculate: Initial calculation state, forcing calculation');
    return true;
  }

  // Calculate if payment type is cash and values have changed
  if (paymentType === 'cash' && valuesChanged) {
    console.log('shouldRecalculate: Payment type is cash and values changed');
    return true;
  }

  // Calculate if we have calculated values but no stored values (fallback case)
  if ((calculatedCashValue > 0 || calculatedTradeValue > 0) && 
      (cashValue === 0 && tradeValue === 0)) {
    console.log('shouldRecalculate: Have calculated values but stored values are zero');
    return true;
  }

  return false;
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
  
  // Always update cash value if undefined, even if calculated value is 0
  if (item.cashValue === undefined) {
    updates.cashValue = calculatedCashValue;
    console.log(`createValueUpdates: Setting cashValue to ${calculatedCashValue}`);
  }
  
  // Always update trade value if undefined, even if calculated value is 0
  if (item.tradeValue === undefined) {
    updates.tradeValue = calculatedTradeValue;
    console.log(`createValueUpdates: Setting tradeValue to ${calculatedTradeValue}`);
  }

  // Set payment type to cash if price is valid and no payment type selected
  if (item.price > 0 && !item.paymentType && !marketPriceSet) {
    updates.paymentType = 'cash';
    console.log(`createValueUpdates: Setting paymentType to cash`);
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
    console.log(`createValueUpdates: Marking initialCalculation as false`);
  }
  
  return updates;
}
