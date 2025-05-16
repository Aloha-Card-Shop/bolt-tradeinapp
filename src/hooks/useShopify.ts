
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useSession } from './useSession';
import { useShopifyMappings } from './useShopifyMappings';

export const useShopify = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSession();
  const { isLoading: mappingsLoading } = useShopifyMappings();

  const sendToShopify = async (tradeInId: string) => {
    if (!user) {
      const errorMsg = 'You must be logged in to use this feature';
      toast.error(errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    if (mappingsLoading) {
      const errorMsg = 'Loading mapping configuration...';
      toast.error(errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate the tradeInId
      if (!tradeInId) {
        throw new Error('Invalid trade-in ID');
      }

      // Check if the trade-in exists
      const { data: tradeInCheck, error: checkError } = await supabase
        .from('trade_ins')
        .select('id, shopify_synced')
        .eq('id', tradeInId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking trade-in:', checkError);
        throw new Error(`Error checking trade-in: ${checkError.message}`);
      }

      if (!tradeInCheck) {
        throw new Error(`Trade-in with ID ${tradeInId} not found`);
      }

      if (tradeInCheck.shopify_synced) {
        throw new Error('This trade-in has already been synced to Shopify');
      }

      // Call the edge function to handle the Shopify synchronization
      const { data, error: functionError } = await supabase.functions.invoke('shopify-sync', {
        body: { tradeInId, userId: user.id }
      });

      if (functionError) {
        console.error('Edge function error:', functionError);
        throw new Error(`Shopify sync failed: ${functionError.message}`);
      }

      if (data?.error) {
        console.error('Shopify sync error:', data.error);
        throw new Error(`Shopify sync failed: ${data.error}`);
      }

      if (data?.success) {
        // Update the trade-in to mark it as synced
        const { error: updateError } = await supabase
          .from('trade_ins')
          .update({
            shopify_synced: true,
            shopify_synced_at: new Date().toISOString(),
            shopify_synced_by: user.id
          })
          .eq('id', tradeInId);

        if (updateError) {
          console.error('Error updating trade-in sync status:', updateError);
          setError(`Sync completed but failed to update status: ${updateError.message}`);
          toast.error('Sync completed but failed to update status');
          throw new Error(`Sync completed but failed to update status: ${updateError.message}`);
        }

        toast.success('Successfully synced trade-in to Shopify');
        return data;
      } else {
        throw new Error('Shopify sync did not return a success status');
      }
    } catch (err) {
      console.error('Unexpected error during Shopify sync:', err);
      const errorMessage = (err as Error).message || 'An unexpected error occurred';
      setError(errorMessage);
      throw err; // Re-throw the error to be handled by the component
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendToShopify,
    isLoading,
    error
  };
};
