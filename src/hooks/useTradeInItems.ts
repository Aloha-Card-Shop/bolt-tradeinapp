
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
        
        // Ensure attributes is an object with the expected properties
        const attributes = item.attributes || {};
        const isFirstEdition = !!attributes.isFirstEdition;
        const isHolo = !!attributes.isHolo;
        const paymentType = attributes.paymentType || 'cash';
        
        // Make sure cashValue and tradeValue are properly extracted and converted to numbers
        let cashValue: number | undefined = undefined;
        let tradeValue: number | undefined = undefined;
        
        if (attributes.cashValue !== undefined && attributes.cashValue !== null) {
          cashValue = typeof attributes.cashValue === 'number' 
            ? attributes.cashValue 
            : parseFloat(attributes.cashValue);
        }
        
        if (attributes.tradeValue !== undefined && attributes.tradeValue !== null) {
          tradeValue = typeof attributes.tradeValue === 'number' 
            ? attributes.tradeValue 
            : parseFloat(attributes.tradeValue);
        }
        
        // If no specific values were saved, default to using the price
        if (cashValue === undefined) cashValue = item.price;
        if (tradeValue === undefined) tradeValue = item.price;
        
        return {
          card_name: cardName,
          quantity: item.quantity,
          price: item.price,
          condition: item.condition,
          attributes: {
            isFirstEdition,
            isHolo,
            paymentType,
            cashValue,
            tradeValue
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
