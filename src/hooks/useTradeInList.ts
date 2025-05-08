import { useState } from 'react';
import { CardDetails } from '../types/card';

export interface TradeInItem {
  card: CardDetails;
  quantity: number;
  condition: 'near_mint' | 'lightly_played' | 'moderately_played' | 'heavily_played' | 'damaged' | '';
  isFirstEdition: boolean;
  isHolo: boolean;
  price: number;
  paymentType: 'cash' | 'trade';
  isLoadingPrice?: boolean;
  error?: string;
}

export const useTradeInList = () => {
  const [items, setItems] = useState<TradeInItem[]>([]);

  const addItem = (card: CardDetails, price: number) => {
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
      price: price || 0,
      paymentType: 'cash',
      isLoadingPrice: false,
      error: undefined
    }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, item: TradeInItem) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = item;
      return newItems;
    });
  };

  const clearList = () => {
    setItems([]);
  };

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    clearList
  };
};