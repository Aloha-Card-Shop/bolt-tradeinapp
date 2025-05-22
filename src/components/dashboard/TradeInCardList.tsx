
import React from 'react';
import { TradeIn } from '../../types/tradeIn';
import TradeInCard from './TradeInCard';
import TradeInEmptyState from './TradeInEmptyState';
import LoadingSpinner from '../common/LoadingSpinner';

interface TradeInCardListProps {
  tradeIns: TradeIn[];
  isLoading: boolean;
  expandedTradeIn: string | null;
  loadingItems: string | null;
  actionLoading: string | null;
  onToggleDetails: (id: string) => void;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  onDelete: (id: string) => void;
  setTradeIns: React.Dispatch<React.SetStateAction<TradeIn[]>>;
}

const TradeInCardList: React.FC<TradeInCardListProps> = ({
  tradeIns,
  isLoading,
  expandedTradeIn,
  loadingItems,
  actionLoading,
  onToggleDetails,
  onApprove,
  onDeny,
  onDelete,
  setTradeIns
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading trade-ins...</span>
      </div>
    );
  }

  if (tradeIns.length === 0) {
    return <TradeInEmptyState />;
  }

  return (
    <div className="space-y-4">
      {tradeIns.map((tradeIn) => (
        <TradeInCard
          key={tradeIn.id}
          tradeIn={tradeIn}
          isExpanded={expandedTradeIn === tradeIn.id}
          loadingItems={loadingItems}
          actionLoading={actionLoading}
          onToggleDetails={onToggleDetails}
          onApprove={onApprove}
          onDeny={onDeny}
          onDelete={onDelete}
          setTradeIns={setTradeIns}
        />
      ))}
    </div>
  );
};

export default TradeInCardList;
