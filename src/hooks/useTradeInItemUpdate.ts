
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { TradeInItem } from '../types/tradeIn';
import { toast } from 'react-hot-toast';

export const useTradeInItemUpdate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const updateTradeInItem = async (itemId: string, updates: Partial<TradeInItem>) => {
    setIsLoading(true);
    setUpdatingItemId(itemId);
    try {
      // Convert TradeInItem updates to match the database schema
      const dbUpdates: any = {};
      
      // Handle basic properties
      if (updates.quantity !== undefined) {
        dbUpdates.quantity = updates.quantity;
      }
      
      if (updates.price !== undefined) {
        dbUpdates.price = updates.price;
      }
      
      if (updates.condition !== undefined) {
        dbUpdates.condition = updates.condition;
      }
      
      // Handle attributes object
      if (updates.attributes) {
        dbUpdates.attributes = updates.attributes;
      }

      const { error } = await supabase
        .from('trade_in_items')
        .update(dbUpdates)
        .eq('id', itemId);

      if (error) {
        toast.error(`Error updating item: ${error.message}`);
        throw error;
      }
      
      toast.success('Item updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating trade-in item:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setUpdatingItemId(null);
    }
  };

  const updateStaffNotes = async (tradeInId: string, notes: string | null) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('trade_ins')
        .update({ staff_notes: notes })
        .eq('id', tradeInId);

      if (error) {
        toast.error(`Error updating notes: ${error.message}`);
        throw error;
      }
      
      toast.success('Notes updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating trade-in notes:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    updatingItemId,
    updateTradeInItem,
    updateStaffNotes
  };
};
