
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { TradeInItem } from '../types/tradeIn';
import { toast } from 'react-hot-toast';
import { useSession } from './useSession';

export const useTradeInItemUpdate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const { user } = useSession();

  const updateTradeInItem = async (itemId: string, updates: Partial<TradeInItem>) => {
    if (!user) {
      toast.error('You must be logged in to update items');
      return false;
    }
    
    setIsLoading(true);
    setUpdatingItemId(itemId);
    try {
      console.log('Updating item with ID:', itemId, 'Updates:', updates);
      
      // Convert TradeInItem updates to match the database schema
      const dbUpdates: any = {};
      
      // Handle basic properties
      if (updates.quantity !== undefined) {
        dbUpdates.quantity = updates.quantity;
      }
      
      if (updates.price !== undefined) {
        dbUpdates.price = updates.price;
        console.log(`Setting price to ${updates.price}`);
      }
      
      if (updates.condition !== undefined) {
        dbUpdates.condition = updates.condition;
      }
      
      // Handle attributes object - ensure we're using the JSONB format expected by Postgres
      if (updates.attributes) {
        // Make a clean copy of attributes to avoid any reactivity issues
        dbUpdates.attributes = JSON.parse(JSON.stringify(updates.attributes));
        console.log('Setting attributes:', dbUpdates.attributes);
      }

      console.log('Database updates:', dbUpdates);

      // Perform the update with return data for verification
      const { data, error } = await supabase
        .from('trade_in_items')
        .update(dbUpdates)
        .eq('id', itemId)
        .select();

      if (error) {
        console.error('Error updating item:', error);
        if (error.code === 'PGRST301') {
          toast.error('Permission denied: You do not have the required role to update this item');
        } else {
          toast.error(`Error updating item: ${error.message}`);
        }
        throw error;
      }
      
      console.log('Update successful, returned data:', data);
      toast.success('Item updated successfully');
      
      // Return the updated data to update the UI immediately
      return data && data.length > 0 ? data[0] : true;
    } catch (error) {
      console.error('Error updating trade-in item:', error);
      toast.error(`Update failed: ${(error as Error).message}`);
      throw error;
    } finally {
      setIsLoading(false);
      setUpdatingItemId(null);
    }
  };

  const updateStaffNotes = async (tradeInId: string, notes: string | null) => {
    if (!user) {
      toast.error('You must be logged in to update notes');
      return false;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('trade_ins')
        .update({ staff_notes: notes })
        .eq('id', tradeInId);

      if (error) {
        console.error('Error updating notes:', error);
        if (error.code === 'PGRST301') {
          toast.error('Permission denied: You do not have the required role to update notes');
        } else {
          toast.error(`Error updating notes: ${error.message}`);
        }
        throw error;
      }
      
      toast.success('Notes updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating trade-in notes:', error);
      toast.error(`Update failed: ${(error as Error).message}`);
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
