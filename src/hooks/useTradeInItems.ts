
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
          id,
          trade_in_id,
          card_id,
          quantity,
          price,
          condition,
          attributes,
          cards:card_id(name, tcgplayer_url, image_url)
        `)
        .eq('trade_in_id', tradeInId);

      if (error) {
        console.error('Error fetching trade-in items:', error);
        throw error;
      }

      console.log('Fetched trade-in items:', data);

      // Fix the type issue with cards.name and handle attributes correctly
      const items = data.map(item => {
        const cardData = item.cards ? (typeof item.cards === 'object' && item.cards !== null ? (item.cards as any) : null) : null;
        const cardName = cardData?.name || 'Unknown Card';
        const tcgplayer_url = cardData?.tcgplayer_url || null;
        const image_url = cardData?.image_url || null;
        
        // Log the raw attributes to help debug the issue
        console.log(`Item ${item.id} attributes:`, item.attributes);
        
        // Parse attributes safely, ensuring we have a valid object
        let attributes: Record<string, any> = {};
        try {
          // Handle case when attributes might be null or not an object
          if (item.attributes && typeof item.attributes === 'object') {
            attributes = item.attributes;
          } else if (typeof item.attributes === 'string') {
            // If attributes is stored as JSON string (shouldn't happen, but safety check)
            try {
              attributes = JSON.parse(item.attributes);
            } catch (e) {
              console.warn(`Failed to parse attributes string for item ${item.id}:`, e);
              attributes = {};
            }
          } else {
            console.warn(`Item ${item.id} has invalid attributes type:`, typeof item.attributes);
            attributes = {};
          }
          
          // Ensure core attribute properties exist
          if (!('isFirstEdition' in attributes)) attributes.isFirstEdition = false;
          if (!('isHolo' in attributes)) attributes.isHolo = false;
          if (!('paymentType' in attributes)) attributes.paymentType = 'cash';
          
          // Make sure cashValue and tradeValue are properly extracted and converted to numbers
          let cashValue: number | undefined = undefined;
          let tradeValue: number | undefined = undefined;
          
          if ('cashValue' in attributes && attributes.cashValue !== undefined && attributes.cashValue !== null) {
            cashValue = typeof attributes.cashValue === 'number' 
              ? attributes.cashValue 
              : parseFloat(attributes.cashValue as string);
          }
          
          if ('tradeValue' in attributes && attributes.tradeValue !== undefined && attributes.tradeValue !== null) {
            tradeValue = typeof attributes.tradeValue === 'number' 
              ? attributes.tradeValue 
              : parseFloat(attributes.tradeValue as string);
          }
          
          // If no specific values were saved, default to using the price
          if (cashValue === undefined) cashValue = item.price;
          if (tradeValue === undefined) tradeValue = item.price * 1.3; // 30% more for trade
          
          // Update the attributes object with the processed values
          attributes = { 
            ...attributes, 
            cashValue, 
            tradeValue,
            paymentType: attributes.paymentType || 'cash'
          };
        } catch (err) {
          console.error(`Error processing attributes for item ${item.id}:`, err);
          attributes = {
            isFirstEdition: false,
            isHolo: false,
            paymentType: 'cash',
            cashValue: item.price,
            tradeValue: item.price * 1.3
          };
        }
        
        return {
          id: item.id,
          card_id: item.card_id,
          card_name: cardName,
          quantity: item.quantity,
          price: item.price,
          condition: item.condition,
          attributes,
          tcgplayer_url,
          image_url
        };
      });

      console.log('Processed items:', items);

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
