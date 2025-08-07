import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { fetchCardPrices } from '../../utils/scraper';
import { usePsaPriceLookup } from '../usePsaPriceLookup';
import { TradeInItem } from '../useTradeInList';

export const useTradeInPricing = (updateItemAttribute: (index: number, key: keyof TradeInItem, value: any) => void) => {
  const { lookupPsaPrice } = usePsaPriceLookup();

  const fetchItemPrice = useCallback(async (index: number, item: TradeInItem) => {
    if (!item || !item.card.productId || (!item.condition && !item.card.isCertified)) {
      return;
    }
    
    // Check if this is a certified card
    if (item.card.isCertified) {
      updateItemAttribute(index, 'isLoadingPrice', true);
      updateItemAttribute(index, 'error', undefined);
      updateItemAttribute(index, 'isPriceUnavailable', false);
      
      try {
        console.log("Fetching certified card price from eBay");
        const priceData = await lookupPsaPrice(item.card);
        
        if (priceData && priceData.averagePrice) {
          updateItemAttribute(index, 'price', priceData.averagePrice);
          updateItemAttribute(index, 'isPriceUnavailable', false);
          
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
        item.isReverseHolo,
        undefined,
        item.card.set,
        item.card.name,
        (item.card as any).number
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
  }, [updateItemAttribute, lookupPsaPrice]);

  return { fetchItemPrice };
};