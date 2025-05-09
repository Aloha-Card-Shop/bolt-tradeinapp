
import React from 'react';
import { Receipt } from 'lucide-react';
import { TradeInItem } from '../../hooks/useTradeInList';
import ReviewItemCard from './review-item-card';
import { formatCurrency } from '../../utils/formatters';

interface ReviewItemsSectionProps {
  items: TradeInItem[];
  onUpdateItem: (index: number, item: TradeInItem) => void;
  onRemoveItem: (index: number) => void;
  totalCashValue: number;
  totalTradeValue: number;
  itemValues: Array<{
    tradeValue: number;
    cashValue: number;
    itemId: string;
  }>;
}

const ReviewItemsSection: React.FC<ReviewItemsSectionProps> = ({
  items,
  onUpdateItem,
  onRemoveItem,
  totalCashValue,
  totalTradeValue,
  itemValues
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Receipt className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">Trade-In Items</h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Values:</p>
          <p className="font-medium text-gray-900">Cash: ${formatCurrency(totalCashValue)}</p>
          <p className="font-medium text-gray-900">Trade: ${formatCurrency(totalTradeValue)}</p>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => {
          const itemValue = itemValues.find(v => v.itemId === item.card.id);
          
          return (
            <ReviewItemCard
              key={index}
              item={item}
              index={index}
              onUpdateItem={onUpdateItem}
              onRemoveItem={onRemoveItem}
              itemValue={itemValue}
            />
          );
        })}

        {items.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No items in trade-in list
          </p>
        )}
      </div>
    </div>
  );
};

export default ReviewItemsSection;
