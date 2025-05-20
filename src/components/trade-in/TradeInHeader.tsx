
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface TradeInHeaderProps {
  itemsCount: number;
  totalCashValue: number;
  totalTradeValue: number;
}

const TradeInHeader: React.FC<TradeInHeaderProps> = ({
  itemsCount,
  totalCashValue,
  totalTradeValue
}) => {
  return (
    <div className="flex items-center space-x-3 mb-6">
      <div className="p-2 bg-green-100 rounded-lg">
        <ShoppingCart className="h-6 w-6 text-green-600" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Trade-In List</h2>
        <div className="text-sm text-gray-600 mt-1 space-x-4">
          <span>{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</span>
          <span>Cash: ${formatCurrency(totalCashValue)}</span>
          <span>Trade: ${formatCurrency(totalTradeValue)}</span>
        </div>
      </div>
    </div>
  );
};

export default TradeInHeader;
