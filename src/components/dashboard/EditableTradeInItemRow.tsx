
import React, { useState, useCallback } from 'react';
import { TradeInItem } from '../../types/tradeIn';
import { formatCurrency } from '../../utils/formatters';
import { Loader2, Edit2 } from 'lucide-react';
import ValueAdjustmentModal from '../trade-in/ValueAdjustmentModal';
import { useSession } from '../../hooks/useSession';

interface EditableTradeInItemRowProps {
  item: TradeInItem;
  isUpdating: boolean;
  onUpdate: (updates: Partial<TradeInItem>) => Promise<TradeInItem | boolean>;
}

const EditableTradeInItemRow: React.FC<EditableTradeInItemRowProps> = ({
  item,
  isUpdating,
  onUpdate
}) => {
  const [isEditingCondition, setIsEditingCondition] = useState(false);
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [isEditingPaymentType, setIsEditingPaymentType] = useState(false);
  const [isValueAdjustmentOpen, setIsValueAdjustmentOpen] = useState(false);
  
  const [conditionValue, setConditionValue] = useState(item.condition);
  const [quantityValue, setQuantityValue] = useState(item.quantity.toString());
  const [priceValue, setPriceValue] = useState(item.price.toString());
  const [paymentTypeValue, setPaymentTypeValue] = useState(
    item.attributes?.paymentType || 'cash'
  );

  const { user } = useSession();
  const userRole = (user as any)?.role || 'user';
  const canAdjustValues = ['admin', 'manager'].includes(userRole);

  const handleSave = useCallback(async (field: string, value: any) => {
    let updates: Partial<TradeInItem> = {};
    
    switch (field) {
      case 'condition':
        updates.condition = value;
        setIsEditingCondition(false);
        break;
      case 'quantity':
        const qty = parseInt(value);
        if (qty > 0) {
          updates.quantity = qty;
          setIsEditingQuantity(false);
        }
        break;
      case 'price':
        const price = parseFloat(value);
        if (price > 0) {
          updates.price = price;
          setIsEditingPrice(false);
        }
        break;
      case 'paymentType':
        updates.attributes = {
          ...item.attributes,
          paymentType: value
        };
        setIsEditingPaymentType(false);
        break;
    }
    
    if (Object.keys(updates).length > 0) {
      await onUpdate(updates);
    }
  }, [onUpdate, item.attributes]);

  const handleValueAdjustment = useCallback(async (adjustments: { 
    cashValue?: number; 
    tradeValue?: number; 
    notes?: string 
  }) => {
    const updates: Partial<TradeInItem> = {
      attributes: {
        ...item.attributes,
        cashValue: adjustments.cashValue,
        tradeValue: adjustments.tradeValue
      }
    };

    // Add adjustment notes to the item if provided
    if (adjustments.notes) {
      updates.attributes = {
        ...updates.attributes,
        adjustmentNotes: adjustments.notes,
        adjustedBy: user?.email,
        adjustedAt: new Date().toISOString()
      };
    }

    await onUpdate(updates);
  }, [onUpdate, item.attributes, user?.email]);

  const currentCashValue = item.attributes?.cashValue || 0;
  const currentTradeValue = item.attributes?.tradeValue || 0;
  const currentPaymentType = item.attributes?.paymentType || 'cash';
  const displayValue = currentPaymentType === 'cash' ? currentCashValue : currentTradeValue;

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        {/* Card Name */}
        <td className="px-4 py-3">
          <div>
            <div className="font-medium text-gray-900">{item.card_name}</div>
            {item.set_name && (
              <div className="text-sm text-gray-500">{item.set_name}</div>
            )}
          </div>
        </td>

        {/* Condition */}
        <td className="px-4 py-3">
          {isEditingCondition ? (
            <select
              value={conditionValue}
              onChange={(e) => setConditionValue(e.target.value)}
              onBlur={() => handleSave('condition', conditionValue)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave('condition', conditionValue)}
              className="w-full p-1 border rounded text-sm"
              autoFocus
              disabled={isUpdating}
            >
              <option value="near_mint">Near Mint</option>
              <option value="lightly_played">Lightly Played</option>
              <option value="moderately_played">Moderately Played</option>
              <option value="heavily_played">Heavily Played</option>
              <option value="damaged">Damaged</option>
            </select>
          ) : (
            <span 
              className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
              onClick={() => setIsEditingCondition(true)}
            >
              {item.condition?.replace('_', ' ') || 'Unknown'}
            </span>
          )}
        </td>

        {/* Quantity */}
        <td className="px-4 py-3">
          {isEditingQuantity ? (
            <input
              type="number"
              value={quantityValue}
              onChange={(e) => setQuantityValue(e.target.value)}
              onBlur={() => handleSave('quantity', quantityValue)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave('quantity', quantityValue)}
              className="w-16 p-1 border rounded text-sm"
              min="1"
              autoFocus
              disabled={isUpdating}
            />
          ) : (
            <span 
              className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
              onClick={() => setIsEditingQuantity(true)}
            >
              {item.quantity}
            </span>
          )}
        </td>

        {/* Market Price */}
        <td className="px-4 py-3">
          {isEditingPrice ? (
            <input
              type="number"
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value)}
              onBlur={() => handleSave('price', priceValue)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave('price', priceValue)}
              className="w-20 p-1 border rounded text-sm"
              step="0.01"
              min="0"
              autoFocus
              disabled={isUpdating}
            />
          ) : (
            <span 
              className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
              onClick={() => setIsEditingPrice(true)}
            >
              ${formatCurrency(item.price)}
            </span>
          )}
        </td>

        {/* Trade/Cash Value */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              ${formatCurrency(displayValue)}
            </span>
            {canAdjustValues && (
              <button
                onClick={() => setIsValueAdjustmentOpen(true)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Adjust values"
                disabled={isUpdating}
              >
                <Edit2 className="h-3 w-3" />
              </button>
            )}
          </div>
          {item.attributes?.adjustmentNotes && (
            <div className="text-xs text-orange-600 mt-1">
              Manually adjusted
            </div>
          )}
        </td>

        {/* Payment Type */}
        <td className="px-4 py-3">
          {isEditingPaymentType ? (
            <select
              value={paymentTypeValue}
              onChange={(e) => setPaymentTypeValue(e.target.value)}
              onBlur={() => handleSave('paymentType', paymentTypeValue)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave('paymentType', paymentTypeValue)}
              className="w-full p-1 border rounded text-sm"
              autoFocus
              disabled={isUpdating}
            >
              <option value="cash">Cash</option>
              <option value="trade">Trade</option>
            </select>
          ) : (
            <span 
              className={`cursor-pointer hover:bg-blue-50 px-2 py-1 rounded inline-flex items-center text-xs font-medium ${
                currentPaymentType === 'cash' 
                  ? 'text-green-700 bg-green-100' 
                  : 'text-blue-700 bg-blue-100'
              }`}
              onClick={() => setIsEditingPaymentType(true)}
            >
              {currentPaymentType === 'cash' ? 'Cash' : 'Trade'}
            </span>
          )}
        </td>

        {/* Total Value */}
        <td className="px-4 py-3 font-medium">
          ${formatCurrency(displayValue * item.quantity)}
          {isUpdating && (
            <Loader2 className="inline h-3 w-3 animate-spin ml-2 text-blue-500" />
          )}
        </td>
      </tr>

      {/* Value Adjustment Modal */}
      <ValueAdjustmentModal
        isOpen={isValueAdjustmentOpen}
        onClose={() => setIsValueAdjustmentOpen(false)}
        item={{
          ...item,
          card: { name: item.card_name, id: item.card_id, game: '', productId: '' },
          cashValue: currentCashValue,
          tradeValue: currentTradeValue
        }}
        onSave={handleValueAdjustment}
        userRole={userRole}
      />
    </>
  );
};

export default EditableTradeInItemRow;
