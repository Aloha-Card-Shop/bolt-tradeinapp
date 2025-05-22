import { useState, useCallback } from 'react';
import { CardDetails } from '../types/card';
import { fetchCardPrices } from '../utils/scraper';
import { toast } from 'react-hot-toast';

export interface TradeInItem {
  card: CardDetails & {
    certification?: {
      certNumber: string;
      grade: string;
      certificationDate?: string;
    };
    isCertified?: boolean;
  };
  quantity: number;
  condition: string;
  isFirstEdition: boolean;
  isHolo: boolean;
  isReverseHolo?: boolean;
  price: number;
  cashValue?: number;
  tradeValue?: number;
  paymentType: 'cash' | 'trade' | null;
  key?: string;
  isLoadingPrice?: boolean; 
  error?: string;
  isPriceUnavailable?: boolean;
  usedFallback?: boolean;
  fallbackReason?: string;
  initialCalculation?: boolean;
}

export const useTradeInList = () => {
  const [items, setItems] = useState<TradeInItem[]>([]);

  const addItem = useCallback((card: CardDetails, price: number) => {
    // Generate a unique ID for the card if it doesn't have one
    const cardWithId = {
      ...card,
      id: card.id || crypto.randomUUID()
    };

    // Always add as a new item
    setItems(prev => [...prev, {
      card: cardWithId,
      quantity: 1,
      condition: '',
      isFirstEdition: false,
      isHolo: true,
      isReverseHolo: false,
      price: price || 0,
      paymentType: null, 
      isLoadingPrice: false,
      error: undefined,
      isPriceUnavailable: false,
      initialCalculation: true
    }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index: number, item: TradeInItem) => {
    setItems(prev => {
      // If index is equal to length, this is an add operation
      if (index === prev.length) {
        return [...prev, item];
      }
      
      // Otherwise it's an update operation
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
          newItems[index] = {
            ...newItems[index],
            [key]: value,
          };
        }
        return newItems;
      });
    },
    []
  );

  const fetchItemPrice = useCallback(async (index: number) => {
    const item = items[index];
    if (!item || !item.card.productId || !item.condition) {
      return;
    }
    
    // Check if this is a certified card
    if (item.card.isCertified) {
      // For certified cards, we'll need to implement separate pricing logic
      // For now, we'll just use the existing price
      console.log("Certificate card pricing not implemented yet, using default price");
      return;
    }
    
    updateItemAttribute(index, 'isLoadingPrice', true);
    updateItemAttribute(index, 'error', undefined);
    updateItemAttribute(index, 'isPriceUnavailable', false);
    
    try {
      const data = await fetchCardPrices(
        item.card.productId,
        item.condition,
        item.isFirstEdition,
        item.isHolo,
        item.card.game,
        item.isReverseHolo
      );
      
      if (data.unavailable) {
        updateItemAttribute(index, 'price', 0);
        updateItemAttribute(index, 'isPriceUnavailable', true);
        toast.error("No price available for this card configuration");
      } else {
        updateItemAttribute(index, 'price', parseFloat(data.price));
        updateItemAttribute(index, 'isPriceUnavailable', false);
      }
    } catch (e) {
      updateItemAttribute(index, 'error', (e as Error).message);
    } finally {
      updateItemAttribute(index, 'isLoadingPrice', false);
    }
  }, [items, updateItemAttribute]);

  const clearList = useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    updateItemAttribute,
    fetchItemPrice,
    clearList
  };
};
