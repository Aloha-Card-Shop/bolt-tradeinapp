
import React from 'react';
import TradeInTableHeader from './TradeInTableHeader';
import TradeInTableBody from './TradeInTableBody';
import TradeInTableLoading from './TradeInTableLoading';
import TradeInEmptyState from './TradeInEmptyState';
import { TradeIn } from '../../types/tradeIn';

interface TradeInTableProps {
  tradeIns: TradeIn[];
  isLoading: boolean;
  expandedTradeIn: string | null;
  loadingItems: string | null;
  actionLoading: string | null;
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
  onToggleDetails,
  onApprove,
  onDeny,
  onDelete
}) => {
  if (isLoading) {
    return <TradeInTableLoading />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full leading-normal">
        <TradeInTableHeader />
        <TradeInTableBody 
          tradeIns={tradeIns}
          expandedTradeIn={expandedTradeIn}
          loadingItems={loadingItems}
          actionLoading={actionLoading}
          onToggleDetails={onToggleDetails}
          onApprove={onApprove}
          onDeny={onDeny}
          onDelete={onDelete}
        />
      </table>
      
      {tradeIns.length === 0 && <TradeInEmptyState />}
    </div>
  );
};

export default TradeInTable;
