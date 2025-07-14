
import { useState, useCallback, useEffect } from 'react';
import { CardDetails } from '../types/card';
import { fetchCardPrices } from '../utils/scraper';
import { toast } from 'react-hot-toast';
import { usePsaPriceLookup } from './usePsaPriceLookup';
import { Customer } from './useCustomers';
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

const STORAGE_KEY = 'tradeInProgress';

export const useTradeInListWithCustomer = () => {
  const [items, setItems] = useState<TradeInItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { lookupPsaPrice } = usePsaPriceLookup();

  // Set up persistence with immediate saving
  const persistenceData = { items, selectedCustomer };
  const { loadFromStorage, clearStorage, saveToStorage } = useLocalStoragePersistence({
    key: STORAGE_KEY,
    data: persistenceData,
    saveInterval: 100 // Save very quickly to prevent data loss
  });

  // Load saved data on mount
  useEffect(() => {
    const savedData = loadFromStorage();
    if (savedData) {
      if (savedData.items && Array.isArray(savedData.items) && savedData.items.length > 0) {
        console.log(`Restoring ${savedData.items.length} items from localStorage`);
        setItems(savedData.items);
      }
      if (savedData.selectedCustomer) {
        console.log('Restoring selected customer from localStorage');
        setSelectedCustomer(savedData.selectedCustomer);
      }
    }
  }, [loadFromStorage]);

  // Force save whenever items or customer changes
  useEffect(() => {
    if (items.length > 0 || selectedCustomer) {
      saveToStorage();
    }
  }, [items, selectedCustomer, saveToStorage]);

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
        // For certified cards, we don't need these attributes
        isFirstEdition: isCertified ? false : false,
        isHolo: isCertified ? false : true,
        isReverseHolo: isCertified ? false : false,
        price: finalPrice,
        paymentType: null, 
        // Explicitly set values as undefined to force calculation
        cashValue: undefined,
        tradeValue: undefined,
        isLoadingPrice: false,
        error: undefined,
        isPriceUnavailable: false,
        initialCalculation: true, // Always mark new items for initial calculation
        cashValueManuallySet: false,
        tradeValueManuallySet: false,
        marketPriceManuallySet: false
      };
      
      console.log(`addItem: Creating new item with initial state:`, {
        cardName: newItem.card.name,
        price: newItem.price,
        cashValue: newItem.cashValue,
        tradeValue: newItem.tradeValue,
        initialCalculation: newItem.initialCalculation
      });
      
      const newList = [newItem, ...prev];
      console.log('useTradeInListWithCustomer: Added new item. Updated order:', newList.map((item, idx) => ({ idx, name: item.card.name, id: item.card.id })));
      return newList;
    });
    
    // If it's a certified card, show a different success message
    if (isCertified) {
      const gradeMessage = finalPrice > 0 ? ` (Average sale: $${finalPrice})` : '';
      toast.success(`Added PSA grade ${card.certification?.grade} ${card.name} to trade-in list${gradeMessage}`);
    }
  }, [lookupPsaPrice]);

  const removeItem = useCallback((index: number) => {
    console.log(`removeItem: Removing item at index ${index}`);
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index: number, item: TradeInItem) => {
    setItems(prev => {
      // If index is equal to length, this is an add operation
      if (index === prev.length) {
        console.log(`updateItem: Adding new item at index ${index}:`, {
          cardName: item.card.name,
          cashValue: item.cashValue,
          tradeValue: item.tradeValue
        });
        return [...prev, item];
      }
      
      // Otherwise it's an update operation
      const newItems = [...prev];
      console.log(`updateItem: Updating item at index ${index}:`, {
        cardName: item.card.name,
        oldCashValue: newItems[index]?.cashValue,
        newCashValue: item.cashValue,
        oldTradeValue: newItems[index]?.tradeValue,
        newTradeValue: item.tradeValue
      });
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

          // Clear manual override flags when relevant attributes change (but not when manually setting price)
          if ((key === 'condition' || key === 'paymentType' || key === 'isFirstEdition' || key === 'isHolo') && key !== 'price') {
            updatedItem.cashValueManuallySet = false;
            updatedItem.tradeValueManuallySet = false;
            updatedItem.marketPriceManuallySet = false;
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

  // New function to handle manual market price changes
  const handleMarketPriceChange = useCallback((index: number, newPrice: number) => {
    console.log(`handleMarketPriceChange: Setting price to ${newPrice} for item at index ${index}`);
    setItems((prev) => {
      const newItems = [...prev];
      if (newItems[index]) {
        const updatedItem = { 
          ...newItems[index],
          price: newPrice,
          marketPriceManuallySet: true,
          // Clear initial calculation flag to prevent auto-updates
          initialCalculation: false
        };
        
        console.log(`handleMarketPriceChange: Updated item:`, {
          cardName: updatedItem.card.name,
          newPrice: updatedItem.price,
          marketPriceManuallySet: updatedItem.marketPriceManuallySet,
          initialCalculation: updatedItem.initialCalculation
        });
        
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
      console.log('Fetching price with attributes:', {
        productId: item.card.productId,
        condition: item.condition,
        isFirstEdition: item.isFirstEdition,
        isHolo: item.isHolo,
        isReverseHolo: item.isReverseHolo,
        game: item.card.game
      });
      
      const data = await fetchCardPrices(
        item.card.productId,
        item.condition,
        item.isFirstEdition, // Explicitly pass the current state
        item.isHolo,         // Explicitly pass the current state
        item.card.game,
        item.isReverseHolo   // Explicitly pass the current state
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
    setSelectedCustomer(null);
    clearStorage(); // Clear saved progress when intentionally clearing
  }, [clearStorage]);

  // Customer management functions
  const selectCustomer = useCallback((customer: Customer | null) => {
    setSelectedCustomer(customer);
  }, []);

  return {
    items,
    selectedCustomer,
    addItem,
    removeItem,
    updateItem,
    updateItemAttribute,
    handleValueAdjustment,
    handleMarketPriceChange,
    fetchItemPrice,
    clearList,
    selectCustomer
  };
};
