
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useSession } from './useSession';

interface ShopifyHookResult {
  addProduct: (tradeInItemId: string) => Promise<boolean>;
  updateProduct: (tradeInItemId: string, updates: any) => Promise<boolean>;
  syncTradeIn: (tradeInId: string) => Promise<boolean>;
  logAction: (data: { tradeInId: string; itemId?: string; status: string; message: string }) => Promise<boolean>;
  sendToShopify: (tradeInId: string) => Promise<boolean>; 
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

      // Call edge function to add product
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify_add_product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ tradeInItemId })
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
        throw new Error(`Error checking trade-in: ${tradeInError.message}`);
      }
      
      if (!tradeInCheck) {
        throw new Error(`Trade-in with ID ${tradeInId} not found in database`);
      }
      
      if (tradeInCheck.shopify_synced) {
        throw new Error("This trade-in has already been synced to Shopify");
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error(sessionError.message);
      
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('No access token available');

      console.log(`Syncing trade-in: ${tradeInId}`);
      
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
      
      console.log(`Sync response status: ${response.status}`);
      
      if (!response.ok) {
        const text = await response.text();
        console.error('Error response from shopify-sync:', text);
        let errorData: ShopifySyncResult;
        
        try {
          errorData = JSON.parse(text);
          if (response.status === 404) {
            throw new Error(errorData.error || `Trade-in not found in the sync service. Please check the trade-in ID.`);
          }
          throw new Error(errorData.error || `API error: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Error ${response.status}: ${text}`);
        }
      }
      
      const result: ShopifySyncResult = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to sync trade-in with Shopify');
      }
      
      // Check if there were any item-level errors
      const errors = result.results?.filter(r => r.status === 'error') || [];
      if (errors.length > 0) {
        if (errors.length === result.results?.length) {
          // All items failed
          throw new Error(`Failed to sync all items: ${errors[0].error}`);
        } else {
          // Some items failed, but not all
          toast.success(`Synced ${result.results!.length - errors.length} items successfully`);
          toast.error(`Failed to sync ${errors.length} items`);
        }
      } else {
        toast.success('Trade-in synced with Shopify successfully');
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync with Shopify';
      console.error('Shopify sync error:', err);
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
    isLoading,
    error
  };
};
