
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useSession } from './useSession';

export const useShopify = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSession();

  const sendToShopify = async (tradeInId: string) => {
    if (!user) {
      toast.error('You must be logged in to use this feature');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call the edge function to handle the Shopify synchronization
      const { data, error: functionError } = await supabase.functions.invoke('shopify-sync', {
        body: { tradeInId, userId: user.id }
      });

      if (functionError) {
        console.error('Edge function error:', functionError);
        setError(functionError.message);
        toast.error(`Shopify sync failed: ${functionError.message}`);
        return;
      }

      if (data?.error) {
        console.error('Shopify sync error:', data.error);
        setError(data.error);
        toast.error(`Shopify sync failed: ${data.error}`);
        return;
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
          return;
        }

        toast.success('Successfully synced trade-in to Shopify');
        return data;
      }
    } catch (err) {
      console.error('Unexpected error during Shopify sync:', err);
      setError(`An unexpected error occurred: ${(err as Error).message}`);
      toast.error('An unexpected error occurred during Shopify sync');
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
