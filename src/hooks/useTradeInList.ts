import { useState, useCallback, useEffect } from 'react';
import { CardDetails } from '../types/card';
import { fetchCardPrices } from '../utils/scraper';
import { toast } from 'react-hot-toast';
import { usePsaPriceLookup } from './usePsaPriceLookup';
import { useLocalStoragePersistence } from './useLocalStoragePersistence';

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
  const [items, setItems] = useState<TradeInItem[]>([]);
  const { lookupPsaPrice } = usePsaPriceLookup();

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
    // Generate a unique ID for the card if it doesn't have one
    const cardWithId = {
      ...card,
      id: card.id || crypto.randomUUID()
    };

    // Check if it's a certified card
    const isCertified = card.isCertified || false;

    // Use eBay for certified cards if no price is provided
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
          // We have a search URL but no price data
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

    // Always add as a new item
    setItems(prev => {
      const newItem: TradeInItem = {
        card: {
          ...cardWithId,
          priceSource: priceSource // Add the price source if available
        },
        quantity: 1,
        // For certified cards, we don't need condition
        condition: isCertified ? 'certified' : '',
        // Use variant states from search results if available
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
      const newList = [newItem, ...prev];
      console.log('useTradeInList: Added new item. Updated order:', newList.map((item, idx) => ({ idx, name: item.card.name, id: item.card.id })));
      return newList;
    });
    
    // If it's a certified card, show a different success message
    if (isCertified) {
      const gradeMessage = finalPrice > 0 ? ` (Average sale: $${finalPrice})` : '';
      toast.success(`Added PSA grade ${card.certification?.grade} ${card.name} to trade-in list${gradeMessage}`);
    }
  }, [lookupPsaPrice]);

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

  // New function to handle manual value adjustments
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

  const fetchItemPrice = useCallback(async (index: number) => {
    const item = items[index];
    if (!item || !item.card.productId || (!item.condition && !item.card.isCertified)) {
      return;
    }
    
    // Check if this is a certified card
    if (item.card.isCertified) {
      // For certified cards, we'll try to use eBay
      updateItemAttribute(index, 'isLoadingPrice', true);
      updateItemAttribute(index, 'error', undefined);
      updateItemAttribute(index, 'isPriceUnavailable', false);
      
      try {
        console.log("Fetching certified card price from eBay");
        const priceData = await lookupPsaPrice(item.card);
        
        if (priceData && priceData.averagePrice) {
          updateItemAttribute(index, 'price', priceData.averagePrice);
          updateItemAttribute(index, 'isPriceUnavailable', false);
          
          // Update price source
          const updatedCard = {
            ...item.card,
            priceSource: {
              name: 'eBay',
              url: priceData.searchUrl,
              salesCount: priceData.salesCount,
              foundSales: true
            }
          };
          updateItemAttribute(index, 'card', updatedCard);
          
          console.log(`Found average price: $${priceData.averagePrice} from ${priceData.salesCount} sales`);
        } else {
          updateItemAttribute(index, 'price', 0);
          updateItemAttribute(index, 'isPriceUnavailable', true);
          
          if (priceData && priceData.searchUrl) {
            // Add the search URL even if we don't have price data
            const updatedCard = {
              ...item.card,
              priceSource: {
                name: 'eBay',
                url: priceData.searchUrl,
                salesCount: 0,
                foundSales: false
              }
            };
            updateItemAttribute(index, 'card', updatedCard);
          }
          
          toast.error("No price data available for this PSA card");
        }
      } catch (e) {
        updateItemAttribute(index, 'error', (e as Error).message);
        toast.error("Error fetching PSA card price");
      } finally {
        updateItemAttribute(index, 'isLoadingPrice', false);
      }
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
  }, [items, updateItemAttribute, lookupPsaPrice]);

  const clearList = useCallback(() => {
    setItems([]);
    clearStorage(); // Clear saved progress when intentionally clearing
  }, [clearStorage]);

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    updateItemAttribute,
    handleValueAdjustment,
    fetchItemPrice,
    clearList
  };
};
