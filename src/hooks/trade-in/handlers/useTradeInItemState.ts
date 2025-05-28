
import { useRef } from 'react';
import { TradeInItem } from '../../useTradeInList';

interface UseTradeInItemStateProps {
  item: TradeInItem;
  instanceId: string;
}

export const useTradeInItemState = ({ item, instanceId }: UseTradeInItemStateProps) => {
  // Add refs to track previous values and prevent unnecessary updates
  const initialRender = useRef(true);
  const valueChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevPriceRef = useRef<number>(item.price);

  return {
    initialRender,
    valueChangeTimeoutRef,
    prevPriceRef
  };
};
