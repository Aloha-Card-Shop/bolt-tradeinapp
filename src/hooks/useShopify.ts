
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSession } from './useSession';
import { toast } from 'react-hot-toast';

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
      
      // Call the Shopify sync edge function
      const { data, error: functionError } = await supabase.functions.invoke('shopify-sync', {
        body: JSON.stringify({
          tradeInId,
          userId: user.id
        })
      });
      
      if (functionError) throw functionError;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to sync with Shopify');
      }

      // Refresh the data by fetching the updated trade-in
      const { error: refreshError } = await supabase
        .from('trade_ins')
        .select('shopify_synced, shopify_synced_at')
        .eq('id', tradeInId)
        .single();
      
      if (refreshError) {
        console.error('Error refreshing trade-in data:', refreshError);
      }
      
      return data;
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
