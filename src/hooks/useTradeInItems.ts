
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { TradeIn } from '../types/tradeIn';

export const useTradeInItems = (setTradeIns: React.Dispatch<React.SetStateAction<TradeIn[]>>) => {
  const [loadingItems, setLoadingItems] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTradeInItems = async (tradeInId: string) => {
    setLoadingItems(tradeInId);
    try {
      const { data, error } = await supabase
        .from('trade_in_items')
        .select(`
          quantity,
          price,
          condition,
          attributes,
          cards:card_id(name)
        `)
        .eq('trade_in_id', tradeInId);

      if (error) throw error;

      // Fix the type issue with cards.name and handle attributes correctly
      const items = data.map(item => {
        const cardName = item.cards ? (typeof item.cards === 'object' && item.cards !== null ? (item.cards as any).name : 'Unknown Card') : 'Unknown Card';
        
        return {
          card_name: cardName,
          quantity: item.quantity,
          price: item.price,
          condition: item.condition,
          attributes: {
            ...item.attributes,
            // Ensure these values are properly typed
            paymentType: item.attributes?.paymentType || 'cash',
            isFirstEdition: !!item.attributes?.isFirstEdition,
            isHolo: !!item.attributes?.isHolo,
            cashValue: item.attributes?.cashValue ? Number(item.attributes.cashValue) : undefined,
            tradeValue: item.attributes?.tradeValue ? Number(item.attributes.tradeValue) : undefined
          }
        };
      });

      // Update the trade-ins state with the fetched items
      setTradeIns(prev => prev.map(tradeIn => 
        tradeIn.id === tradeInId ? { ...tradeIn, items } : tradeIn
      ));
    } catch (err) {
      console.error('Error fetching trade-in items:', err);
      setErrorMessage(`Failed to fetch items for trade-in: ${(err as Error).message}`);
    } finally {
      setLoadingItems(null);
    }
  };

  return {
    loadingItems,
    fetchTradeInItems,
    itemsErrorMessage: errorMessage
  };
};
