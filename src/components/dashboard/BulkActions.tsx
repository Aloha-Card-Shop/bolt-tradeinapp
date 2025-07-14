import React, { useState } from 'react';
import { Check, X, Trash2 } from 'lucide-react';
import { TradeIn } from '../../types/tradeIn';

interface BulkActionsProps {
  selectedTradeIns: string[];
  tradeIns: TradeIn[];
  onBulkApprove: (ids: string[]) => void;
  onBulkDeny: (ids: string[]) => void;
  onBulkDelete: (ids: string[]) => void;
  onClearSelection: () => void;
  isLoading: boolean;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedTradeIns,
  tradeIns,
  onBulkApprove,
  onBulkDeny,
  onBulkDelete,
  onClearSelection,
  isLoading
}) => {
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);

  if (selectedTradeIns.length === 0) {
    return null;
  }

  const selectedItems = tradeIns.filter(t => selectedTradeIns.includes(t.id));
  const pendingSelected = selectedItems.filter(t => t.status === 'pending');
  const canApprove = pendingSelected.length > 0;
  const canDeny = pendingSelected.length > 0;

  const handleBulkAction = (action: 'approve' | 'deny' | 'delete') => {
    if (action === 'approve') {
      onBulkApprove(pendingSelected.map(t => t.id));
    } else if (action === 'deny') {
      onBulkDeny(pendingSelected.map(t => t.id));
    } else if (action === 'delete') {
      onBulkDelete(selectedTradeIns);
    }
    setShowConfirmation(null);
    onClearSelection();
  };

  const confirmAction = (action: 'approve' | 'deny' | 'delete') => {
    setShowConfirmation(action);
  };

  return (
    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-blue-700">
            {selectedTradeIns.length} selected
          </span>
          
          {canApprove && (
            <button
              onClick={() => confirmAction('approve')}
              disabled={isLoading}
              className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50"
            >
              <Check className="h-4 w-4 mr-1" />
              Approve ({pendingSelected.length})
            </button>
          )}
          
          {canDeny && (
            <button
              onClick={() => confirmAction('deny')}
              disabled={isLoading}
              className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50"
            >
              <X className="h-4 w-4 mr-1" />
              Deny ({pendingSelected.length})
            </button>
          )}
          
          <button
            onClick={() => confirmAction('delete')}
            disabled={isLoading}
            className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete ({selectedTradeIns.length})
          </button>
        </div>
        
        <button
          onClick={onClearSelection}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Clear Selection
        </button>
      </div>
      
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Confirm {showConfirmation === 'approve' ? 'Approval' : showConfirmation === 'deny' ? 'Denial' : 'Deletion'}
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {showConfirmation} {
                showConfirmation === 'delete' ? selectedTradeIns.length : pendingSelected.length
              } trade-in{(showConfirmation === 'delete' ? selectedTradeIns.length : pendingSelected.length) > 1 ? 's' : ''}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkAction(showConfirmation as 'approve' | 'deny' | 'delete')}
                className={`px-4 py-2 rounded-md text-white ${
                  showConfirmation === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : showConfirmation === 'deny'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {showConfirmation === 'approve' ? 'Approve' : showConfirmation === 'deny' ? 'Deny' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActions;