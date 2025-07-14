
import { useCallback } from 'react';
import { TradeInItem } from '../useTradeInList';
import { fetchCardPrices } from '../../utils/scraper';

interface PriceManagementProps {
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
}: PriceManagementProps) => {
  const refreshPrice = useCallback(async () => {
    if (!item.card.productId || !item.condition) {
      console.warn(`usePriceManagement [${instanceId}]: Cannot refresh price, missing productId or condition`);
      return;
    }

    console.log(`usePriceManagement [${instanceId}]: Refreshing price for ${item.card.name}`);
    
    onUpdate({
      isLoadingPrice: true,
      error: undefined
    });

    try {
      const data = await fetchCardPrices(
        item.card.productId,
        item.condition,
        item.isFirstEdition,
        item.isHolo,
        item.card.game,
        item.isReverseHolo
      );

      console.log(`usePriceManagement [${instanceId}]: Got new price for ${item.card.name}:`, data);
      
      // Check if we used a different condition as fallback
      const usedFallback = data.actualCondition && data.actualCondition !== item.condition;
      if (usedFallback && import.meta.env.DEV) {
        console.log(`Used fallback condition ${data.actualCondition} instead of ${item.condition} for ${item.card.name}`);
      }
      
      // Reset calculated values and make sure we recalculate
      onUpdate({
        price: parseFloat(data.price),
        isLoadingPrice: false,
        error: undefined,
        cashValue: undefined, // Reset to force recalculation
        tradeValue: undefined, // Reset to force recalculation
        initialCalculation: true, // Set flag to force calculation
        marketPriceManuallySet: false, // Clear manual flag on refresh
        usedFallback: usedFallback || false,
        fallbackReason: usedFallback ? `Price found using ${data.actualCondition} condition` : undefined
      });
      
      // Reset market price flag so we get default payment type
      setMarketPriceSet(false);
      
      // Ensure our local state knows we need to recalculate
      setInitialCalculation(true);
      
    } catch (e) {
      console.error(`usePriceManagement [${instanceId}]: Error refreshing price:`, e);
      
      onUpdate({
        isLoadingPrice: false,
        error: (e as Error).message,
        initialCalculation: false
      });
    }
  }, [item, onUpdate, instanceId, setMarketPriceSet, setInitialCalculation]);

  const handlePriceChange = useCallback((newPrice: number) => {
    console.log(`usePriceManagement [${instanceId}]: Manual price change for ${item.card.name}:`, newPrice);
    
    if (newPrice <= 0) {
      console.warn(`usePriceManagement [${instanceId}]: Invalid price: ${newPrice}`);
      return;
    }
    
    // Update price and reset calculated values - SET market price manually flag
    onUpdate({
      price: newPrice,
      cashValue: undefined, // Reset to force recalculation 
      tradeValue: undefined, // Reset to force recalculation
      error: undefined,
      initialCalculation: true, // Set flag to force calculation
      cashValueManuallySet: false, // Clear manual override flag
      tradeValueManuallySet: false, // Clear manual override flag
      marketPriceManuallySet: true // Mark market price as manually set
    });
    
    // Set market price flag to true since it was manually edited
    setMarketPriceSet(true);
    
    // Ensure our local state knows we need to recalculate
    setInitialCalculation(true);
    
  }, [item, onUpdate, instanceId, setMarketPriceSet, setInitialCalculation]);

  return {
    refreshPrice,
    handlePriceChange
  };
};
