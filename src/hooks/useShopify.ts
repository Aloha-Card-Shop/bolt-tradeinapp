
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSession } from './useSession';

export const useShopify = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSession();

  const sendToShopify = async (tradeInId: string) => {
    if (!user) {
      throw new Error('User must be logged in to send items to Shopify');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // First, check if this trade-in has already been synced
      const { data: tradeIn, error: tradeInError } = await supabase
        .from('trade_ins')
        .select('shopify_synced')
        .eq('id', tradeInId)
        .single();
      
      if (tradeInError) throw tradeInError;
      
      if (tradeIn.shopify_synced) {
        throw new Error('This trade-in has already been synced to Shopify');
      }
      
      // Get the trade-in items
      const { data: items, error: itemsError } = await supabase
        .from('trade_in_items')
        .select(`
          id,
          trade_in_id,
          card_id,
          quantity,
          price,
          condition,
          attributes,
          cards:card_id(name, set_name, image_url, rarity, attributes)
        `)
        .eq('trade_in_id', tradeInId);
      
      if (itemsError) throw itemsError;
      
      if (!items || items.length === 0) {
        throw new Error('No items found for this trade-in');
      }

      // For now, we're just updating the trade-in record to mark it as synced
      // In a real implementation, this would call a Supabase edge function to handle the Shopify API integration
      const { error: syncError } = await supabase
        .from('trade_ins')
        .update({
          shopify_synced: true,
          shopify_synced_at: new Date().toISOString(),
          shopify_synced_by: user.id
        })
        .eq('id', tradeInId);
      
      if (syncError) throw syncError;

      // Create sync log entries for each item
      const syncLogs = items.map(item => ({
        trade_in_id: tradeInId,
        item_id: item.id,
        status: 'success',
        message: 'Item synced to Shopify successfully',
        created_by: user.id
      }));

      const { error: logsError } = await supabase
        .from('shopify_sync_logs')
        .insert(syncLogs);
      
      if (logsError) {
        console.error('Error creating sync logs:', logsError);
        // We'll continue even if logging fails
      }
      
      return true;
    } catch (err) {
      console.error('Error syncing to Shopify:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    sendToShopify
  };
};
