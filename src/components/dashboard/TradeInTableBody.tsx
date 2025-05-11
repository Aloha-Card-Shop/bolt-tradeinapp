
import React from 'react';
import TradeInRow from './TradeInRow';
import { TradeIn } from '../../types/tradeIn';

interface TradeInTableBodyProps {
  tradeIns: TradeIn[];
  expandedTradeIn: string | null;
  loadingItems: string | null;
  actionLoading: string | null;
  onToggleDetails: (id: string) => void;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  onDelete: (id: string) => void;
  setTradeIns: React.Dispatch<React.SetStateAction<TradeIn[]>>;
}

const TradeInTableBody: React.FC<TradeInTableBodyProps> = ({
  tradeIns,
  expandedTradeIn,
  loadingItems,
  actionLoading,
  onToggleDetails,
  onApprove,
  onDeny,
  onDelete,
  setTradeIns
}) => {
  return (
    <tbody>
      {tradeIns.map((tradeIn) => (
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
          setTradeIns={setTradeIns}
        />
      ))}
    </tbody>
  );
};

export default TradeInTableBody;
