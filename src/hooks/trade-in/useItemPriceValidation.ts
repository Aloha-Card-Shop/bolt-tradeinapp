
import { useMemo } from 'react';
import { TradeInItem } from '../useTradeInList';

export function useItemPriceValidation(item: TradeInItem, instanceId: string) {
  return useMemo(() => {
    // Validate game type and price before calculating
    const validGame = item.card.game ? true : false;
    const validPrice = item.price > 0;
    
    const validationWarnings = [];
    
    if (!validGame || !validPrice) {
      console.warn(`useItemPrice [${instanceId}]: Invalid input data for ${item.card.name}`, {
        validGame,
        validPrice,
        game: item.card.game,
        price: item.price
      });
      
      if (!validGame) {
        validationWarnings.push('Missing game type');
      }
      
      if (!validPrice) {
        validationWarnings.push('Invalid price (must be > 0)');
      }
    }
    
    return { validGame, validPrice, validationWarnings };
  }, [item.card.game, item.price, item.card.name, instanceId]);
}
