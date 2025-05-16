import { useCallback, useEffect, useState, useRef } from 'react';
import { fetchCardPrices } from '../../utils/scraper';
import { toast } from 'react-hot-toast';
import { TradeInItem } from '../useTradeInList';
import { useTradeValue } from '../useTradeValue';

interface UseItemPriceProps {
  item: TradeInItem;
  onUpdate: (updates: Partial<TradeInItem>) => void;
}

export const useItemPrice = ({ item, onUpdate }: UseItemPriceProps) => {
  // Add detailed logging for debugging
  console.log(`useItemPrice: Initializing for card ${item.card.name}`, {
    game: item.card.game,
    price: item.price,
    cardData: item.card
  });
  
  // Validate game type and price before calculating
  const validGame = item.card.game ? true : false;
  const validPrice = item.price > 0;
  
  if (!validGame || !validPrice) {
    console.warn(`useItemPrice: Invalid input data for ${item.card.name}`, {
      validGame,
      validPrice,
      game: item.card.game,
      price: item.price
    });
  }
  
  // Get standard calculated values from the trade value hook
  const { 
    cashValue: calculatedCashValue, 
    tradeValue: calculatedTradeValue, 
    isLoading,
    error: calculationError
  } = useTradeValue(item.card.game, item.price);
  
  // Track the values with refs to detect changes
  const prevCalculatedCashValue = useRef<number>(0);
  const prevCalculatedTradeValue = useRef<number>(0);
  const initialCalculation = useRef<boolean>(true);
  
  // Add additional logging for the useTradeValue hook results
  useEffect(() => {
    console.log(`useItemPrice: Trade value hook returned values for ${item.card.name}:`, {
      calculatedCashValue,
      calculatedTradeValue,
      isLoading,
      hasError: !!calculationError,
      errorMessage: calculationError,
      currentPrice: item.price,
      gameType: item.card.game
    });
    
    // Show error toast if calculation failed
    if (calculationError && !isLoading) {
      toast.error(`Trade value calculation issue: ${calculationError}`);
    }
  }, [calculatedCashValue, calculatedTradeValue, isLoading, calculationError, item.card.name, item.price, item.card.game]);
  
  // Use the manually set values if they exist, otherwise use the calculated values
  const cashValue = item.cashValue !== undefined ? item.cashValue : calculatedCashValue;
  const tradeValue = item.tradeValue !== undefined ? item.tradeValue : calculatedTradeValue;
  
  const [displayValue, setDisplayValue] = useState(0);
  
  // Calculate the display value based on payment type
  useEffect(() => {
    console.log(`useItemPrice: Effect triggered with cashValue=${cashValue}, tradeValue=${tradeValue}, isLoading=${isLoading}`);
    
    const value = item.paymentType === 'cash' ? cashValue : tradeValue;
    setDisplayValue(value * item.quantity);
    
    // Only update the calculated values if they've changed and no manual override exists
    if (!isLoading && item.price > 0) {
      console.log(`useItemPrice: Checking if values changed:`, {
        card: item.card.name,
        calculatedCash: calculatedCashValue,
        prevCalcCash: prevCalculatedCashValue.current,
        calculatedTrade: calculatedTradeValue,
        prevCalcTrade: prevCalculatedTradeValue.current,
        isInitial: initialCalculation.current,
        hasManualCashValue: item.cashValue !== undefined,
        hasManualTradeValue: item.tradeValue !== undefined
      });
      
      // Values have actually changed and are different from what we had before
      const hasCashValueChanged = calculatedCashValue !== prevCalculatedCashValue.current;
      const hasTradeValueChanged = calculatedTradeValue !== prevCalculatedTradeValue.current;
      
      // If it's the first calculation or values have changed, update
      if (initialCalculation.current || hasCashValueChanged || hasTradeValueChanged) {
        // Store new calculated values in refs
        prevCalculatedCashValue.current = calculatedCashValue;
        prevCalculatedTradeValue.current = calculatedTradeValue;
        initialCalculation.current = false;
        
        // Update with new calculated values, but only if they're not manually overridden
        const updates: Partial<TradeInItem> = {};
        
        if (item.cashValue === undefined) {
          updates.cashValue = calculatedCashValue;
        }
        
        if (item.tradeValue === undefined) {
          updates.tradeValue = calculatedTradeValue;
        }
        
        // Only update if we have changes to make
        if (Object.keys(updates).length > 0) {
          console.log(`Updating ${item.card.name} with calculated values:`, {
            calculatedCash: calculatedCashValue,
            calculatedTrade: calculatedTradeValue,
            updates
          });
          onUpdate(updates);
        }
      }
    }
  }, [
    calculatedCashValue, 
    calculatedTradeValue, 
    isLoading, 
    item.price, 
    item.quantity, 
    item.cashValue, 
    item.tradeValue, 
    item.paymentType, 
    onUpdate,
    cashValue,
    tradeValue,
    item.card.name
  ]);

  const refreshPrice = useCallback(async () => {
    const { card, condition, isFirstEdition, isHolo, isReverseHolo } = item;
    
    if (!card.productId || !condition) {
      console.log(`Can't refresh price for ${card.name}: missing productId or condition`, {
        productId: card.productId,
        condition
      });
      return; // Can't refresh without product ID and condition
    }
    
    onUpdate({ isLoadingPrice: true, error: undefined, isPriceUnavailable: false });
    
    try {
      console.log(`refreshPrice: Fetching price for ${card.name}, game=${card.game}, condition=${condition}`);
      const data = await fetchCardPrices(
        card.productId,
        condition,
        isFirstEdition,
        isHolo,
        card.game,
        isReverseHolo
      );
      
      console.log(`Price fetch result for ${card.name}:`, data);
      
      if (data.unavailable) {
        onUpdate({ 
          price: 0, 
          isLoadingPrice: false,
          isPriceUnavailable: true,
          cashValue: undefined, // Reset any manual values when price changes
          tradeValue: undefined
        });
        toast.error("No price available for this card configuration");
      } else {
        const newPrice = parseFloat(data.price);
        console.log(`Setting new price for ${card.name}: $${newPrice}`);
        
        onUpdate({ 
          price: newPrice, 
          isLoadingPrice: false,
          isPriceUnavailable: false,
          cashValue: undefined, // Reset any manual values when price changes
          tradeValue: undefined
        });
      }
    } catch (e) {
      console.error(`Error fetching price for ${card.name}:`, e);
      onUpdate({ 
        isLoadingPrice: false, 
        error: (e as Error).message,
        isPriceUnavailable: false
      });
    }
  }, [item, onUpdate]);

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value) || 0;
    console.log(`Manual price change for ${item.card.name}: $${newPrice}`);
    
    onUpdate({ 
      price: newPrice,
      // Reset manual values when market price changes
      cashValue: undefined,
      tradeValue: undefined 
    });
  }, [onUpdate, item.card.name]);

  return {
    displayValue,
    isCalculating: isLoading,
    refreshPrice,
    handlePriceChange,
    cashValue,
    tradeValue,
    error: calculationError
  };
};
