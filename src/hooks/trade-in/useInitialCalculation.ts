
import { useState, useCallback, useEffect } from 'react';
import { TradeInItem } from '../useTradeInList';

interface UseInitialCalculationProps {
  item: TradeInItem;
  onUpdate: (updates: Partial<TradeInItem>) => void;
}

export function useInitialCalculation({ item, onUpdate }: UseInitialCalculationProps) {
  const [initialCalculationState, setInitialCalculationState] = useState<boolean>(!!item.initialCalculation);
  
  const setInitialCalculation = useCallback((value: boolean) => {
    console.log(`useInitialCalculation: Setting initialCalculation to ${value} for ${item.card.name}`);
    setInitialCalculationState(value);
    onUpdate({ initialCalculation: value });
  }, [item.card.name, onUpdate]);
  
  // Sync initialCalculation state with item prop
  useEffect(() => {
    if (initialCalculationState !== !!item.initialCalculation) {
      setInitialCalculationState(!!item.initialCalculation);
    }
  }, [item.initialCalculation, initialCalculationState]);
  
  return {
    initialCalculationState,
    setInitialCalculation
  };
}
