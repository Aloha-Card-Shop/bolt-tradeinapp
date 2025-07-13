
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
    const itemInitialCalc = !!item.initialCalculation;
    if (initialCalculationState !== itemInitialCalc) {
      console.log(`useInitialCalculation: Syncing state change from ${initialCalculationState} to ${itemInitialCalc} for ${item.card.name}`);
      setInitialCalculationState(itemInitialCalc);
    }
  }, [item.initialCalculation, initialCalculationState, item.card.name]);
  
  return {
    initialCalculationState,
    setInitialCalculation
  };
}
