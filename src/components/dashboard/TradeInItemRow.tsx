
import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { Tag, DollarSign } from 'lucide-react';

interface TradeInItemRowProps {
  item: {
    card_name: string;
    quantity: number;
    price: number;
    condition: string;
    attributes?: {
      isFirstEdition?: boolean;
      isHolo?: boolean;
      paymentType?: 'cash' | 'trade';
      cashValue?: number;
      tradeValue?: number;
    };
  };
}

const TradeInItemRow: React.FC<TradeInItemRowProps> = ({ item }) => {
  const getConditionDisplay = (condition: string) => {
    const conditionMap: Record<string, string> = {
      'near_mint': 'Near Mint',
      'lightly_played': 'Lightly Played',
      'moderately_played': 'Moderately Played',
      'heavily_played': 'Heavily Played',
      'damaged': 'Damaged'
    };
    return conditionMap[condition] || condition;
  };

  // Get the item value based on payment type from attributes
  const getItemValue = () => {
    const paymentType = item.attributes?.paymentType || 'cash';
    
    if (paymentType === 'cash' && item.attributes?.cashValue !== undefined) {
      return item.attributes.cashValue;
    } else if (paymentType === 'trade' && item.attributes?.tradeValue !== undefined) {
      return item.attributes.tradeValue;
    }
    
    // Fallback to market price if specific values aren't available
    return item.price;
  };

  const itemValue = getItemValue();
  const paymentType = item.attributes?.paymentType || 'cash';

  return (
    <tr className="border-t border-gray-200">
      <td className="px-4 py-2 text-sm">
        <p className="font-medium text-gray-900">{item.card_name}</p>
        {item.attributes?.isHolo && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">Holo</span>
        )}
        {item.attributes?.isFirstEdition && (
          <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded ml-1">1st Ed</span>
        )}
      </td>
      <td className="px-4 py-2 text-sm text-gray-700">
        {getConditionDisplay(item.condition)}
      </td>
      <td className="px-4 py-2 text-sm text-gray-700">{item.quantity}</td>
      <td className="px-4 py-2 text-sm text-gray-700">${formatCurrency(itemValue)}</td>
      <td className="px-4 py-2 text-sm">
        {paymentType === 'trade' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            <Tag className="h-3 w-3 mr-1" />
            Trade
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            <DollarSign className="h-3 w-3 mr-1" />
            Cash
          </span>
        )}
      </td>
      <td className="px-4 py-2 text-sm font-medium text-gray-900">
        ${formatCurrency(itemValue * item.quantity)}
      </td>
    </tr>
  );
};

export default TradeInItemRow;
