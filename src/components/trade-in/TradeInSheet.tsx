import React, { useState, useCallback, useMemo } from 'react';
import { Edit3, Trash2, DollarSign, Coins, Package } from 'lucide-react';
import { TradeInSheetItem } from '../../hooks/useTradeInSheet';
import { useTradeValue } from '../../hooks/useTradeValue';
import { Customer } from '../../hooks/useCustomers';
import CustomerSection from './CustomerSection';

interface TradeInSheetProps {
  items: TradeInSheetItem[];
  selectedCustomer: Customer | null;
  customers?: Customer[];
  isLoadingCustomers?: boolean;
  onUpdateItem: (index: number, updates: Partial<TradeInSheetItem>) => void;
  onRemoveItem: (index: number) => void;
  onMarketPriceChange: (index: number, newPrice: number) => void;
  onCustomerSelect?: (customer: Customer | null) => void;
  onCustomerCreate?: (firstName: string, lastName: string, email?: string, phone?: string) => Promise<Customer>;
  clearSheet?: () => void;
}

interface EditingCell {
  rowIndex: number;
  field: 'price' | 'quantity' | 'condition' | 'paymentType';
}

export const TradeInSheet: React.FC<TradeInSheetProps> = ({
  items,
  selectedCustomer,
  customers,
  isLoadingCustomers,
  onUpdateItem,
  onRemoveItem,
  onMarketPriceChange,
  onCustomerSelect,
  onCustomerCreate,
  // clearSheet - Future feature for clearing the sheet
}) => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  // Calculate totals
  const totals = useMemo(() => {
    return items.reduce((acc, item) => {
      const cashValue = item.cashValue || 0;
      const tradeValue = item.tradeValue || 0;
      
      if (item.paymentType === 'cash') {
        acc.cashTotal += cashValue * item.quantity;
      } else if (item.paymentType === 'trade') {
        acc.tradeTotal += tradeValue * item.quantity;
      }
      
      acc.itemCount += item.quantity;
      return acc;
    }, { cashTotal: 0, tradeTotal: 0, itemCount: 0 });
  }, [items]);

  const startEdit = useCallback((rowIndex: number, field: EditingCell['field'], currentValue: string | number) => {
    setEditingCell({ rowIndex, field });
    setTempValue(String(currentValue));
  }, []);

  const finishEdit = useCallback(() => {
    if (!editingCell) return;

    const { rowIndex, field } = editingCell;
    const item = items[rowIndex];
    if (!item) return;

    const updates: Partial<TradeInSheetItem> = {};

    switch (field) {
      case 'price':
        const newPrice = parseFloat(tempValue) || 0;
        onMarketPriceChange(rowIndex, newPrice);
        break;
      case 'quantity':
        updates.quantity = parseInt(tempValue) || 1;
        onUpdateItem(rowIndex, updates);
        break;
      case 'condition':
        updates.condition = tempValue as any;
        onUpdateItem(rowIndex, updates);
        break;
      case 'paymentType':
        updates.paymentType = tempValue as 'cash' | 'trade';
        onUpdateItem(rowIndex, updates);
        break;
    }

    setEditingCell(null);
    setTempValue('');
  }, [editingCell, tempValue, onUpdateItem, onMarketPriceChange]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setTempValue('');
  }, []);

  const conditionOptions = [
    { value: 'near_mint', label: 'Near Mint' },
    { value: 'lightly_played', label: 'Lightly Played' },
    { value: 'moderately_played', label: 'Moderately Played' },
    { value: 'heavily_played', label: 'Heavily Played' },
    { value: 'damaged', label: 'Damaged' },
  ];

  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No items in trade-in sheet</h3>
        <p className="text-muted-foreground">Add cards from the search results to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customer Selection */}
      {customers && onCustomerSelect && onCustomerCreate && (
        <CustomerSection
          selectedCustomer={selectedCustomer}
          customers={customers}
          isLoadingCustomers={isLoadingCustomers || false}
          onCustomerSelect={onCustomerSelect}
          onCustomerCreate={onCustomerCreate}
        />
      )}

      {/* Sheet Table */}
      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left p-3 font-medium text-sm text-muted-foreground">Card</th>
                <th className="text-center p-3 font-medium text-sm text-muted-foreground w-24">Qty</th>
                <th className="text-left p-3 font-medium text-sm text-muted-foreground w-32">Condition</th>
                <th className="text-right p-3 font-medium text-sm text-muted-foreground w-24">Price</th>
                <th className="text-center p-3 font-medium text-sm text-muted-foreground w-28">Type</th>
                <th className="text-right p-3 font-medium text-sm text-muted-foreground w-24">Cash</th>
                <th className="text-right p-3 font-medium text-sm text-muted-foreground w-24">Trade</th>
                <th className="text-center p-3 font-medium text-sm text-muted-foreground w-16"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <SheetRow
                  key={`${item.fullCardData.id}-${index}`}
                  item={item}
                  index={index}
                  editingCell={editingCell}
                  tempValue={tempValue}
                  conditionOptions={conditionOptions}
                  onStartEdit={startEdit}
                  onFinishEdit={finishEdit}
                  onCancelEdit={cancelEdit}
                  onTempValueChange={setTempValue}
                  onRemove={() => onRemoveItem(index)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-700">Cash Total</p>
            <p className="text-lg font-bold text-green-800">${totals.cashTotal.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Coins className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-700">Trade Total</p>
            <p className="text-lg font-bold text-blue-800">${totals.tradeTotal.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Package className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-purple-700">Total Items</p>
            <p className="text-lg font-bold text-purple-800">{totals.itemCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SheetRowProps {
  item: TradeInSheetItem;
  index: number;
  editingCell: EditingCell | null;
  tempValue: string;
  conditionOptions: Array<{ value: string; label: string }>;
  onStartEdit: (index: number, field: EditingCell['field'], value: string | number) => void;
  onFinishEdit: () => void;
  onCancelEdit: () => void;
  onTempValueChange: (value: string) => void;
  onRemove: () => void;
}

const SheetRow: React.FC<SheetRowProps> = ({
  item,
  index,
  editingCell,
  tempValue,
  conditionOptions,
  onStartEdit,
  onFinishEdit,
  onCancelEdit,
  onTempValueChange,
  onRemove,
}) => {
  const { cashValue, tradeValue } = useTradeValue(item.fullCardData.game, item.price);
  
  // Use calculated values or fallback to item values
  const effectiveCashValue = item.cashValue ?? cashValue;
  const effectiveTradeValue = item.tradeValue ?? tradeValue;

  const isEditing = (field: EditingCell['field']) => 
    editingCell?.rowIndex === index && editingCell?.field === field;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onFinishEdit();
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  const getConditionLabel = (condition: string) => {
    const option = conditionOptions.find(opt => opt.value === condition);
    return option?.label || condition.replace('_', ' ');
  };

  return (
    <tr className="border-b hover:bg-muted/30 transition-colors">
      {/* Card Name */}
      <td className="p-3">
        <div className="flex items-center space-x-3">
          {item.fullCardData.imageUrl && (
            <img 
              src={item.fullCardData.imageUrl} 
              alt={item.fullCardData.name}
              className="w-8 h-11 object-cover rounded border"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm text-foreground truncate">{item.fullCardData.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {'setName' in item.fullCardData ? (item.fullCardData as any).setName : (item.fullCardData as any).set}
            </p>
          </div>
        </div>
      </td>

      {/* Quantity */}
      <td className="p-3 text-center">
        {isEditing('quantity') ? (
          <input
            type="number"
            value={tempValue}
            onChange={(e) => onTempValueChange(e.target.value)}
            onBlur={onFinishEdit}
            onKeyDown={handleKeyDown}
            className="w-16 px-2 py-1 text-center text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
            min="1"
          />
        ) : (
          <button
            onClick={() => onStartEdit(index, 'quantity', item.quantity)}
            className="w-16 px-2 py-1 text-sm hover:bg-muted rounded transition-colors"
          >
            {item.quantity}
          </button>
        )}
      </td>

      {/* Condition */}
      <td className="p-3">
        {isEditing('condition') ? (
          <select
            value={tempValue}
            onChange={(e) => onTempValueChange(e.target.value)}
            onBlur={onFinishEdit}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          >
            {conditionOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <button
            onClick={() => onStartEdit(index, 'condition', item.condition)}
            className="w-full px-2 py-1 text-left text-sm hover:bg-muted rounded transition-colors"
          >
            {getConditionLabel(item.condition)}
            {item.usedFallback && <span className="text-amber-600 ml-1" title="Price found using fallback condition">*</span>}
          </button>
        )}
      </td>

      {/* Price */}
      <td className="p-3 text-right">
        {isEditing('price') ? (
          <input
            type="number"
            value={tempValue}
            onChange={(e) => onTempValueChange(e.target.value)}
            onBlur={onFinishEdit}
            onKeyDown={handleKeyDown}
            className="w-20 px-2 py-1 text-right text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
            step="0.01"
            min="0"
          />
        ) : (
          <button
            onClick={() => onStartEdit(index, 'price', item.price)}
            className="w-20 px-2 py-1 text-right text-sm hover:bg-muted rounded transition-colors flex items-center justify-end space-x-1"
          >
            <span>${item.price.toFixed(2)}</span>
            <Edit3 className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </td>

      {/* Payment Type */}
      <td className="p-3 text-center">
        {isEditing('paymentType') ? (
          <select
            value={tempValue}
            onChange={(e) => onTempValueChange(e.target.value)}
            onBlur={onFinishEdit}
            onKeyDown={handleKeyDown}
            className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          >
            <option value="">Select</option>
            <option value="cash">Cash</option>
            <option value="trade">Trade</option>
          </select>
        ) : (
          <button
            onClick={() => onStartEdit(index, 'paymentType', item.paymentType || '')}
            className={`w-20 px-2 py-1 text-xs rounded font-medium transition-colors ${
              item.paymentType === 'cash' 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : item.paymentType === 'trade'
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {item.paymentType === 'cash' ? 'Cash' : item.paymentType === 'trade' ? 'Trade' : 'Select'}
          </button>
        )}
      </td>

      {/* Cash Value */}
      <td className="p-3 text-right">
        <span className="text-sm font-medium text-green-700">
          ${(effectiveCashValue * item.quantity).toFixed(2)}
        </span>
      </td>

      {/* Trade Value */}
      <td className="p-3 text-right">
        <span className="text-sm font-medium text-blue-700">
          ${(effectiveTradeValue * item.quantity).toFixed(2)}
        </span>
      </td>

      {/* Actions */}
      <td className="p-3 text-center">
        <button
          onClick={onRemove}
          className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors"
          title="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
};