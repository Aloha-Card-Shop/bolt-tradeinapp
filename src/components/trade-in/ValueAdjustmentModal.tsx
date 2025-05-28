
import React, { useState } from 'react';
import { X, DollarSign, Save } from 'lucide-react';
import { TradeInItem } from '../../hooks/useTradeInList';
import { formatCurrency } from '../../utils/formatters';
import { toast } from 'react-hot-toast';

interface ValueAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: TradeInItem;
  onSave: (adjustments: { cashValue?: number; tradeValue?: number; notes?: string }) => void;
  userRole: 'admin' | 'manager' | 'user';
}

const ValueAdjustmentModal: React.FC<ValueAdjustmentModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
  userRole
}) => {
  const [cashValue, setCashValue] = useState(item.cashValue?.toString() || '0');
  const [tradeValue, setTradeValue] = useState(item.tradeValue?.toString() || '0');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!['admin', 'manager'].includes(userRole)) {
      toast.error('Insufficient permissions to adjust values');
      return;
    }

    const parsedCashValue = parseFloat(cashValue);
    const parsedTradeValue = parseFloat(tradeValue);

    if (isNaN(parsedCashValue) || isNaN(parsedTradeValue)) {
      toast.error('Please enter valid numeric values');
      return;
    }

    if (parsedCashValue < 0 || parsedTradeValue < 0) {
      toast.error('Values cannot be negative');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        cashValue: parsedCashValue,
        tradeValue: parsedTradeValue,
        notes: notes.trim() || undefined
      });
      
      toast.success('Values adjusted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to save adjustments');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Adjust Trade Values</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSaving}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Card Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">{item.card.name}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Condition: {item.condition}</p>
              <p>Quantity: {item.quantity}</p>
              <p>Market Price: ${formatCurrency(item.price)}</p>
            </div>
          </div>

          {/* Current Values */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Current Cash Value</div>
              <div className="text-lg font-semibold text-green-600">
                ${formatCurrency(item.cashValue || 0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Current Trade Value</div>
              <div className="text-lg font-semibold text-blue-600">
                ${formatCurrency(item.tradeValue || 0)}
              </div>
            </div>
          </div>

          {/* Adjustment Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Cash Value
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={cashValue}
                  onChange={(e) => setCashValue(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  step="0.01"
                  min="0"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Trade Value
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={tradeValue}
                  onChange={(e) => setTradeValue(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  step="0.01"
                  min="0"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adjustment Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Reason for adjustment..."
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving || !['admin', 'manager'].includes(userRole)}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center ${
              isSaving || !['admin', 'manager'].includes(userRole)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Adjustments
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ValueAdjustmentModal;
