
import React, { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useShopify } from '../../hooks/useShopify';
import { TradeIn } from '../../types/tradeIn';

interface ShopifySyncProps {
  tradeIn: TradeIn;
  onSuccess?: () => void;
}

const ShopifySync: React.FC<ShopifySyncProps> = ({ tradeIn, onSuccess }) => {
  const { syncTradeInToShopify } = useShopify();
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    
    try {
      const result = await syncTradeInToShopify(tradeIn);
      
      if (result.success) {
        toast.success('Successfully synced to Shopify!');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(result.error || 'Unknown error occurred during sync');
        toast.error(`Sync failed: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      // Prevent error objects from causing UI glitches
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync with Shopify';
      console.error('Error syncing with Shopify:', errorMessage);
      setError(errorMessage);
      toast.error('Failed to sync with Shopify. Please try again later.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className={`
          inline-flex items-center px-3 py-2 text-sm font-medium rounded-md
          ${tradeIn.shopify_synced 
            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
            : 'bg-blue-600 text-white hover:bg-blue-700'}
          transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isSyncing ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4 mr-1.5" />
        )}
        {tradeIn.shopify_synced ? 'Re-sync to Shopify' : 'Sync to Shopify'}
      </button>
      
      {error && (
        <div className="mt-2 text-sm text-red-600 max-w-md">
          <p>Error: {error}</p>
        </div>
      )}
    </div>
  );
};

export default ShopifySync;
