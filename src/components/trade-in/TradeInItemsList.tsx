
import React from 'react';
import { TradeInItem as TradeInItemType } from '../../hooks/useTradeInList';
import TradeInItem from './item-card';
import { fetchCardPrices } from '../../utils/scraper';

interface TradeInItemsListProps {
  items: TradeInItemType[];
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, item: TradeInItemType) => void;
  onValueChange: (itemId: string, values: { tradeValue: number; cashValue: number }) => void;
  hideDetailedPricing?: boolean;
}

const TradeInItemsList: React.FC<TradeInItemsListProps> = ({
  items,
  onRemoveItem,
  onUpdateItem,
  onValueChange,
  hideDetailedPricing = false
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
      {items.map((item, idx) => (
        <TradeInItem
          key={item.card.id || `item-${idx}`}
          item={item}
          index={idx}
          onRemove={onRemoveItem}
          onUpdate={onUpdateItem}
          onConditionChange={(cond) => handleConditionChange(idx, cond)}
          onValueChange={(values) => onValueChange(item.card.id || `item-${idx}`, values)}
          hideDetailedPricing={hideDetailedPricing}
        />
      ))}
    </div>
  );
};

export default TradeInItemsList;
