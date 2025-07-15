import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Loader2, RefreshCw, ExternalLink, Settings, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useUserRole } from '../../hooks/useUserRole';

interface ShopifyCollection {
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

const ShopifyCollections: React.FC = () => {
  const { role: userRole } = useUserRole();
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [updatingSync, setUpdatingSync] = useState<string | null>(null);

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

  const syncCollections = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('shopify-collections-sync');
      
      if (error) throw error;
      
      toast.success(data.message || 'Collections synced successfully');
      await fetchCollections();
    } catch (error) {
      console.error('Error syncing collections:', error);
      toast.error('Failed to sync collections');
    } finally {
      setSyncing(false);
    }
  };

  const toggleSync = async (collection: ShopifyCollection, enabled: boolean) => {
    setUpdatingSync(collection.id);
    try {
      const syncSettings = collection.shopify_collection_sync_settings?.[0];

      if (syncSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('shopify_collection_sync_settings')
          .update({ sync_enabled: enabled })
          .eq('id', syncSettings.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from('shopify_collection_sync_settings')
          .insert({
            collection_id: collection.id,
            sync_enabled: enabled,
          });

        if (error) throw error;
      }

      toast.success(`Sync ${enabled ? 'enabled' : 'disabled'} for ${collection.title}`);
      await fetchCollections();
    } catch (error) {
      console.error('Error updating sync settings:', error);
      toast.error('Failed to update sync settings');
    } finally {
      setUpdatingSync(null);
    }
  };

  useEffect(() => {
    if (userRole && ['admin', 'manager', 'shopify_manager'].includes(userRole)) {
      fetchCollections();
    }
  }, [userRole]);

  if (!userRole || !['admin', 'manager', 'shopify_manager'].includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate">
                Shopify Collections
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage which Shopify collections to sync with your inventory
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={syncCollections}
                disabled={syncing}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {syncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync Collections
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : collections.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex flex-col items-center justify-center">
              <Settings className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Collections Found</h3>
              <p className="text-gray-500 text-center mb-4">
                No Shopify collections have been synced yet. Click "Sync Collections" to fetch them from your Shopify store.
              </p>
              <button
                onClick={syncCollections}
                disabled={syncing}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {syncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync Collections
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => {
              const syncSettings = collection.shopify_collection_sync_settings?.[0];
              const syncEnabled = syncSettings?.sync_enabled || false;

              return (
                <div key={collection.id} className="bg-white overflow-hidden shadow rounded-lg">
                  {/* Collection Image */}
                  <div className="aspect-w-16 aspect-h-9">
                    {collection.image_url ? (
                      <img
                        src={collection.image_url}
                        alt={collection.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <Settings className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Collection Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{collection.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{collection.handle}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          collection.published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {collection.published ? 'Published' : 'Draft'}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {collection.product_count || 0} products
                        </span>
                      </div>
                    </div>

                    {collection.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {collection.description.replace(/<[^>]*>/g, '')}
                      </p>
                    )}

                    {/* Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={syncEnabled}
                            onChange={(e) => toggleSync(collection, e.target.checked)}
                            disabled={updatingSync === collection.id}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <span className="text-sm font-medium text-gray-900">
                          {syncEnabled ? 'Sync Enabled' : 'Sync Disabled'}
                        </span>
                        {updatingSync === collection.id && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>

                      <button
                        onClick={() => {
                          window.open(`https://admin.shopify.com/collections/${collection.shopify_collection_id}`, '_blank');
                        }}
                        className="p-2 text-gray-400 hover:text-gray-500"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>

                    {collection.last_synced_at && (
                      <p className="text-xs text-gray-500 mt-3">
                        Last synced: {new Date(collection.last_synced_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopifyCollections;