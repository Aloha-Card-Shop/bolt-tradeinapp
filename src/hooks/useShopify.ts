
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useSession } from './useSession';
import { getSupabaseUrl } from '../lib/supabaseHelpers';

interface ShopifyHookResult {
  addProduct: (tradeInItemId: string) => Promise<boolean>;
  updateProduct: (tradeInItemId: string, updates: any) => Promise<boolean>;
  syncTradeIn: (tradeInId: string) => Promise<boolean>;
  logAction: (data: { tradeInId: string; itemId?: string; status: string; message: string }) => Promise<boolean>;
  sendToShopify: (tradeInId: string) => Promise<boolean>; 
  testConnection: () => Promise<{success: boolean; message?: string; shop?: string; error?: string}>;
  fetchDebugLogs: (tradeInId: string) => Promise<any[]>;
  logDebug: (data: { 
    tradeInId: string; 
    itemId?: string; 
    level?: string; 
    component?: string;
    message: string; 
    details?: any 
  }) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

interface ShopifySyncResult {
  success: boolean;
  results?: Array<{ item_id: string; status: string; error?: string }>;
  error?: string;
}

export const useShopify = (): ShopifyHookResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSession();
  
  // Generic function for logging debugging information
  const logDebug = async (data: { 
    tradeInId: string; 
    itemId?: string; 
    level?: string; 
    component?: string;
    message: string; 
    details?: any 
  }): Promise<boolean> => {
    if (!data.tradeInId || !data.message) {
      console.error('Missing required fields for debug log');
      return false;
    }

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error(sessionError.message);
      
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('No access token available');

      const supabaseUrl = getSupabaseUrl();
      
      // Call edge function to log debug info
      const response = await fetch(`${supabaseUrl}/functions/v1/shopify_debug_log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          trade_in_id: data.tradeInId,
          item_id: data.itemId,
          level: data.level || 'info',
          component: data.component || 'shopify-client',
          message: data.message,
          details: data.details || {}
        })
      });
      
      if (!response.ok) {
        console.error('Failed to log debug info:', await response.text());
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error logging debug info:', err);
      return false;
    }
  };
  
  // Function to fetch debug logs for a trade-in
  const fetchDebugLogs = async (tradeInId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('shopify_debug_logs')
        .select('*')
        .eq('trade_in_id', tradeInId)
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error) throw error;
      
      return data || [];
    } catch (err) {
      console.error('Error fetching debug logs:', err);
      return [];
    }
  };
  
  const addProduct = async (tradeInItemId: string): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to perform this action');
      toast.error('Authentication required');
      return false;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error(sessionError.message);
      
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('No access token available');
      
      // Log the attempt
      await logDebug({
        tradeInId: 'unknown', // We don't have trade-in ID at this point
        itemId: tradeInItemId,
        message: `Attempting to add product for item: ${tradeInItemId}`,
        details: { operation: 'addProduct' }
      });

      // Call edge function to add product
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify_add_product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ tradeInItemId })
      });
      
      // Log the response status
      await logDebug({
        tradeInId: 'unknown', 
        itemId: tradeInItemId,
        level: response.ok ? 'info' : 'error',
        message: `Add product API response: ${response.status} ${response.statusText}`,
        details: { status: response.status, statusText: response.statusText }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add product to Shopify');
      }
      
      toast.success('Product added to Shopify successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add product to Shopify';
      console.error('Shopify add product error:', err);
      
      // Log the error
      await logDebug({
        tradeInId: 'unknown', 
        itemId: tradeInItemId,
        level: 'error',
        message: `Error adding product: ${errorMessage}`,
        details: { error: err }
      });
      
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateProduct = async (tradeInItemId: string, updates: any): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to perform this action');
      toast.error('Authentication required');
      return false;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error(sessionError.message);
      
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('No access token available');

      // Call edge function to update product
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify_update_product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ tradeInItemId, updates })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update product in Shopify');
      }
      
      toast.success('Product updated in Shopify successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product in Shopify';
      console.error('Shopify update product error:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const syncTradeIn = async (tradeInId: string): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to perform this action');
      toast.error('Authentication required');
      return false;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // First check if the trade-in exists in the database
      const { data: tradeInCheck, error: tradeInError } = await supabase
        .from("trade_ins")
        .select("id, shopify_synced")
        .eq("id", tradeInId)
        .maybeSingle();
        
      if (tradeInError) {
        await logDebug({
          tradeInId,
          level: 'error',
          message: `Error checking trade-in: ${tradeInError.message}`,
          details: { error: tradeInError }
        });
        throw new Error(`Error checking trade-in: ${tradeInError.message}`);
      }
      
      if (!tradeInCheck) {
        await logDebug({
          tradeInId,
          level: 'error',
          message: `Trade-in with ID ${tradeInId} not found in database`,
          details: { operation: 'checkTradeIn' }
        });
        throw new Error(`Trade-in with ID ${tradeInId} not found in database`);
      }
      
      if (tradeInCheck.shopify_synced) {
        await logDebug({
          tradeInId,
          level: 'warn',
          message: "This trade-in has already been synced to Shopify",
          details: { already_synced: true }
        });
        throw new Error("This trade-in has already been synced to Shopify");
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error(sessionError.message);
      
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('No access token available');

      await logDebug({
        tradeInId,
        message: `Starting trade-in sync for ID: ${tradeInId}`,
        details: { userId: user.id }
      });
      
      // For backwards compatibility, still using the existing shopify-sync function
      // This will be refactored later to use the new modular functions
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ tradeInId, userId: user.id })
      });
      
      await logDebug({
        tradeInId,
        level: response.ok ? 'info' : 'error',
        message: `Sync API response: ${response.status} ${response.statusText}`,
        details: { status: response.status, statusText: response.statusText, ok: response.ok }
      });
      
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
          await logDebug({
            tradeInId,
            level: 'error',
            message: `Error response from shopify-sync: ${errorText.substring(0, 200)}`,
            details: { errorText: errorText }
          });
          
          let errorData: ShopifySyncResult | null = null;
          
          try {
            errorData = JSON.parse(errorText);
            await logDebug({
              tradeInId,
              level: 'error',
              message: `Parsed error data: ${JSON.stringify(errorData)}`,
              details: { errorData }
            });
          } catch (parseError) {
            // If it's not valid JSON, use the text directly
            await logDebug({
              tradeInId,
              level: 'error',
              message: `Failed to parse error response as JSON`,
              details: { parseError, errorText }
            });
            errorData = null;
          }
          
          if (response.status === 404) {
            const message = errorData?.error || `Trade-in not found (ID: ${tradeInId})`;
            throw new Error(message);
          }
          
          throw new Error(errorData?.error || `API error: ${response.status} - ${errorText.substring(0, 100)}`);
        } catch (textError) {
          // If we can't even get the text, throw a generic error
          await logDebug({
            tradeInId,
            level: 'error',
            message: `Failed to get error response details`,
            details: { textError }
          });
          throw new Error(`Error ${response.status}: Failed to get response details`);
        }
      }
      
      const result: ShopifySyncResult = await response.json();
      
      await logDebug({
        tradeInId,
        message: `Sync result received: success=${result.success}`,
        details: { result }
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to sync trade-in with Shopify');
      }
      
      // Check if there were any item-level errors
      const errors = result.results?.filter(r => r.status === 'error') || [];
      if (errors.length > 0) {
        await logDebug({
          tradeInId,
          level: errors.length === result.results?.length ? 'error' : 'warn',
          message: `${errors.length} item(s) failed to sync`,
          details: { errors }
        });
        
        if (errors.length === result.results?.length) {
          // All items failed
          throw new Error(`Failed to sync all items: ${errors[0].error}`);
        } else {
          // Some items failed, but not all
          toast.success(`Synced ${result.results!.length - errors.length} items successfully`);
          toast.error(`Failed to sync ${errors.length} items`);
        }
      } else {
        await logDebug({
          tradeInId,
          message: `Trade-in synced with Shopify successfully`,
          details: { itemCount: result.results?.length || 0 }
        });
        toast.success('Trade-in synced with Shopify successfully');
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync with Shopify';
      console.error('Shopify sync error:', err);
      
      await logDebug({
        tradeInId,
        level: 'error',
        message: `Sync operation failed: ${errorMessage}`,
        details: { error: err }
      });
      
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logAction = async (data: { tradeInId: string; itemId?: string; status: string; message: string }): Promise<boolean> => {
    if (!user) {
      console.error('You must be logged in to log actions');
      return false;
    }

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error(sessionError.message);
      
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('No access token available');

      // Call edge function to log action
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify_sync_log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Failed to log Shopify action:', result.error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error logging Shopify action:', err);
      return false;
    }
  };

  const testConnection = async () => {
    if (!user) {
      setError('You must be logged in to perform this action');
      toast.error('Authentication required');
      return { success: false, error: 'Authentication required' };
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error(sessionError.message);
      
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('No access token available');

      // Call edge function to test Shopify connection
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify_test_connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ test: true })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to test connection to Shopify');
      }
      
      if (result.success) {
        return {
          success: true,
          message: 'Successfully connected to Shopify',
          shop: result.shop
        };
      } else {
        throw new Error(result.error || 'Unknown error testing Shopify connection');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test Shopify connection';
      console.error('Shopify connection test error:', err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Add alias for backward compatibility
  const sendToShopify = (tradeInId: string): Promise<boolean> => {
    return syncTradeIn(tradeInId);
  };

  return {
    addProduct,
    updateProduct,
    syncTradeIn,
    logAction,
    sendToShopify,
    testConnection,
    fetchDebugLogs,
    logDebug,
    isLoading,
    error
  };
};
