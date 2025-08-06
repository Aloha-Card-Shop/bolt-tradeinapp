
import { useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { TradeIn } from '../types/tradeIn';

interface SyncResult {
  success: boolean;
  error?: string;
  shopifyId?: string;
}

// Create a more resilient logging function that won't cause UI glitches
const logDebug = async (
  tradeInId: string, 
  level: 'info' | 'error' | 'warning' | 'debug', 
  message: string, 
  details: any = {}
) => {
  // Always log to console first in case the fetch fails
  console[level === 'error' ? 'error' : 'info'](`[${level.toUpperCase()}] ${message}`, details);
  
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify_debug_log`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          trade_in_id: tradeInId,
          level,
          component: 'shopify-sync',
          message,
          details
        })
      }
    );

    if (!response.ok) {
      // Log failure but don't throw - we want to continue even if logging fails
      console.error('Error logging debug info:', 
        `Status: ${response.status}, Status Text: ${response.statusText}`);
      return;
    }
    
    const result = await response.json();
    if (!result.success) {
      console.error('Error from debug log endpoint:', result.error);
    }
  } catch (error) {
    // Log error but don't propagate - prevent UI from breaking due to log failures
    console.error('Error logging debug info:', error);
  }
};

export const useShopify = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const syncTradeInToShopify = async (tradeIn: TradeIn): Promise<SyncResult> => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    
    try {
      await logDebug(tradeIn.id, 'info', `Starting Shopify sync for trade-in ${tradeIn.id}`);

      // Call the shopify-sync edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-sync`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ 
            tradeInId: tradeIn.id 
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details available');
        await logDebug(tradeIn.id, 'error', `Shopify sync failed with status ${response.status}`, {
          statusText: response.statusText,
          errorText
        });
        
        return { 
          success: false, 
          error: `Error ${response.status}: ${response.statusText}` 
        };
      }

      const result = await response.json();
      
      if (result.success) {
        await logDebug(tradeIn.id, 'info', 'Shopify sync completed successfully', result);
        
        // Update the local database to mark this trade-in as synced
        const { error: updateError } = await supabase
          .from('trade_ins')
          .update({ 
            shopify_synced: true,
            shopify_synced_at: new Date().toISOString(),
            shopify_product_id: result.shopifyProductId
          })
          .eq('id', tradeIn.id);
          
        if (updateError) {
          await logDebug(tradeIn.id, 'error', 'Failed to update trade-in sync status in database', {
            error: updateError.message
          });
          return { success: true, shopifyId: result.shopifyProductId };
        }
        
        return { success: true, shopifyId: result.shopifyProductId };
      } else {
        await logDebug(tradeIn.id, 'error', `Shopify sync failed: ${result.error || 'Unknown error'}`, result);
        return { success: false, error: result.error || 'Unknown error occurred' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await logDebug(
        tradeIn.id, 
        'error', 
        `Exception during Shopify sync: ${errorMessage}`, 
        { error }
      ).catch(() => {
        // If even the logging fails, just console.error and continue
        console.error('Failed to log sync error:', error);
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const getShopifyLogs = async (tradeInId: string) => {
    try {
      // Note: shopify_debug_logs table not in current types, using any for now
      const { data, error } = await (supabase as any)
        .from('shopify_debug_logs')
        .select('*')
        .eq('trade_in_id', tradeInId)
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error) {
        console.error('Error fetching Shopify logs:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Exception fetching Shopify logs:', error);
      return [];
    }
  };

  return {
    syncTradeInToShopify,
    getShopifyLogs,
    isLoading,
    isError,
    errorMessage
  };
};
