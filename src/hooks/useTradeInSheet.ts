import { useState, useCallback } from 'react';
import { CardDetails, SavedCard } from '../types/card';
import { TradeInItem } from './useTradeInListWithCustomer';
import { Customer } from './useCustomers';
import { toast } from 'react-hot-toast';

export interface TradeInSheetItem extends Omit<TradeInItem, 'key' | 'isLoadingPrice' | 'error' | 'isPriceUnavailable' | 'fallbackReason' | 'initialCalculation'> {
  // Store complete card data but only expose what's needed in the UI
  fullCardData: CardDetails | SavedCard;
  usedFallback?: boolean;
}

export const useTradeInSheet = () => {
  const [sheetItems, setSheetItems] = useState<TradeInSheetItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const addItemToSheet = useCallback((card: CardDetails | SavedCard, condition: string, price: number) => {
    // Enhanced productId validation
    if (!card.productId) {
      console.error(`Cannot add ${card.name} - Card has no productId`, card);
      toast.error(`Cannot add ${card.name || 'card'} - Missing product ID`);
      return;
    }
    
    // Additional validation to ensure productId is a valid string
    const productId = String(card.productId);
    if (productId === 'undefined' || productId === 'null' || productId === '') {
      console.error(`Invalid product ID for ${card.name}:`, productId);
      toast.error(`Cannot add ${card.name || 'card'} - Invalid product ID`);
      return;
    }

    const cardWithId = {
      ...card,
      id: card.id || crypto.randomUUID(),
      productId: productId,
    };

    // Check if it's a certified card
    const isCertified = card.isCertified || false;

    const newSheetItem: TradeInSheetItem = {
      card: cardWithId,
      fullCardData: card,
      quantity: 1,
      condition: isCertified ? 'certified' : condition,
      isFirstEdition: isCertified ? false : false,
      isHolo: isCertified ? false : true,
      isReverseHolo: isCertified ? false : false,
      price,
      paymentType: 'cash',
      // Values will be calculated automatically
      cashValue: undefined,
      tradeValue: undefined,
      // Manual override flags (all start as false)
      cashValueManuallySet: false,
      tradeValueManuallySet: false,
      marketPriceManuallySet: false
    };

    setSheetItems(prev => [newSheetItem, ...prev]);
    
    if (isCertified) {
      const gradeMessage = price > 0 ? ` (Average sale: $${price})` : '';
      toast.success(`Added PSA grade ${card.certification?.grade} ${card.name} to trade-in sheet${gradeMessage}`);
    } else {
      toast.success(`Added ${card.name} (${condition.replace('_', ' ')}) to trade-in sheet`);
    }
  }, []);

  const removeItemFromSheet = useCallback((index: number) => {
    console.log(`removeItemFromSheet: Removing item at index ${index}`);
    setSheetItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateSheetItem = useCallback((index: number, updates: Partial<TradeInSheetItem>) => {
    setSheetItems(prev => {
      const newItems = [...prev];
      if (newItems[index]) {
        newItems[index] = { ...newItems[index], ...updates };
        console.log(`updateSheetItem: Updated item at index ${index}:`, {
          cardName: newItems[index].card.name,
          updates
        });
      }
      return newItems;
    });
  }, []);

  const updateMarketPrice = useCallback((index: number, newPrice: number) => {
    console.log(`updateMarketPrice: Setting price to ${newPrice} for item at index ${index}`);
    setSheetItems(prev => {
      const newItems = [...prev];
      if (newItems[index]) {
        newItems[index] = {
          ...newItems[index],
          price: newPrice,
          marketPriceManuallySet: true,
          // Reset calculated values to force recalculation
          cashValue: undefined,
          tradeValue: undefined
        };
        
        console.log(`updateMarketPrice: Updated item:`, {
          cardName: newItems[index].card.name,
          newPrice: newItems[index].price,
          marketPriceManuallySet: newItems[index].marketPriceManuallySet
        });
      }
      return newItems;
    });
  }, []);

  const clearSheet = useCallback(() => {
    setSheetItems([]);
    setSelectedCustomer(null);
  }, []);

  const selectCustomer = useCallback((customer: Customer | null) => {
    setSelectedCustomer(customer);
  }, []);

  // Convert sheet items to the format expected by existing trade-in functions
  const getTradeInItems = useCallback((): TradeInItem[] => {
    return sheetItems.map(item => ({
      ...item,
      key: `${item.card.id}-${Date.now()}`,
      isLoadingPrice: false,
      error: undefined,
      isPriceUnavailable: false,
      usedFallback: false,
      fallbackReason: undefined,
      initialCalculation: false
    }));
  }, [sheetItems]);

  return {
    sheetItems,
    selectedCustomer,
    addItemToSheet,
    removeItemFromSheet,
    updateSheetItem,
    updateMarketPrice,
    clearSheet,
    selectCustomer,
    getTradeInItems
  };
};