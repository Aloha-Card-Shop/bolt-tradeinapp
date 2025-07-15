import { useCallback, useEffect } from 'react';
import { CardDetails } from '../types/card';
import { toast } from 'react-hot-toast';
import { usePsaPriceLookup } from './usePsaPriceLookup';
import { useLocalStoragePersistence } from './useLocalStoragePersistence';
import { useTradeInItems } from './trade-in/useTradeInItems';
import { useTradeInPricing } from './trade-in/useTradeInPricing';

export interface TradeInItem {
  card: CardDetails;
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
  // Manual override flags
  cashValueManuallySet?: boolean;
  tradeValueManuallySet?: boolean;
  marketPriceManuallySet?: boolean;
}

const STORAGE_KEY = 'tradeInItemsProgress';

export const useTradeInList = () => {
  const { lookupPsaPrice } = usePsaPriceLookup();
  const { 
    items, 
    setItems,
    addItem: addItemToList,
    removeItem,
    updateItem,
    updateItemAttribute,
    handleValueAdjustment,
    clearList: clearItemsList
  } = useTradeInItems();
  
  const { fetchItemPrice } = useTradeInPricing(updateItemAttribute);

  // Set up persistence
  const { loadFromStorage, clearStorage } = useLocalStoragePersistence({
    key: STORAGE_KEY,
    data: { items },
    saveInterval: 500 // Save every 500ms to prevent lag
  });

  // Load saved data on mount
  useEffect(() => {
    const savedData = loadFromStorage();
    if (savedData && savedData.items && Array.isArray(savedData.items) && savedData.items.length > 0) {
      setItems(savedData.items);
      console.log(`Restored ${savedData.items.length} items from localStorage`);
    }
  }, [loadFromStorage]);

  const addItem = useCallback(async (card: CardDetails, price: number) => {
    const cardWithId = {
      ...card,
      id: card.id || crypto.randomUUID()
    };

    const isCertified = card.isCertified || false;
    let finalPrice = price || 0;
    let priceSource = card.priceSource;

    if (isCertified && !price && card.certification?.grade) {
      try {
        console.log("Certified card detected - looking up price from eBay");
        const priceData = await lookupPsaPrice(card);
        
        if (priceData && priceData.averagePrice) {
          finalPrice = priceData.averagePrice;
          priceSource = {
            name: 'eBay',
            url: priceData.searchUrl,
            salesCount: priceData.salesCount,
            foundSales: true
          };
          console.log(`Found average price: $${finalPrice} from ${priceData.salesCount} sales`);
        } else if (priceData && priceData.searchUrl) {
          priceSource = {
            name: 'eBay',
            url: priceData.searchUrl,
            salesCount: 0,
            foundSales: false
          };
        }
      } catch (error) {
        console.error("Error looking up certified card price:", error);
      }
    }

    const newItem: TradeInItem = {
      card: {
        ...cardWithId,
        priceSource: priceSource
      },
      quantity: 1,
      condition: isCertified ? 'certified' : '',
      isFirstEdition: card.variantStates?.isFirstEdition || false,
      isHolo: card.variantStates?.isHolo || false,
      isReverseHolo: card.variantStates?.isReverseHolo || false,
      price: finalPrice,
      paymentType: null, 
      isLoadingPrice: false,
      error: undefined,
      isPriceUnavailable: false,
      initialCalculation: true,
      cashValueManuallySet: false,
      tradeValueManuallySet: false,
      marketPriceManuallySet: false
    };

    addItemToList(newItem);
    
    if (isCertified) {
      const gradeMessage = finalPrice > 0 ? ` (Average sale: $${finalPrice})` : '';
      toast.success(`Added PSA grade ${card.certification?.grade} ${card.name} to trade-in list${gradeMessage}`);
    }
  }, [lookupPsaPrice, addItemToList]);

  const clearList = useCallback(() => {
    clearItemsList();
    clearStorage();
  }, [clearItemsList, clearStorage]);

  const fetchItemPriceWithIndex = useCallback(async (index: number) => {
    const item = items[index];
    if (item) {
      await fetchItemPrice(index, item);
    }
  }, [items, fetchItemPrice]);

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    updateItemAttribute,
    handleValueAdjustment,
    fetchItemPrice: fetchItemPriceWithIndex,
    clearList
  };
};
