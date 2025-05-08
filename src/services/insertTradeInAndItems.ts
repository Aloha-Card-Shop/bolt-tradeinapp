
// Fix unused import
import { supabase } from '../lib/supabase';
import { getOrCreateCard } from './cardService';
// Remove unused imports
// import { TradeInItem } from '../hooks/useTradeInList';

interface TradeInData {
  customer_id: string;
  trade_in_date: string;
  total_value: number;
  notes?: string | null;
  status?: 'pending' | 'accepted' | 'rejected';
  payment_type?: 'cash' | 'trade';
}

interface TradeInResult {
  id: string;
  customer_id: string;
  trade_in_date: string;
  total_value: number;
  notes: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export async function insertTradeInAndItems(
  tradeInData: TradeInData,
  items: any[]
): Promise<TradeInResult> {
  console.log('Starting trade-in insertion with items:', items);

  // Validate input data
  if (!tradeInData.customer_id) {
    throw new Error('Customer ID is required');
  }

  if (!items || items.length === 0) {
    throw new Error('No items to process in trade-in');
  }

  try {
    // First, ensure all cards exist in the database
    const cardPromises = items.map(async (item, index) => {
      try {
        const cardId = await getOrCreateCard(item.card);
        return {
          ...item,
          card_id: cardId
        };
      } catch (error) {
        console.error(`Error processing card at index ${index}:`, error);
        throw error;
      }
    });

    const itemsWithCardIds = await Promise.all(cardPromises);

    // Insert trade-in record
    const { data: tradeIn, error: tradeInError } = await supabase
      .from('trade_ins')
      .insert({
        ...tradeInData,
        status: tradeInData.status || 'pending'
      })
      .select()
      .single();

    if (tradeInError) {
      console.error('Error creating trade-in record:', tradeInError);
      throw new Error('Failed to create trade-in record');
    }

    if (!tradeIn) {
      throw new Error('Trade-in record was not created');
    }

    console.log('Created trade-in record:', tradeIn.id);

    // Prepare items with trade-in ID
    const itemsToInsert = itemsWithCardIds.map(item => ({
      trade_in_id: tradeIn.id,
      card_id: item.card_id,
      quantity: Math.max(1, item.quantity),
      price: Math.max(0.01, item.price),
      condition: item.condition,
      attributes: {
        isFirstEdition: item.isFirstEdition,
        isHolo: item.isHolo,
        paymentType: item.paymentType
      }
    }));

    console.log('Inserting trade-in items:', itemsToInsert);

    // Insert all items
    const { error: itemsError } = await supabase
      .from('trade_in_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Error creating trade-in items:', itemsError);
      
      // If items insertion fails, delete the trade-in record
      const { error: deleteError } = await supabase
        .from('trade_ins')
        .delete()
        .eq('id', tradeIn.id);

      if (deleteError) {
        console.error('Error cleaning up trade-in after items insertion failure:', deleteError);
      }

      throw new Error('Failed to create trade-in items');
    }

    console.log('Successfully created trade-in with items');
    return tradeIn;
  } catch (error) {
    console.error('Error in insertTradeInAndItems:', error);
    throw error instanceof Error 
      ? error 
      : new Error('An unexpected error occurred while creating the trade-in');
  }
}
