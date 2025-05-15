import React from 'react';
import { TradeIn, TradeInItem } from '../../types/tradeIn';
import TradeInEmptyState from '../TradeInEmptyState';
import StatusBadge from './StatusBadge';
import TradeInItemRow from './TradeInItemRow';
import { useTradeInItemUpdate } from '../../hooks/useTradeInItemUpdate';

interface TradeInDetailsPanelProps {
  tradeIn: TradeIn;
  loadingItems: string | null;
  setTradeIns?: React.Dispatch<React.SetStateAction<TradeIn[]>>;
}

const TradeInDetailsPanel: React.FC<TradeInDetailsPanelProps> = ({
  tradeIn,
  loadingItems
}) => {
  const { updatingItemId, updateTradeInItem } = useTradeInItemUpdate();
  
  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending': return 'Trade-in is waiting for review';
      case 'accepted': return 'Trade-in has been accepted';
      case 'rejected': return 'Trade-in has been rejected';
      default: return '';
    }
  };

  const statusMessage = getStatusMessage(tradeIn.status);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Status header */}
      <div className="bg-blue-50 px-6 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Trade-In Details</h3>
          <StatusBadge status={tradeIn.status} />
        </div>
        <p className="text-sm text-gray-600 mt-1">{statusMessage}</p>
        
        {/* Customer information */}
        <div className="mt-4 flex flex-wrap gap-4">
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
          
          {/* Show Shopify sync status if available */}
          {tradeIn.shopify_synced !== undefined && (
            <div>
              <p className="text-xs text-gray-500">Shopify</p>
              <p className={`font-medium ${tradeIn.shopify_synced ? 'text-green-600' : 'text-yellow-600'}`}>
                {tradeIn.shopify_synced ? 'Synced' : 'Not synced'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Staff notes if available */}
      {tradeIn.staff_notes && (
        <div className="px-6 py-3 bg-yellow-50">
          <h4 className="text-sm font-medium text-gray-700">Staff Notes</h4>
          <p className="text-sm text-gray-800 mt-1">{tradeIn.staff_notes}</p>
        </div>
      )}

      {/* Items table */}
      <div className="px-6 py-4">
        <h4 className="font-medium mb-2">Items</h4>
        
        {loadingItems === tradeIn.id ? (
          <p className="text-center py-4 text-gray-500">Loading items...</p>
        ) : !tradeIn.items || tradeIn.items.length === 0 ? (
          <TradeInEmptyState />
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
                </tr>
              </thead>
              <tbody>
                {tradeIn.items.map((item) => (
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
