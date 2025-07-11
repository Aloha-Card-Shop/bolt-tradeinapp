
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TradeInItem as TradeInItemType } from '../../hooks/useTradeInList';
import TradeInItem from './item-card';
import { fetchCardPrices } from '../../utils/scraper';

interface TradeInItemsListProps {
  items: TradeInItemType[];
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, item: TradeInItemType) => void;
  onValueChange: (itemId: string, values: { tradeValue: number; cashValue: number }) => void;
  onValueAdjustment?: (index: number, valueType: 'cash' | 'trade', value: number) => void;
  hideDetailedPricing?: boolean;
}

const TradeInItemsList: React.FC<TradeInItemsListProps> = ({
  items,
  onRemoveItem,
  onUpdateItem,
  onValueChange,
  onValueAdjustment,
  hideDetailedPricing = false
}) => {
  // Track which items are expanded (first item is expanded by default)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]));

  // When items change, ensure the first (newest) item is always expanded
  useEffect(() => {
    console.log('TradeInItemsList: Items updated. Current order:', items.map((item, idx) => ({ idx, name: item.card.name, id: item.card.id })));
    
    if (items.length > 0) {
      // Reset expansion state to only show the first (newest) item
      setExpandedItems(new Set([0]));
      console.log('TradeInItemsList: Set expansion state to expand only first item');
    }
  }, [items.length, items.map(item => item.card.id).join(',')]); // Include item IDs to detect reordering

  const toggleExpanded = (index: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };
  const handleConditionChange = async (i: number, cond: string) => {
    const item = items[i];
    if (!item || !cond) {
      onUpdateItem(i, { ...item, condition: cond as any });
      return;
    }
    
    // Skip price fetching for certified cards
    if (item.card.isCertified) {
      onUpdateItem(i, { ...item, condition: cond as any });
      return;
    }
    
    // First update to show loading state
    onUpdateItem(i, { 
      ...item, 
      condition: cond as any, 
      isLoadingPrice: true, 
      error: undefined 
    });
    
    try {
      console.log(`TradeInList: Fetching price for item ${i} with condition ${cond} and attributes:`, {
        isFirstEdition: item.isFirstEdition,
        isHolo: item.isHolo,
        isReverseHolo: item.isReverseHolo
      });
      
      const data = await fetchCardPrices(
        item.card.productId!,
        cond,
        item.isFirstEdition, // Ensure we use the actual current state
        item.isHolo,         // Ensure we use the actual current state
        item.card.game,
        item.isReverseHolo   // Ensure we use the actual current state
      );
      
      // Update with new values and explicitly force recalculation
      const newItem: TradeInItemType = { 
        ...item, 
        condition: cond as any, 
        price: parseFloat(data.price), 
        isLoadingPrice: false,
        paymentType: 'cash',   // Always set payment type to cash
        cashValue: undefined,  // Reset any manual values to force recalculation
        tradeValue: undefined, // Reset any manual values to force recalculation
        initialCalculation: true // Force recalculation in useItemPrice
      };
      
      onUpdateItem(i, newItem);
      console.log(`TradeInList: Updated item ${i} with price ${data.price}, reset values and forced recalculation`, newItem);
    } catch (e) {
      onUpdateItem(i, { 
        ...item, 
        isLoadingPrice: false, 
        error: (e as Error).message,
        initialCalculation: false // Don't try to recalculate if there's an error
      });
      console.error(`TradeInList: Error fetching price for item ${i}:`, e);
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const isExpanded = expandedItems.has(idx);
        
        return (
          <div key={item.card.id || `item-${idx}`} className="border border-gray-200 rounded-xl bg-white shadow-sm">
            {isExpanded ? (
              <TradeInItem
                item={item}
                index={idx}
                onRemove={onRemoveItem}
                onUpdate={onUpdateItem}
                onConditionChange={(cond) => handleConditionChange(idx, cond)}
                onValueChange={(values) => onValueChange(item.card.id || `item-${idx}`, values)}
                onValueAdjustment={onValueAdjustment ? (valueType: 'cash' | 'trade', value: number) => {
                  onValueAdjustment(idx, valueType, value);
                } : undefined}
                hideDetailedPricing={hideDetailedPricing}
              />
            ) : (
              // Collapsed view
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {item.card.imageUrl && (
                      <img 
                        src={item.card.imageUrl} 
                        alt={item.card.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">{item.card.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.card.set} • Qty: {item.quantity} • {item.condition.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-semibold text-gray-900">
                      ${item.price?.toFixed(2) || '0.00'}
                    </span>
                    <button
                      onClick={() => toggleExpanded(idx)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Expand card details"
                    >
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {isExpanded && (
              <div className="border-t border-gray-200 px-4 py-2">
                <button
                  onClick={() => toggleExpanded(idx)}
                  className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Collapse
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TradeInItemsList;
