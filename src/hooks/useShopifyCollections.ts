import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'react-hot-toast';

export interface ShopifyCollection {
  id: string;
  shopify_collection_id: string;
  handle: string;
  title: string;
  description: string | null;
  image_url: string | null;
  product_count: number | null;
  collection_type: string | null;
  published: boolean | null;
  last_synced_at: string | null;
  shopify_collection_sync_settings?: Array<{
    id: string;
    sync_enabled: boolean;
    auto_add_products: boolean | null;
    auto_price_products: boolean | null;
  }>;
}

export interface SalesTracking {
  id: string;
  shopify_order_id: string;
  shopify_order_number: string | null;
  sku: string | null;
  quantity_sold: number;
  price: number;
  total_amount: number;
  processed: boolean | null;
  created_at: string;
}

export const useShopifyCollections = () => {
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [salesTracking, setSalesTracking] = useState<SalesTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('shopify_collections')
        .select(`
          *,
          shopify_collection_sync_settings(*)
        `)
        .order('title');

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast.error('Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesTracking = async () => {
    try {
      const { data, error } = await supabase
        .from('shopify_sales_tracking')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSalesTracking(data || []);
    } catch (error) {
      console.error('Error fetching sales tracking:', error);
    }
  };

  const syncCollections = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('shopify-collections-sync');
      
      if (error) throw error;
      
      toast.success(data.message || 'Collections synced successfully');
      await fetchCollections();
      return data;
    } catch (error) {
      console.error('Error syncing collections:', error);
      toast.error('Failed to sync collections');
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  const updateSyncSettings = async (
    collectionId: string, 
    settings: { 
      sync_enabled?: boolean;
      auto_add_products?: boolean;
      auto_price_products?: boolean;
    }
  ) => {
    try {
      const collection = collections.find(c => c.id === collectionId);
      if (!collection) throw new Error('Collection not found');

      const existingSettings = collection.shopify_collection_sync_settings?.[0];

      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('shopify_collection_sync_settings')
          .update(settings)
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from('shopify_collection_sync_settings')
          .insert({
            collection_id: collectionId,
            ...settings,
          });

        if (error) throw error;
      }

      await fetchCollections();
      return true;
    } catch (error) {
      console.error('Error updating sync settings:', error);
      toast.error('Failed to update sync settings');
      throw error;
    }
  };

  const getEnabledCollections = () => {
    return collections.filter(collection => 
      collection.shopify_collection_sync_settings?.[0]?.sync_enabled
    );
  };

  const getSyncStats = () => {
    const totalCollections = collections.length;
    const enabledCollections = getEnabledCollections().length;
    const totalProducts = collections.reduce((sum, c) => sum + (c.product_count || 0), 0);
    const enabledProducts = getEnabledCollections().reduce((sum, c) => sum + (c.product_count || 0), 0);

    return {
      totalCollections,
      enabledCollections,
      totalProducts,
      enabledProducts,
    };
  };

  useEffect(() => {
    fetchCollections();
    fetchSalesTracking();
  }, []);

  return {
    collections,
    salesTracking,
    loading,
    syncing,
    fetchCollections,
    fetchSalesTracking,
    syncCollections,
    updateSyncSettings,
    getEnabledCollections,
    getSyncStats,
  };
};