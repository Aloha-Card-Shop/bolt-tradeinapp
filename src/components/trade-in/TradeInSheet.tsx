import React, { useState, useCallback, useMemo } from 'react';
import { Edit3, Trash2, DollarSign, Package, CheckCircle } from 'lucide-react';
import { TradeInSheetItem } from '../../hooks/useTradeInSheet';
import { useTradeValue } from '../../hooks/useTradeValue';
import { Customer } from '../../hooks/useCustomers';
import CustomerSection from './CustomerSection';
import TradeInPriceReviewModal from './TradeInPriceReviewModal';
import { insertTradeInAndItems } from '../../services/insertTradeInAndItems';
import { toast } from 'react-hot-toast';
import { useMediaQuery } from '../../hooks/useMediaQuery';

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
  clearSheet
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate totals with memoization
  const totals = useMemo(() => {
    return items.reduce((acc, item) => {
      // Use the same logic as individual rows to calculate trade values
      const gameType = item.fullCardData.game;
      const basePrice = item.price;
      
      // Calculate cash and trade values using the same hook logic
      // This is a simplified version of useTradeValue calculation
      const cashPercentage = gameType === 'pokemon' ? 0.35 : 0.35; // Default values
      const tradePercentage = gameType === 'pokemon' ? 0.50 : 0.50; // Default values
      
      const calculatedCashValue = basePrice * cashPercentage;
      const calculatedTradeValue = basePrice * tradePercentage;
      
      // Use effective values (manual override or calculated)
      const effectiveCashValue = item.cashValue ?? calculatedCashValue;
      const effectiveTradeValue = item.tradeValue ?? calculatedTradeValue;
      
      if (item.paymentType === 'cash') {
        acc.cashTotal += effectiveCashValue * item.quantity;
      } else if (item.paymentType === 'trade') {
        acc.tradeTotal += effectiveTradeValue * item.quantity;
      }
      
      acc.itemCount += item.quantity;
      return acc;
    }, { cashTotal: 0, tradeTotal: 0, itemCount: 0, totalValue: 0 });
  }, [items]);

  // Validation state
  const validationState = useMemo(() => {
    const hasItems = items.length > 0;
    const hasCustomer = !!selectedCustomer;
    const allHavePaymentType = items.every(item => item.paymentType);
    const allHavePrice = items.every(item => item.price && item.price > 0);
    
    return {
      hasItems,
      hasCustomer,
      allHavePaymentType,
      allHavePrice,
      isValid: hasItems && hasCustomer && allHavePaymentType && allHavePrice
    };
  }, [items, selectedCustomer]);

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
  }, [editingCell, tempValue, onUpdateItem, onMarketPriceChange, items]);

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

  // Helper functions
  function handleOpenReview() {
    if (!validationState.hasItems) {
      toast.error('No items in trade-in list');
      return;
    }
    
    if (!validationState.hasCustomer) {
      toast.error('Please select a customer before proceeding');
      return;
    }

    if (!validationState.allHavePaymentType) {
      toast.error('Please select payment type for all items before proceeding');
      return;
    }

    if (!validationState.allHavePrice) {
      toast.error('All items must have a valid market price');
      return;
    }

    setShowReviewModal(true);
  }

  async function handleSubmitTradeIn(reviewedItems: any[], notes?: string) {
    if (!selectedCustomer || !selectedCustomer.id) {
      toast.error('Please select a customer');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const tradeInData = {
        customer_id: selectedCustomer.id,
        trade_in_date: new Date().toISOString(),
        total_value: totals.cashTotal + totals.tradeTotal,
        cash_value: totals.cashTotal,
        trade_value: totals.tradeTotal,
        notes: notes || null,
        status: 'pending' as const,
        payment_type: totals.cashTotal > 0 && totals.tradeTotal > 0 ? 'mixed' as const : 
                     totals.tradeTotal > 0 ? 'trade' as const : 'cash' as const
      };

      await insertTradeInAndItems(tradeInData, reviewedItems);
      
      toast.success('Trade-in submitted successfully! A manager will review and approve it shortly.');
      if (clearSheet) clearSheet();
      setShowReviewModal(false);
    } catch (error) {
      console.error('Error submitting trade-in:', error);
      toast.error('Failed to submit trade-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleUpdateItems(updatedItems: any[]) {
    updatedItems.forEach((item, index) => {
      onUpdateItem(index, item);
    });
  }

  function convertToTradeInItems(sheetItems: TradeInSheetItem[]) {
    return sheetItems.map(item => {
      // Calculate proper trade-in values based on game type and price
      const gameType = item.fullCardData.game;
      const basePrice = item.price;
      
      // Use the same percentages as the main calculation
      const cashPercentage = gameType === 'pokemon' ? 0.35 : 0.35; // 35% for cash
      const tradePercentage = gameType === 'pokemon' ? 0.50 : 0.50; // 50% for trade
      
      const calculatedCashValue = basePrice * cashPercentage;
      const calculatedTradeValue = basePrice * tradePercentage;
      
      return {
        card: item.fullCardData,
        quantity: item.quantity,
        price: item.price,
        condition: item.condition,
        paymentType: item.paymentType,
        cashValue: item.cashValue ?? calculatedCashValue,
        tradeValue: item.tradeValue ?? calculatedTradeValue,
        isFirstEdition: item.isFirstEdition,
        isHolo: item.isHolo
      };
    });
  }

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

      {/* Progress Indicators */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            validationState.hasCustomer ? 'bg-green-500' : 'bg-muted'
          }`}>
            {validationState.hasCustomer ? <CheckCircle className="w-4 h-4 text-white" /> : <span className="text-xs">1</span>}
          </div>
          <span className={`text-sm ${validationState.hasCustomer ? 'text-green-600' : 'text-muted-foreground'}`}>
            Customer Selected
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            validationState.allHavePaymentType ? 'bg-green-500' : 'bg-muted'
          }`}>
            {validationState.allHavePaymentType ? <CheckCircle className="w-4 h-4 text-white" /> : <span className="text-xs">2</span>}
          </div>
          <span className={`text-sm ${validationState.allHavePaymentType ? 'text-green-600' : 'text-muted-foreground'}`}>
            Payment Types Set
          </span>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {isMobile ? (
          // Mobile Card Layout
          <div className="space-y-3">
            {items.map((item, index) => (
              <MobileItemCard
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
          </div>
        ) : (
          // Desktop Table Layout
          <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
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
                    <DesktopItemRow
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
        )}
      </div>

      {/* Sticky Action Bar */}
      <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-sm border-t p-4 space-y-4">
        {/* Totals */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Value (based on selected payment types) */}
          <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-medium text-primary">Total Value</p>
              <p className="text-sm font-bold text-primary">${(totals.cashTotal + totals.tradeTotal).toFixed(2)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
            <Package className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-xs font-medium text-purple-700">Items</p>
              <p className="text-sm font-bold text-purple-800">{totals.itemCount}</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button 
          onClick={handleOpenReview}
          className={`w-full py-3 px-4 font-medium rounded-lg transition-colors ${
            validationState.isValid
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
          disabled={!validationState.isValid}
          title={!validationState.isValid ? 'Please complete all requirements' : 'Send trade-in to manager for approval'}
        >
          Review & Send for Approval
        </button>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <TradeInPriceReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          items={convertToTradeInItems(items)}
          selectedCustomer={selectedCustomer}
          onSubmit={handleSubmitTradeIn}
          onUpdateItems={handleUpdateItems}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

// Mobile Item Card Component
interface MobileItemCardProps {
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

const MobileItemCard: React.FC<MobileItemCardProps> = ({
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
    <div className="bg-card rounded-lg border p-4 space-y-3">
      {/* Card Header */}
      <div className="flex items-center space-x-3">
        {item.fullCardData.imageUrl && (
          <img 
            src={item.fullCardData.imageUrl} 
            alt={item.fullCardData.name}
            className="w-12 h-16 object-cover rounded border"
            loading="lazy"
            decoding="async"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-foreground truncate">{item.fullCardData.name}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {'setName' in item.fullCardData ? (item.fullCardData as any).setName : (item.fullCardData as any).set}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Card Controls */}
      <div className="grid grid-cols-2 gap-3">
        {/* Quantity */}
        <div>
          <label className="text-xs text-muted-foreground">Quantity</label>
          {isEditing('quantity') ? (
            <input
              type="number"
              value={tempValue}
              onChange={(e) => onTempValueChange(e.target.value)}
              onBlur={onFinishEdit}
              onKeyDown={handleKeyDown}
              className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              min="1"
            />
          ) : (
            <button
              onClick={() => onStartEdit(index, 'quantity', item.quantity)}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors text-left"
            >
              {item.quantity}
            </button>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="text-xs text-muted-foreground">Price</label>
          {isEditing('price') ? (
            <input
              type="number"
              value={tempValue}
              onChange={(e) => onTempValueChange(e.target.value)}
              onBlur={onFinishEdit}
              onKeyDown={handleKeyDown}
              className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              step="0.01"
              min="0"
            />
          ) : (
            <button
              onClick={() => onStartEdit(index, 'price', item.price)}
              className="w-full mt-1 px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors text-left flex items-center justify-between"
            >
              <span>${item.price.toFixed(2)}</span>
              <Edit3 className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Condition */}
        <div>
          <label className="text-xs text-muted-foreground">Condition</label>
          {isEditing('condition') ? (
            <select
              value={tempValue}
              onChange={(e) => onTempValueChange(e.target.value)}
              onBlur={onFinishEdit}
              onKeyDown={handleKeyDown}
              className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
              className="w-full mt-1 px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors text-left"
            >
              {getConditionLabel(item.condition)}
              {item.usedFallback && <span className="text-amber-600 ml-1" title="Price found using fallback condition">*</span>}
            </button>
          )}
        </div>

        {/* Payment Type */}
        <div>
          <label className="text-xs text-muted-foreground">Payment Type</label>
          {isEditing('paymentType') ? (
            <select
              value={tempValue}
              onChange={(e) => onTempValueChange(e.target.value)}
              onBlur={onFinishEdit}
              onKeyDown={handleKeyDown}
              className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            >
              <option value="">Select</option>
              <option value="cash">Cash</option>
              <option value="trade">Trade</option>
            </select>
          ) : (
            <button
              onClick={() => onStartEdit(index, 'paymentType', item.paymentType || '')}
              className={`w-full mt-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                item.paymentType === 'cash' ? 'bg-green-100 text-green-800' :
                item.paymentType === 'trade' ? 'bg-blue-100 text-blue-800' :
                'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {item.paymentType === 'cash' ? 'Cash' : 
               item.paymentType === 'trade' ? 'Trade' : 'Select Type'}
            </button>
          )}
        </div>
      </div>

      {/* Values */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Cash Value</p>
          <p className="text-sm font-semibold text-green-600">${effectiveCashValue?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Trade Value</p>
          <p className="text-sm font-semibold text-blue-600">${effectiveTradeValue?.toFixed(2) || '0.00'}</p>
        </div>
      </div>
    </div>
  );
};

// Desktop Item Row Component (existing SheetRow renamed)
interface DesktopItemRowProps {
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

const DesktopItemRow: React.FC<DesktopItemRowProps> = ({
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
              loading="lazy"
              decoding="async"
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
              item.paymentType === 'cash' ? 'bg-green-100 text-green-800' :
              item.paymentType === 'trade' ? 'bg-blue-100 text-blue-800' :
              'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            {item.paymentType === 'cash' ? 'Cash' : 
             item.paymentType === 'trade' ? 'Trade' : 'Select'}
          </button>
        )}
      </td>

      {/* Cash Value */}
      <td className="p-3 text-right">
        <span className="text-sm font-semibold text-green-600">
          ${effectiveCashValue?.toFixed(2) || '0.00'}
        </span>
      </td>

      {/* Trade Value */}
      <td className="p-3 text-right">
        <span className="text-sm font-semibold text-blue-600">
          ${effectiveTradeValue?.toFixed(2) || '0.00'}
        </span>
      </td>

      {/* Actions */}
      <td className="p-3 text-center">
        <button
          onClick={onRemove}
          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
};