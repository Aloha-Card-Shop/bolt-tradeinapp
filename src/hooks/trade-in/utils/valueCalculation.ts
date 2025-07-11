
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
  cashValueManuallySet?: boolean;
  tradeValueManuallySet?: boolean;
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
    calculatedTradeValue,
    cashValueManuallySet,
    tradeValueManuallySet
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

  // Don't recalculate if values have been manually set unless it's an initial calculation
  if (cashValueManuallySet && paymentType === 'cash') {
    console.log('shouldRecalculate: Cash value manually set, skipping recalculation');
    return false;
  }

  if (tradeValueManuallySet && paymentType === 'trade') {
    console.log('shouldRecalculate: Trade value manually set, skipping recalculation');
    return false;
  }

  // Calculate if payment type is cash and values have changed
  if (paymentType === 'cash' && valuesChanged) {
    console.log('shouldRecalculate: Payment type is cash and values changed');
    return true;
  }

  // Calculate if we have calculated values but stored values are zero AND they're not manually set
  // Only treat as "not set" if both are undefined, not if they're 0 (which could be manually set)
  if ((calculatedCashValue > 0 || calculatedTradeValue > 0) && 
      (cashValue === 0 && tradeValue === 0) && 
      (cashValue === undefined || tradeValue === undefined)) {
    console.log('shouldRecalculate: Have calculated values but stored values are undefined/zero');
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
  
  // Update values if undefined OR if they are 0 and we have calculated values > 0
  // But only if they haven't been manually set by the user
  if (!item.cashValueManuallySet && (item.cashValue === undefined || (item.cashValue === 0 && calculatedCashValue > 0))) {
    updates.cashValue = calculatedCashValue;
    console.log(`createValueUpdates: Setting cashValue to ${calculatedCashValue} (was ${item.cashValue})`);
  }
  
  if (!item.tradeValueManuallySet && (item.tradeValue === undefined || (item.tradeValue === 0 && calculatedTradeValue > 0))) {
    updates.tradeValue = calculatedTradeValue;
    console.log(`createValueUpdates: Setting tradeValue to ${calculatedTradeValue} (was ${item.tradeValue})`);
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
