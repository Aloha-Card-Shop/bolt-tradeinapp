
import { supabase } from '../lib/supabase';
import { getOrCreateCard } from './cardService';

interface TradeInData {
  customer_id: string;
  trade_in_date: string;
  total_value: number;
  cash_value?: number;
  trade_value?: number;
  notes?: string | null;
  status?: 'pending' | 'accepted' | 'rejected';
  payment_type?: 'cash' | 'trade' | 'mixed';
}

interface TradeInResult {
  id: string;
  customer_id: string;
  trade_in_date: string;
  total_value: number;
  cash_value: number;
  trade_value: number;
  notes: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  payment_type: 'cash' | 'trade' | 'mixed';
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
    // Calculate cash and trade values from items
    // These should already be the calculated values based on the percentages
    let cashValue = 0;
    let tradeValue = 0;
    let hasCashItems = false;
    let hasTradeItems = false;

    items.forEach(item => {
      if (item.paymentType === 'cash') {
        // Use the pre-calculated cash value from the hook
        cashValue += item.cashValue ? item.cashValue * item.quantity : item.price * item.quantity;
        hasCashItems = true;
      } else if (item.paymentType === 'trade') {
        // Use the pre-calculated trade value from the hook
        tradeValue += item.tradeValue ? item.tradeValue * item.quantity : item.price * item.quantity;
        hasTradeItems = true;
      }
    });

    // Determine the overall payment type
    let paymentType: 'cash' | 'trade' | 'mixed' = 'cash';
    if (hasCashItems && hasTradeItems) {
      paymentType = 'mixed';
    } else if (hasTradeItems) {
      paymentType = 'trade';
    }

    console.log('Determined payment type:', paymentType);
    console.log('Cash value:', cashValue, 'Trade value:', tradeValue);

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

    // Insert trade-in record with cash and trade values
    const { data: tradeIn, error: tradeInError } = await supabase
      .from('trade_ins')
      .insert({
        ...tradeInData,
        cash_value: cashValue,
        trade_value: tradeValue,
        payment_type: paymentType,
        status: tradeInData.status || 'pending'
      })
      .select()
      .single();

    if (tradeInError) {
      console.error('Error creating trade-in record:', tradeInError);
      throw new Error(`Failed to create trade-in record: ${tradeInError.message}`);
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
        paymentType: item.paymentType,
        cashValue: item.cashValue,
        tradeValue: item.tradeValue
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

      throw new Error(`Failed to create trade-in items: ${itemsError.message}`);
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
