
import { useCallback } from 'react';
import { TradeInItem } from '../../hooks/useTradeInList';
import { fetchCardPrices } from '../../utils/scraper';
import { toast } from 'react-hot-toast';

interface UsePriceManagementProps {
  item: TradeInItem;
  onUpdate: (updates: Partial<TradeInItem>) => void;
  instanceId: string;
  setMarketPriceSet: (value: boolean) => void;
  setInitialCalculation: (value: boolean) => void;
}

export const usePriceManagement = ({
  item,
  onUpdate,
  instanceId,
  setMarketPriceSet,
  setInitialCalculation
}: UsePriceManagementProps) => {

  const refreshPrice = useCallback(async () => {
    const { card, condition, isFirstEdition, isHolo, isReverseHolo } = item;
    
    if (!card.productId || !condition) {
      console.log(`usePriceManagement [${instanceId}]: Can't refresh price for ${card.name}: missing productId or condition`, {
        productId: card.productId,
        condition
      });
      return; // Can't refresh without product ID and condition
    }
    
    onUpdate({ isLoadingPrice: true, error: undefined, isPriceUnavailable: false });
    
    try {
      console.log(`usePriceManagement [${instanceId}]: refreshPrice: Fetching price for ${card.name}, game=${card.game}, condition=${condition}`);
      const data = await fetchCardPrices(
        card.productId,
        condition,
        isFirstEdition,
        isHolo,
        card.game,
        isReverseHolo
      );
      
      console.log(`usePriceManagement [${instanceId}]: Price fetch result for ${card.name}:`, data);
      
      if (data.unavailable) {
        onUpdate({ 
          price: 0, 
          isLoadingPrice: false,
          isPriceUnavailable: true,
        });
        toast.error("No price available for this card configuration");
      } else {
        const newPrice = parseFloat(data.price);
        console.log(`usePriceManagement [${instanceId}]: Setting new price for ${card.name}: $${newPrice}`);
        
        // Force value recalculation by clearing any manual values
        const updates: Partial<TradeInItem> = {
          price: newPrice, 
          isLoadingPrice: false,
          isPriceUnavailable: false,
          cashValue: undefined, // Reset any manual values when price changes
          tradeValue: undefined
        };
        
        // Set default payment type to cash when market price is found and user hasn't selected one
        if (!item.paymentType) {
          updates.paymentType = 'cash';
          setMarketPriceSet(true);
          console.log(`usePriceManagement [${instanceId}]: Auto-setting payment type to cash for ${card.name} after price fetch`);
        }
        
        onUpdate(updates);
        
        // Force a reset of the initial calculation flag to ensure we recalculate values
        setInitialCalculation(true);
      }
    } catch (e) {
      console.error(`usePriceManagement [${instanceId}]: Error fetching price for ${card.name}:`, e);
      onUpdate({ 
        isLoadingPrice: false, 
        error: (e as Error).message,
        isPriceUnavailable: false
      });
    }
  }, [item, onUpdate, instanceId, setMarketPriceSet, setInitialCalculation]);

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value) || 0;
    console.log(`usePriceManagement [${instanceId}]: Manual price change for ${item.card.name}: $${newPrice}`);
    
    // Force value recalculation by clearing manual values
    const updates: Partial<TradeInItem> = {
      price: newPrice,
      // Reset manual values when market price changes
      cashValue: undefined,
      tradeValue: undefined,
      // Also reset any error state when manually changing the price
      error: undefined
    };
    
    // Set default payment type to cash when market price is set manually and user hasn't selected one
    if (!item.paymentType) {
      updates.paymentType = 'cash';
      setMarketPriceSet(true);
      console.log(`usePriceManagement [${instanceId}]: Auto-setting payment type to cash for ${item.card.name} after manual price change`);
    }
    
    onUpdate(updates);
    
    // Force a reset of the initial calculation flag to ensure we recalculate values
    setInitialCalculation(true);
  }, [onUpdate, item.card.name, item.paymentType, instanceId, setMarketPriceSet, setInitialCalculation]);

  return {
    refreshPrice,
    handlePriceChange
  };
};
