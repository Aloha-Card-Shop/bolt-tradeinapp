
import React from 'react';
import { Loader2 } from 'lucide-react';
import TradeInTableHeader from './TradeInTableHeader';
import TradeInRow from './TradeInRow';

interface TradeIn {
  id: string;
  customer_id: string;
  trade_in_date: string;
  total_value: number;
  cash_value: number;
  trade_value: number;
  status: 'pending' | 'completed' | 'cancelled';
  customer_name?: string;
  notes?: string | null;
  payment_type?: 'cash' | 'trade' | 'mixed';
  staff_notes?: string | null;
  items?: any[];
}

interface TradeInTableProps {
  tradeIns: TradeIn[];
  isLoading: boolean;
  expandedTradeIn: string | null;
  loadingItems: string | null;
  actionLoading: string | null;
  statusFilter: 'all' | 'pending' | 'completed' | 'cancelled';
  onToggleDetails: (id: string) => void;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  onDelete: (id: string) => void;
}

const TradeInTable: React.FC<TradeInTableProps> = ({
  tradeIns,
  isLoading,
  expandedTradeIn,
  loadingItems,
  actionLoading,
  statusFilter,
  onToggleDetails,
  onApprove,
  onDeny,
  onDelete
}) => {
  const getFilteredTradeIns = () => {
    if (statusFilter === 'all') {
      return tradeIns;
    }
    return tradeIns.filter(tradeIn => tradeIn.status === statusFilter);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
        <p className="mt-2">Loading trade-ins...</p>
      </div>
    );
  }

  const filteredTradeIns = getFilteredTradeIns();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full leading-normal">
        <TradeInTableHeader />
        <tbody>
          {filteredTradeIns.map((tradeIn) => (
            <TradeInRow
              key={tradeIn.id}
              tradeIn={tradeIn}
              isExpanded={expandedTradeIn === tradeIn.id}
              loadingItems={loadingItems}
              actionLoading={actionLoading}
              onToggleDetails={onToggleDetails}
              onApprove={onApprove}
              onDeny={onDeny}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
      
      {filteredTradeIns.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No trade-ins found matching the current filter
        </div>
      )}
    </div>
  );
};

export default TradeInTable;
