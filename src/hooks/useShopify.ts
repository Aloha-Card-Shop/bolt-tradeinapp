
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
      toast.error('You must be logged in to use this feature');
      return;
    }

    if (mappingsLoading) {
      toast.error('Loading mapping configuration...');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Log sync attempt
      await supabase
        .from('shopify_sync_logs')
        .insert({
          trade_in_id: tradeInId,
          status: 'attempt',
          message: 'Starting Shopify sync',
          created_by: user.id
        });

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

      // Check for function invocation errors (like 404, function not found)
      if (functionError) {
        console.error('Edge function error:', functionError);
        
        // Log specific error to database
        try {
          await supabase
            .from('shopify_sync_logs')
            .insert({
              trade_in_id: tradeInId,
              status: 'error',
              message: `Function error: ${functionError.message}`,
              created_by: user.id
            });
        } catch (logError) {
          console.error('Failed to log error:', logError);
        }
        
        // Improve error message based on error type
        if (functionError.message.includes('404')) {
          setError('Shopify sync function not found or not deployed. Please check the deployment status in Supabase dashboard.');
          toast.error('Shopify sync function not available. Contact administrator.');
        } else if (functionError.message.includes('401') || functionError.message.includes('403')) {
          setError('Authentication error when calling Shopify sync function. Check your API keys and permissions.');
          toast.error('Authentication error with Shopify sync.');
        } else {
          setError(`Edge function error: ${functionError.message}`);
          toast.error(`Shopify sync failed: ${functionError.message}`);
        }
        return;
      }

      if (data?.error) {
        console.error('Shopify sync error:', data.error);
        
        // Log specific error to database
        try {
          await supabase
            .from('shopify_sync_logs')
            .insert({
              trade_in_id: tradeInId,
              status: 'error',
              message: `Sync error: ${data.error}`,
              created_by: user.id
            });
        } catch (logError) {
          console.error('Failed to log error:', logError);
        }
        
        setError(data.error);
        toast.error(`Shopify sync failed: ${data.error}`);
        return;
      }

      if (data?.success) {
        // Log success to database
        try {
          await supabase
            .from('shopify_sync_logs')
            .insert({
              trade_in_id: tradeInId,
              status: 'success',
              message: `Sync completed successfully with ${data.results?.length || 0} items`,
              created_by: user.id
            });
          
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
        } catch (logError) {
          console.error('Failed to log success:', logError);
        }

        toast.success('Successfully synced trade-in to Shopify');
        return data;
      }
    } catch (err) {
      console.error('Unexpected error during Shopify sync:', err);
      
      // Log error to database
      try {
        await supabase
          .from('shopify_sync_logs')
          .insert({
            trade_in_id: tradeInId,
            status: 'error',
            message: `Unexpected error: ${(err as Error).message}`,
            created_by: user.id
          });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
      
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
