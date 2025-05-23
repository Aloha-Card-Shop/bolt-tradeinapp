
import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart, Printer } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import TradeInRowActions from './TradeInRowActions';
import StatusBadge from './StatusBadge';
import PaymentTypeBadge from './PaymentTypeBadge';
import TradeInDetailsPanel from './TradeInDetailsPanel';
import { TradeIn } from '../../types/tradeIn';

interface TradeInRowProps {
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

const TradeInRow: React.FC<TradeInRowProps> = ({
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

  // Determine row background color based on status
  const getRowBackgroundColor = () => {
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

  return (
    <React.Fragment>
      <tr 
        className={`hover:bg-gray-50 cursor-pointer ${getRowBackgroundColor()}`}
        onClick={() => onToggleDetails(localTradeIn.id)}
      >
        <td className="px-5 py-5 border-b border-gray-200 text-sm">
          <div className="flex items-center">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500 mr-2" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500 mr-2" />
            )}
            <p className="text-gray-900 whitespace-no-wrap">{localTradeIn.customer_name}</p>
          </div>
        </td>
        <td className="px-5 py-5 border-b border-gray-200 text-sm">
          <p className="text-gray-900 whitespace-no-wrap">
            {new Date(localTradeIn.trade_in_date).toLocaleDateString()}
          </p>
        </td>
        <td className="px-5 py-5 border-b border-gray-200 text-sm">
          <p className="text-gray-900 whitespace-no-wrap">${formatCurrency(localTradeIn.cash_value)}</p>
        </td>
        <td className="px-5 py-5 border-b border-gray-200 text-sm">
          <p className="text-gray-900 whitespace-no-wrap">${formatCurrency(localTradeIn.trade_value)}</p>
        </td>
        <td className="px-5 py-5 border-b border-gray-200 text-sm">
          <PaymentTypeBadge paymentType={localTradeIn.payment_type || 'cash'} />
        </td>
        <td className="px-5 py-5 border-b border-gray-200 text-sm">
          <StatusBadge status={localTradeIn.status} />
        </td>
        <td className="px-5 py-5 border-b border-gray-200 text-sm">
          <div className="flex items-center space-x-2">
            {/* Display printing status */}
            {localTradeIn.printed && (
              <span 
                className="text-blue-600" 
                title={`Printed ${localTradeIn.print_count || 0} times. Last printed: ${
                  localTradeIn.last_printed_at 
                    ? new Date(localTradeIn.last_printed_at).toLocaleString() 
                    : 'Unknown'
                }`}
              >
                <Printer className="h-4 w-4" />
              </span>
            )}
            
            {/* Display Shopify sync status */}
            {localTradeIn.shopify_synced && (
              <span 
                className="text-green-600" 
                title={`Synced to Shopify on ${
                  localTradeIn.shopify_synced_at 
                    ? new Date(localTradeIn.shopify_synced_at).toLocaleString() 
                    : 'Unknown'
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
              </span>
            )}
            
            <TradeInRowActions 
              tradeInId={localTradeIn.id}
              status={localTradeIn.status}
              actionLoading={actionLoading}
              onApprove={onApprove}
              onDeny={onDeny}
              onDelete={onDelete}
              tradeIn={localTradeIn}
            />
          </div>
        </td>
      </tr>
      
      {isExpanded && (
        <tr>
          <td colSpan={7}>
            <TradeInDetailsPanel 
              tradeIn={localTradeIn} 
              loadingItems={loadingItems} 
              setTradeIns={setTradeIns} 
            />
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

export default TradeInRow;
