
import React from 'react';
import { TradeInItem as TradeInItemType } from '../../hooks/useTradeInList';
import TradeInItem from './item-card';
import { fetchCardPrices } from '../../utils/scraper';

interface TradeInItemsListProps {
  items: TradeInItemType[];
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, item: TradeInItemType) => void;
  onValueChange: (itemId: string, values: { tradeValue: number; cashValue: number }) => void;
}

const TradeInItemsList: React.FC<TradeInItemsListProps> = ({
  items,
  onRemoveItem,
  onUpdateItem,
  onValueChange
}) => {
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
      console.log(`TradeInList: Fetching price for item ${i} with condition ${cond}`);
      const data = await fetchCardPrices(
        item.card.productId!,
        cond,
        item.isFirstEdition,
        item.isHolo,
        item.card.game,
        item.isReverseHolo
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
      {items.map((item, idx) => (
        <TradeInItem
          key={item.card.id || `item-${idx}`}
          item={item}
          index={idx}
          onRemove={onRemoveItem}
          onUpdate={onUpdateItem}
          onConditionChange={(cond) => handleConditionChange(idx, cond)}
          onValueChange={(values) => onValueChange(item.card.id || `item-${idx}`, values)}
        />
      ))}
    </div>
  );
};

export default TradeInItemsList;
