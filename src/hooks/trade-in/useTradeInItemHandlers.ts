
import { useCallback, useEffect, useRef } from 'react';
import { TradeInItem } from '../../hooks/useTradeInList';
import { useItemPrice } from './useItemPrice';
import { useCardAttributes } from './useCardAttributes';

interface UseTradeInItemHandlersProps {
  item: TradeInItem;
  index: number;
  onUpdate: (index: number, item: TradeInItem) => void;
  onValueChange: (values: { tradeValue: number; cashValue: number }) => void;
  instanceId: string;
}

export const useTradeInItemHandlers = ({
  item,
  index,
  onUpdate,
  onValueChange,
  instanceId
}: UseTradeInItemHandlersProps) => {
  // Use the refactored handlers hook
  const {
    displayValue,
    isCalculating,
    refreshPrice,
    cashValue,
    tradeValue,
    error,
    handleConditionChangeWrapper,
    toggleFirstEdition,
    toggleHolo,
    toggleReverseHolo,
    updatePaymentType,
    updateQuantity,
    handlePriceChangeWrapper
  } = useTradeInItemHandlers({
    item,
    index,
    onUpdate,
    onValueChange,
    instanceId
  });

  return {
    displayValue,
    isCalculating,
    refreshPrice,
    cashValue,
    tradeValue,
    error,
    handleConditionChangeWrapper,
    toggleFirstEdition,
    toggleHolo,
    toggleReverseHolo,
    updatePaymentType,
    updateQuantity,
    handlePriceChangeWrapper
  };
};
