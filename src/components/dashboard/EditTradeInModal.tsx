
import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { TradeIn, TradeInItem } from '../../types/tradeIn';
import { useTradeInItemUpdate } from '../../hooks/useTradeInItemUpdate';
import EditableTradeInItemRow from './EditableTradeInItemRow';
import { toast } from 'react-hot-toast';

interface EditTradeInModalProps {
  tradeIn: TradeIn;
  onClose: () => void;
}

const EditTradeInModal: React.FC<EditTradeInModalProps> = ({ tradeIn, onClose }) => {
  const [staffNotes, setStaffNotes] = useState(tradeIn.staff_notes || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const { updateTradeInItem, updateStaffNotes } = useTradeInItemUpdate();
  
  // Fetch items if they're not already loaded
  useEffect(() => {
    if (!tradeIn.items && !loadingItems) {
      setLoadingItems(true);
      // This would be handled by the TradeInDetailsPanel, which already fetches the items
      setLoadingItems(false);
    }
  }, [tradeIn]);

  const handleItemUpdate = async (item: TradeInItem, updates: Partial<TradeInItem>) => {
    try {
      setIsUpdating(true);
      await updateTradeInItem(item.id!, updates);
      setIsUpdating(false);
      toast.success('Item updated successfully');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
      setIsUpdating(false);
    }
  };

  const handleNotesUpdate = async () => {
    try {
      setIsUpdating(true);
      await updateStaffNotes(tradeIn.id, staffNotes);
      setIsUpdating(false);
      toast.success('Notes updated successfully');
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to update notes');
      setIsUpdating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-semibold">
            Edit Trade-In
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h3 className="font-medium mb-1">Trade-In Details</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="block text-gray-500">Customer</span>
                  <span className="font-medium">{tradeIn.customer_name}</span>
                </div>
                <div>
                  <span className="block text-gray-500">Date</span>
                  <span className="font-medium">{new Date(tradeIn.trade_in_date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="block text-gray-500">Total Value</span>
                  <span className="font-medium">${tradeIn.total_value.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Items</h3>
              {loadingItems ? (
                <div className="text-center py-6">
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin mx-auto" />
                  <p className="mt-2 text-gray-600 text-sm">Loading items...</p>
                </div>
              ) : tradeIn.items && tradeIn.items.length > 0 ? (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Card</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Condition</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Qty</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Value</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Type</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradeIn.items.map((item) => (
                        <EditableTradeInItemRow
                          key={item.id}
                          item={item}
                          isUpdating={isUpdating}
                          onUpdate={(updates) => handleItemUpdate(item, updates)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No items found for this trade-in.</p>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-2">Staff Notes</h3>
              <textarea
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                className="w-full h-24 p-3 border rounded-lg"
                placeholder="Add notes for staff reference..."
                disabled={isUpdating}
              ></textarea>
              <button
                onClick={handleNotesUpdate}
                disabled={isUpdating}
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isUpdating ? (
                  <span className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Saving...
                  </span>
                ) : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTradeInModal;
