
import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useShopify } from '../../hooks/useShopify';
import { TradeIn } from '../../types/tradeIn';
import ErrorDisplay from '../dashboard/ErrorDisplay';
import { supabase } from '../../lib/supabase';

interface ShopifySyncProps {
  tradeIn: TradeIn;
  onSuccess?: () => void;
}

const ShopifySync: React.FC<ShopifySyncProps> = ({ tradeIn, onSuccess }) => {
  const { sendToShopify, isLoading, error } = useShopify();
  const [showConfirm, setShowConfirm] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ exists: boolean; message?: string } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // Verify the trade-in exists in the database when component mounts
  useEffect(() => {
    const verifyTradeIn = async () => {
      if (!tradeIn.id) return;
      
      setVerifying(true);
      try {
        console.log(`Verifying trade-in existence: ${tradeIn.id}`);
        
        // Check if the trade-in exists in the database
        const { data, error } = await supabase
          .from("trade_ins")
          .select("id, shopify_synced, status")
          .eq("id", tradeIn.id)
          .maybeSingle();
          
        if (error) {
          console.error("Error verifying trade-in:", error);
          setVerifyResult({ exists: false, message: `Error verifying trade-in: ${error.message}` });
        } else if (!data) {
          console.error(`Trade-in with ID ${tradeIn.id} not found in database`);
          setVerifyResult({ exists: false, message: `Trade-in with ID ${tradeIn.id} not found in database` });
        } else {
          console.log(`Trade-in verified: ${tradeIn.id}, shopify_synced: ${data.shopify_synced}, status: ${data.status}`);
          
          // Check if status is acceptable for syncing
          if (data.status !== 'accepted' && data.status !== 'pending') {
            setVerifyResult({ 
              exists: true, 
              message: `Trade-in status is "${data.status}". Only "accepted" or "pending" trade-ins can be synced.` 
            });
          } else {
            setVerifyResult({ exists: true });
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error("Error checking trade-in:", errorMessage);
        setVerifyResult({ exists: false, message: `Error checking trade-in: ${errorMessage}` });
      } finally {
        setVerifying(false);
      }
    };

    verifyTradeIn();
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
    
    // Double-check verification result
    if (verifyResult && !verifyResult.exists) {
      setSyncError(`Cannot sync: ${verifyResult.message}`);
      return;
    }

    setShowConfirm(false);
    setSyncError(null);
    setServerError(null);
    
    try {
      toast.loading('Syncing to Shopify...', { id: 'shopify-sync' });
      
      console.log(`Attempting to sync trade-in: ${tradeIn.id}`);
      
      // Create a timeout promise to detect if the request is taking too long
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
      });
      
      // Race between the actual request and the timeout
      const result = await Promise.race([
        sendToShopify(tradeIn.id),
        timeoutPromise
      ]) as boolean;
      
      if (result) {
        toast.success('Successfully synced to Shopify', { id: 'shopify-sync' });
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error('Failed to sync with Shopify', { id: 'shopify-sync' });
      }
    } catch (err) {
      console.error('Error syncing to Shopify:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during sync';
      
      // Handle specific error types more gracefully
      if (errorMessage.includes('timed out')) {
        setServerError('The request timed out. The server might be busy or Shopify API might be slow to respond. Please try again later.');
      } else if (errorMessage.includes('500') || errorMessage.includes('Failed to get response')) {
        setServerError('Server error (500). Possible causes: Shopify settings might be incorrect, database issues, or server overload. Please check logs for details and contact support if the issue persists.');
      } else {
        setSyncError(errorMessage);
      }
      
      toast.error(errorMessage, { id: 'shopify-sync' });
    }
  };

  // If there's a verification error, show it immediately
  if (verifyResult && !verifyResult.exists) {
    return (
      <div className="mt-4">
        <ErrorDisplay message={verifyResult.message || 'Cannot sync: Trade-in not found in database'} />
        <div className="mt-2 text-sm text-gray-600">
          This trade-in might have been deleted or its ID might be invalid. Please refresh the page or contact support.
        </div>
      </div>
    );
  }

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
      {verifying ? (
        <div className="text-gray-500">Verifying trade-in...</div>
      ) : !showConfirm ? (
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
            <ErrorDisplay message={error} />
          )}
          {syncError && (
            <ErrorDisplay message={syncError} />
          )}
          {serverError && (
            <div className="mt-3 p-3 bg-orange-100 border border-orange-300 text-orange-700 rounded-md">
              <h4 className="font-semibold">Server Error</h4>
              <p className="text-sm">{serverError}</p>
              <div className="mt-2 text-xs">
                <p>Troubleshooting steps:</p>
                <ol className="list-decimal list-inside ml-2">
                  <li>Check that Shopify settings are correctly configured in admin panel</li>
                  <li>Verify that your Shopify API credentials are valid</li>
                  <li>Ensure the edge function is properly deployed</li>
                  <li>Check the server logs for more details</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShopifySync;
