
import { useRef, useCallback } from 'react';
import { haveValuesChanged } from './utils/valueCalculation';

export function useValueTracking(calculatedCashValue: number, calculatedTradeValue: number) {
  const prevCalculatedCashValue = useRef<number>(0);
  const prevCalculatedTradeValue = useRef<number>(0);
  
  const valuesChanged = useCallback(() => {
    return haveValuesChanged(
      calculatedCashValue,
      prevCalculatedCashValue.current,
      calculatedTradeValue,
      prevCalculatedTradeValue.current
    );
  }, [calculatedCashValue, calculatedTradeValue]);
  
  return {
    prevCalculatedCashValue,
    prevCalculatedTradeValue,
    valuesChanged
  };
}
