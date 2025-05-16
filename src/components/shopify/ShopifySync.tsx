
import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useShopify } from '../../hooks/useShopify';
import { TradeIn } from '../../types/tradeIn';

interface ShopifySyncProps {
  tradeIn: TradeIn;
  onSuccess?: () => void;
}

const ShopifySync: React.FC<ShopifySyncProps> = ({ tradeIn, onSuccess }) => {
  const { sendToShopify, isLoading, error } = useShopify();
  const [showConfirm, setShowConfirm] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSync = async () => {
    if (!tradeIn.id) {
      toast.error('Trade-in ID is missing');
      return;
    }

    if (tradeIn.shopify_synced) {
      toast.error('This trade-in has already been synced to Shopify');
      return;
    }

    setShowConfirm(false);
    setSyncError(null);
    
    try {
      const result = await sendToShopify(tradeIn.id);
      
      if (result && onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error syncing to Shopify:', err);
      setSyncError((err as Error).message || 'An unexpected error occurred during sync');
      toast.error((err as Error).message || 'An unexpected error occurred during Shopify sync');
    }
  };

  if (tradeIn.shopify_synced) {
    return (
      <div className="flex items-center mt-4 text-green-600">
        <ShoppingCart className="h-5 w-5 mr-2" />
        <span>Synced to Shopify on {new Date(tradeIn.shopify_synced_at || '').toLocaleString()}</span>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:bg-gray-400"
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          Sync to Shopify
        </button>
      ) : (
        <div className="bg-cyan-50 p-4 rounded-md">
          <p className="text-cyan-800 mb-3">Are you sure you want to sync this trade-in to Shopify?</p>
          <div className="flex space-x-3">
            <button
              onClick={handleSync}
              disabled={isLoading}
              className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Syncing...' : 'Yes, Sync Now'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
          {error && (
            <p className="mt-2 text-red-600 text-sm">{error}</p>
          )}
          {syncError && (
            <p className="mt-2 text-red-600 text-sm">{syncError}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ShopifySync;
