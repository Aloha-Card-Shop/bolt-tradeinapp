
import React, { useState, useEffect } from 'react';
import { ShoppingCart, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useShopify } from '../../hooks/useShopify';
import { TradeIn } from '../../types/tradeIn';
import ShopifySyncLogs from './ShopifySyncLogs';
import { supabase } from '../../lib/supabase';

interface ShopifySyncProps {
  tradeIn: TradeIn;
  onSuccess?: () => void;
}

const ShopifySync: React.FC<ShopifySyncProps> = ({ tradeIn, onSuccess }) => {
  const { sendToShopify, isLoading, error } = useShopify();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [hasSyncLogs, setHasSyncLogs] = useState(false);

  useEffect(() => {
    // Check if there are any sync logs for this trade-in
    const checkForLogs = async () => {
      if (!tradeIn.id) return;
      
      const { count, error } = await supabase
        .from('shopify_sync_logs')
        .select('*', { count: 'exact', head: true })
        .eq('trade_in_id', tradeIn.id);
        
      if (!error && count && count > 0) {
        setHasSyncLogs(true);
      }
    };
    
    checkForLogs();
  }, [tradeIn.id]);

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
    
    try {
      const result = await sendToShopify(tradeIn.id);
      
      if (result && onSuccess) {
        onSuccess();
      }
      
      // After syncing, we know there will be logs
      setHasSyncLogs(true);
    } catch (err) {
      console.error('Error syncing to Shopify:', err);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {tradeIn.shopify_synced ? (
        <div className="flex items-center text-green-600">
          <ShoppingCart className="h-5 w-5 mr-2" />
          <span>Synced to Shopify on {new Date(tradeIn.shopify_synced_at || '').toLocaleString()}</span>
        </div>
      ) : (
        !showConfirm ? (
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
          </div>
        )
      )}
      
      {/* Toggle Logs Button */}
      {hasSyncLogs && (
        <div>
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <FileText className="h-4 w-4 mr-2" />
            {showLogs ? 'Hide Sync Logs' : 'Show Sync Logs'}
          </button>
          
          {showLogs && (
            <div className="mt-4">
              <ShopifySyncLogs tradeInId={tradeIn.id} limit={5} showTitle={false} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShopifySync;
