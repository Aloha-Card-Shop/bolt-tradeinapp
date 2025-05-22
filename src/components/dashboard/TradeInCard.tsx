
import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart, Printer } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import TradeInDetailsPanel from './TradeInDetailsPanel';
import StatusBadge from './StatusBadge';
import PaymentTypeBadge from './PaymentTypeBadge';
import { TradeIn } from '../../types/tradeIn';

interface TradeInCardProps {
  tradeIn: TradeIn;
  isExpanded: boolean;
  loadingItems: string | null;
  actionLoading: string | null;
  onToggleDetails: (id: string) => void;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  onDelete: (id: string) => void;
  setTradeIns: React.Dispatch<React.SetStateAction<TradeIn[]>>;
}

const TradeInCard: React.FC<TradeInCardProps> = ({
  tradeIn,
  isExpanded,
  loadingItems,
  actionLoading,
  onToggleDetails,
  onApprove,
  onDeny,
  onDelete,
  setTradeIns
}) => {
  // Create a local state copy to force re-renders when tradeIn updates
  const [localTradeIn, setLocalTradeIn] = useState<TradeIn>(tradeIn);
  
  // Update local state whenever the tradeIn prop changes
  useEffect(() => {
    setLocalTradeIn({...tradeIn});
  }, [tradeIn]);

  // Determine card background color based on status
  const getCardBackgroundColor = () => {
    // Base expanded color
    if (isExpanded) return 'bg-blue-50';
    
    // Status-based colors
    if (localTradeIn.status === 'accepted') return 'bg-green-50';
    if (localTradeIn.status === 'rejected') return 'bg-red-50';
    
    // Check for printed status
    if (localTradeIn.printed) return 'bg-yellow-50';
    
    // Check for Shopify sync status
    if (localTradeIn.shopify_synced) return 'bg-indigo-50';
    
    // Default color
    return 'bg-white';
  };

  const handleCardClick = () => {
    onToggleDetails(localTradeIn.id);
  };

  const handleApproveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApprove(localTradeIn.id);
  };

  const handleDenyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeny(localTradeIn.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(localTradeIn.id);
  };

  return (
    <div className={`rounded-lg shadow-sm border border-gray-200 overflow-hidden ${getCardBackgroundColor()}`}>
      <div 
        className="p-4 cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500 mr-2" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500 mr-2" />
            )}
            <h3 className="font-medium text-gray-900">{localTradeIn.customer_name}</h3>
          </div>
          <StatusBadge status={localTradeIn.status} />
        </div>
        
        {/* Trade Details */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <p className="text-sm">{new Date(localTradeIn.trade_in_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Payment Type</p>
            <div className="mt-1">
              <PaymentTypeBadge paymentType={localTradeIn.payment_type || 'cash'} />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Cash Value</p>
            <p className="text-sm">${formatCurrency(localTradeIn.cash_value)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Trade Value</p>
            <p className="text-sm">${formatCurrency(localTradeIn.trade_value)}</p>
          </div>
        </div>
        
        {/* Status Icons */}
        <div className="flex items-center space-x-2">
          {/* Display printing status */}
          {localTradeIn.printed && (
            <span 
              className="text-blue-600 flex items-center" 
              title={`Printed ${localTradeIn.print_count || 0} times. Last printed: ${
                localTradeIn.last_printed_at 
                  ? new Date(localTradeIn.last_printed_at).toLocaleString() 
                  : 'Unknown'
              }`}
            >
              <Printer className="h-4 w-4 mr-1" />
              <span className="text-xs">Printed</span>
            </span>
          )}
          
          {/* Display Shopify sync status */}
          {localTradeIn.shopify_synced && (
            <span 
              className="text-green-600 flex items-center" 
              title={`Synced to Shopify on ${
                localTradeIn.shopify_synced_at 
                  ? new Date(localTradeIn.shopify_synced_at).toLocaleString() 
                  : 'Unknown'
              }`}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              <span className="text-xs">Synced</span>
            </span>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-4 border-t pt-3">
          {localTradeIn.status === 'pending' && (
            <>
              <button
                onClick={handleApproveClick}
                disabled={actionLoading === `approve_${localTradeIn.id}`}
                className="px-3 py-1.5 bg-green-100 text-green-800 text-xs rounded-md disabled:opacity-50"
              >
                {actionLoading === `approve_${localTradeIn.id}` ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={handleDenyClick}
                disabled={actionLoading === `deny_${localTradeIn.id}`}
                className="px-3 py-1.5 bg-red-100 text-red-800 text-xs rounded-md disabled:opacity-50"
              >
                {actionLoading === `deny_${localTradeIn.id}` ? 'Denying...' : 'Reject'}
              </button>
            </>
          )}
          <button
            onClick={handleDeleteClick}
            disabled={actionLoading === `delete_${localTradeIn.id}`}
            className="px-3 py-1.5 bg-gray-100 text-gray-800 text-xs rounded-md disabled:opacity-50"
          >
            {actionLoading === `delete_${localTradeIn.id}` ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          <TradeInDetailsPanel 
            tradeIn={localTradeIn} 
            loadingItems={loadingItems} 
            setTradeIns={setTradeIns} 
          />
        </div>
      )}
    </div>
  );
};

export default TradeInCard;
