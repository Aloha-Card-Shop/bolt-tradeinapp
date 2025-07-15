import { useState, useCallback } from 'react';
import { TradeInItem } from '../useTradeInList';

export const useTradeInItems = () => {
  const [items, setItems] = useState<TradeInItem[]>([]);

  const addItem = useCallback((item: TradeInItem) => {
    setItems(prev => [item, ...prev]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index: number, item: TradeInItem) => {
    setItems(prev => {
      if (index === prev.length) {
        return [...prev, item];
      }
      const newItems = [...prev];
      newItems[index] = item;
      return newItems;
    });
  }, []);

  const updateItemAttribute = useCallback(
    <K extends keyof TradeInItem>(index: number, key: K, value: TradeInItem[K]) => {
      setItems((prev) => {
        const newItems = [...prev];
        if (newItems[index]) {
          const updatedItem = {
            ...newItems[index],
            [key]: value,
          };

          // Clear manual override flags when relevant attributes change
          if (key === 'price' || key === 'condition' || key === 'paymentType' || key === 'isFirstEdition' || key === 'isHolo') {
            updatedItem.cashValueManuallySet = false;
            updatedItem.tradeValueManuallySet = false;
            console.log(`updateItemAttribute: Cleared manual override flags due to ${key} change`);
          }

          newItems[index] = updatedItem;
        }
        return newItems;
      });
    },
    []
  );

  const handleValueAdjustment = useCallback((index: number, valueType: 'cash' | 'trade', value: number) => {
    setItems((prev) => {
      const newItems = [...prev];
      if (newItems[index]) {
        const updatedItem = { ...newItems[index] };
        
        if (valueType === 'cash') {
          updatedItem.cashValue = value;
          updatedItem.cashValueManuallySet = true;
          console.log(`handleValueAdjustment: Manually set cash value to ${value}`);
        } else {
          updatedItem.tradeValue = value;
          updatedItem.tradeValueManuallySet = true;
          console.log(`handleValueAdjustment: Manually set trade value to ${value}`);
        }
        
        newItems[index] = updatedItem;
      }
      return newItems;
    });
  }, []);

  const clearList = useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    setItems,
    addItem,
    removeItem,
    updateItem,
    updateItemAttribute,
    handleValueAdjustment,
    clearList
  };
};