
import React from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { TradeIn } from '../../types/tradeIn';
import TradeInEmptyState from '../trade-in/TradeInEmptyState';
import StatusBadge from './StatusBadge';
import TradeInItemRow from './TradeInItemRow';
import TradeInItemCard from './TradeInItemCard';
import ShopifySync from '../shopify/ShopifySync';
import { Printer, Clock } from 'lucide-react';

interface TradeInDetailsPanelProps {
  tradeIn: TradeIn;
  loadingItems: string | null;
  setTradeIns?: React.Dispatch<React.SetStateAction<TradeIn[]>>;
}

const TradeInDetailsPanel: React.FC<TradeInDetailsPanelProps> = ({
  tradeIn,
  loadingItems,
  setTradeIns
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // We'll read directly from tradeIn.items and not maintain a separate local state
  // This ensures we always use the latest data from the parent component
  
  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending': return 'Trade-in is waiting for review';
      case 'accepted': return 'Trade-in has been accepted';
      case 'rejected': return 'Trade-in has been rejected';
      default: return '';
    }
  };

  const statusMessage = getStatusMessage(tradeIn.status);
  
  // Always use the items from the latest tradeIn prop
  const displayItems = tradeIn.items || [];

  // Handle refresh after Shopify sync
  const handleSyncSuccess = () => {
    if (setTradeIns) {
      setTradeIns(prevTradeIns => 
        prevTradeIns.map(ti => 
          ti.id === tradeIn.id 
            ? { ...ti, shopify_synced: true, shopify_synced_at: new Date().toISOString() } 
            : ti
        )
      );
    }
  };

  return (
    <div className="bg-white overflow-hidden">
      {/* Status header */}
      <div className="bg-blue-50 px-4 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Trade-In Details</h3>
          <StatusBadge status={tradeIn.status} />
        </div>
        <p className="text-sm text-gray-600 mt-1">{statusMessage}</p>
        
        {/* Customer information */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-3">
          <div>
            <p className="text-xs text-gray-500">Customer</p>
            <p className="font-medium">{tradeIn.customer_name || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <p className="font-medium">{new Date(tradeIn.trade_in_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Value</p>
            <p className="font-medium">${tradeIn.total_value.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Payment</p>
            <p className="font-medium capitalize">{tradeIn.payment_type || 'Cash'}</p>
          </div>
          
          {/* Show Printing Status */}
          <div>
            <p className="text-xs text-gray-500">Printing</p>
            <div className="flex items-center gap-1">
              <Printer className={`h-3 w-3 ${tradeIn.printed ? 'text-blue-600' : 'text-gray-400'}`} />
              <p className={`font-medium ${tradeIn.printed ? 'text-blue-600' : 'text-gray-500'}`}>
                {tradeIn.printed 
                  ? `Printed ${tradeIn.print_count || 1} times` 
                  : 'Not printed'}
              </p>
            </div>
            {tradeIn.last_printed_at && (
              <p className="text-xs text-gray-500 mt-1">
                <Clock className="h-3 w-3 inline mr-1" />
                {new Date(tradeIn.last_printed_at).toLocaleString()}
              </p>
            )}
          </div>
          
          {/* Show Shopify sync status */}
          <div>
            <p className="text-xs text-gray-500">Shopify</p>
            <p className={`font-medium ${tradeIn.shopify_synced ? 'text-green-600' : 'text-yellow-600'}`}>
              {tradeIn.shopify_synced ? 'Synced' : 'Not synced'}
            </p>
            {tradeIn.shopify_synced_at && (
              <p className="text-xs text-gray-500 mt-1">
                <Clock className="h-3 w-3 inline mr-1" />
                {new Date(tradeIn.shopify_synced_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Add Shopify sync button with error handling */}
        {(tradeIn.status === 'accepted' || tradeIn.status === 'pending') && (
          <div className="mt-4">
            <ShopifySync 
              tradeIn={tradeIn} 
              onSuccess={handleSyncSuccess} 
            />
          </div>
        )}
      </div>

      {/* Staff notes if available */}
      {tradeIn.staff_notes && (
        <div className="px-4 py-3 bg-yellow-50">
          <h4 className="text-sm font-medium text-gray-700">Staff Notes</h4>
          <p className="text-sm text-gray-800 mt-1">{tradeIn.staff_notes}</p>
        </div>
      )}

      {/* Items - Table for desktop, Cards for mobile */}
      <div className="px-4 py-4">
        <h4 className="font-medium mb-3">Items</h4>
        
        {loadingItems === tradeIn.id ? (
          <p className="text-center py-4 text-gray-500">Loading items...</p>
        ) : !displayItems || displayItems.length === 0 ? (
          <TradeInEmptyState />
        ) : isMobile ? (
          <div className="space-y-3">
            {displayItems.map((item) => (
              <TradeInItemCard 
                key={item.id} 
                item={item}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="text-xs font-medium text-gray-500 px-4 py-2 text-left border-b">Card</th>
                  <th className="text-xs font-medium text-gray-500 px-4 py-2 text-left border-b">Condition</th>
                  <th className="text-xs font-medium text-gray-500 px-4 py-2 text-left border-b">Qty</th>
                  <th className="text-xs font-medium text-gray-500 px-4 py-2 text-left border-b">Market</th>
                  <th className="text-xs font-medium text-gray-500 px-4 py-2 text-left border-b">Value</th>
                  <th className="text-xs font-medium text-gray-500 px-4 py-2 text-left border-b">Type</th>
                  <th className="text-xs font-medium text-gray-500 px-4 py-2 text-left border-b">Total</th>
                  <th className="text-xs font-medium text-gray-500 px-4 py-2 text-left border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item) => (
                  <TradeInItemRow 
                    key={item.id} 
                    item={item}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeInDetailsPanel;
