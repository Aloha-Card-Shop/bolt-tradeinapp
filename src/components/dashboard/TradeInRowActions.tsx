
import React from 'react';
import { Check, X, Trash2 } from 'lucide-react';

interface TradeInRowActionsProps {
  tradeInId: string;
  status: string;
  actionLoading: string | null;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  onDelete: (id: string) => void;
}

const TradeInRowActions: React.FC<TradeInRowActionsProps> = ({
  tradeInId,
  status,
  actionLoading,
  onApprove,
  onDeny,
  onDelete
}) => {
  return (
    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
      {status === 'pending' && (
        <>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onApprove(tradeInId);
            }}
            disabled={actionLoading === tradeInId}
            className="p-1 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
            title="Approve Trade-In"
          >
            <Check className="h-4 w-4" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDeny(tradeInId);
            }}
            disabled={actionLoading === tradeInId}
            className="p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
            title="Deny Trade-In"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      )}
      
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onDelete(tradeInId);
        }}
        disabled={actionLoading === tradeInId}
        className="p-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
        title="Delete Trade-In"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

export default TradeInRowActions;
