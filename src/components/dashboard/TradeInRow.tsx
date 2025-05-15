
import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
    setLocalTradeIn(tradeIn);
  }, [tradeIn]);

  return (
    <React.Fragment>
      <tr 
        className={`hover:bg-gray-50 cursor-pointer ${isExpanded ? 'bg-blue-50' : 'bg-white'}`}
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
          <TradeInRowActions 
            tradeInId={localTradeIn.id}
            status={localTradeIn.status}
            actionLoading={actionLoading}
            onApprove={onApprove}
            onDeny={onDeny}
            onDelete={onDelete}
            tradeIn={localTradeIn} // Pass the full trade-in object
          />
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
