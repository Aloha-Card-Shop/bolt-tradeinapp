
import React from 'react';
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
  return (
    <React.Fragment>
      <tr 
        className={`hover:bg-gray-50 cursor-pointer ${isExpanded ? 'bg-blue-50' : 'bg-white'}`}
        onClick={() => onToggleDetails(tradeIn.id)}
      >
        <td className="px-5 py-5 border-b border-gray-200 text-sm">
          <div className="flex items-center">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500 mr-2" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500 mr-2" />
            )}
            <p className="text-gray-900 whitespace-no-wrap">{tradeIn.customer_name}</p>
          </div>
        </td>
        <td className="px-5 py-5 border-b border-gray-200 text-sm">
          <p className="text-gray-900 whitespace-no-wrap">
            {new Date(tradeIn.trade_in_date).toLocaleDateString()}
          </p>
        </td>
        <td className="px-5 py-5 border-b border-gray-200 text-sm">
          <p className="text-gray-900 whitespace-no-wrap">${formatCurrency(tradeIn.cash_value)}</p>
        </td>
        <td className="px-5 py-5 border-b border-gray-200 text-sm">
          <p className="text-gray-900 whitespace-no-wrap">${formatCurrency(tradeIn.trade_value)}</p>
        </td>
        <td className="px-5 py-5 border-b border-gray-200 text-sm">
          <PaymentTypeBadge paymentType={tradeIn.payment_type || 'cash'} />
        </td>
        <td className="px-5 py-5 border-b border-gray-200 text-sm">
          <StatusBadge status={tradeIn.status} />
        </td>
        <td className="px-5 py-5 border-b border-gray-200 text-sm">
          <TradeInRowActions 
            tradeInId={tradeIn.id}
            status={tradeIn.status}
            actionLoading={actionLoading}
            onApprove={onApprove}
            onDeny={onDeny}
            onDelete={onDelete}
          />
        </td>
      </tr>
      
      {isExpanded && (
        <tr>
          <TradeInDetailsPanel 
            tradeIn={tradeIn} 
            loadingItems={loadingItems} 
            setTradeIns={setTradeIns} 
          />
        </tr>
      )}
    </React.Fragment>
  );
};

export default TradeInRow;
