
import { useState } from 'react';
import { TradeIn, TradeInItem } from '../types/tradeIn';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export const useTradeInItemUpdate = (
  setTradeIns: React.Dispatch<React.SetStateAction<TradeIn[]>>
) => {
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateTradeInItem = async (
    tradeInId: string,
    itemId: string,
    updates: Partial<{
      condition: string;
      quantity: number;
      price: number;
      attributes: TradeInItem['attributes'];
    }>
  ) => {
    if (!itemId) {
      setErrorMessage('Missing item ID for update');
      return false;
    }

    setUpdatingItemId(itemId);
    setErrorMessage(null);

    try {
      // Update the trade_in_items table
      const { error } = await supabase
        .from('trade_in_items')
        .update({
          ...updates,
          // Don't include attributes in the top level if it's not provided
          ...(updates.attributes ? { attributes: updates.attributes } : {})
        })
        .eq('id', itemId)
        .eq('trade_in_id', tradeInId);

      if (error) throw error;

      // Optimistically update the UI
      setTradeIns(prevTradeIns => {
        return prevTradeIns.map(tradeIn => {
          if (tradeIn.id !== tradeInId) return tradeIn;

          // Clone the trade-in to avoid mutating the original
          const updatedTradeIn = { ...tradeIn };
          
          // Update the specific item
          if (updatedTradeIn.items) {
            updatedTradeIn.items = updatedTradeIn.items.map(item => {
              if (item.id !== itemId) return item;
              return { ...item, ...updates };
            });
          }

          // Recalculate trade-in totals
          const { cashTotal, tradeTotal, grandTotal } = calculateTotals(updatedTradeIn.items || []);
          updatedTradeIn.cash_value = cashTotal;
          updatedTradeIn.trade_value = tradeTotal;
          updatedTradeIn.total_value = grandTotal;

          // Update payment_type based on the new totals
          updatedTradeIn.payment_type = getPaymentType(cashTotal, tradeTotal);

          return updatedTradeIn;
        });
      });

      // Now update the trade_ins table with the new totals
      await updateTradeInTotals(tradeInId);
      
      toast.success('Item updated successfully');
      return true;
    } catch (err) {
      console.error('Error updating trade-in item:', err);
      setErrorMessage(`Failed to update item: ${(err as Error).message}`);
      toast.error(`Failed to update item: ${(err as Error).message}`);
      return false;
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Helper function to calculate totals from items
  const calculateTotals = (items: TradeInItem[]) => {
    let cashTotal = 0;
    let tradeTotal = 0;
    
    items.forEach(item => {
      const paymentType = item.attributes.paymentType || 'cash';
      const itemPrice = item.price;
      const quantity = item.quantity || 1;
      
      if (paymentType === 'cash') {
        cashTotal += itemPrice * quantity;
      } else {
        tradeTotal += itemPrice * quantity;
      }
    });
    
    const grandTotal = cashTotal + tradeTotal;
    
    return {
      cashTotal,
      tradeTotal,
      grandTotal
    };
  };

  // Helper function to determine payment type
  const getPaymentType = (cashValue: number, tradeValue: number): 'cash' | 'trade' | 'mixed' => {
    if (cashValue > 0 && tradeValue > 0) return 'mixed';
    if (tradeValue > 0) return 'trade';
    return 'cash';
  };

  // Helper function to update the trade-in totals in the database
  const updateTradeInTotals = async (tradeInId: string) => {
    try {
      // First get the current items to calculate new totals
      const { data, error } = await supabase
        .from('trade_in_items')
        .select('price, quantity, attributes')
        .eq('trade_in_id', tradeInId);
        
      if (error) throw error;
      
      if (!data || data.length === 0) return;
      
      // Calculate new totals
      let cashTotal = 0;
      let tradeTotal = 0;
      
      data.forEach(item => {
        const paymentType = item.attributes?.paymentType || 'cash';
        const itemPrice = item.price || 0;
        const quantity = item.quantity || 1;
        
        if (paymentType === 'cash') {
          cashTotal += itemPrice * quantity;
        } else {
          tradeTotal += itemPrice * quantity;
        }
      });
      
      const grandTotal = cashTotal + tradeTotal;
      const paymentType = getPaymentType(cashTotal, tradeTotal);
      
      // Update the trade_ins table with new totals
      const { error: updateError } = await supabase
        .from('trade_ins')
        .update({
          cash_value: cashTotal,
          trade_value: tradeTotal,
          total_value: grandTotal,
          payment_type: paymentType
        })
        .eq('id', tradeInId);
        
      if (updateError) throw updateError;
      
    } catch (err) {
      console.error('Error updating trade-in totals:', err);
      // Don't show a toast here as we already showed one for the item update
    }
  };

  return {
    updatingItemId,
    errorMessage,
    updateTradeInItem
  };
};
