import React from 'react';
import { TradeInItem } from '../../types/tradeIn';
import { formatCurrency } from '../../utils/formatters';
import { Tag, DollarSign, ExternalLink } from 'lucide-react';

interface TradeInItemRowProps {
  item: TradeInItem;
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

  // Get the payment type from attributes
  const paymentType = item.attributes?.paymentType || 'cash';
  
  // Calculate market value (if available) - using original price as market value
  const marketValue = item.price || 0;

  // Get the actual value given based on payment type
  const itemValue = item.attributes?.[paymentType === 'cash' ? 'cashValue' : 'tradeValue'] || item.price;
  
  // Calculate the total value
  const totalValue = itemValue * item.quantity;

  return (
    <tr className="border-t border-gray-200">
      <td className="px-4 py-2 text-sm">
        <div className="flex flex-col">
          <div className="font-medium text-gray-900 flex items-center">
            {item.card_name}
            {item.tcgplayer_url && (
              <a 
                href={item.tcgplayer_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {item.attributes?.isHolo && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">Holo</span>
            )}
            {item.attributes?.isFirstEdition && (
              <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded">1st Ed</span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-2 text-sm text-gray-700">
        {getConditionDisplay(item.condition)}
      </td>
      <td className="px-4 py-2 text-sm text-gray-700">{item.quantity}</td>
      <td className="px-4 py-2 text-sm">
        <div className="flex flex-col">
          <span className="text-gray-700">${formatCurrency(marketValue)}</span>
          <span className="text-xs text-gray-500">Market</span>
        </div>
      </td>
      <td className="px-4 py-2 text-sm">
        <div className="flex flex-col">
          <span className="text-gray-700">${formatCurrency(itemValue)}</span>
          <span className="text-xs text-gray-500">Value</span>
        </div>
      </td>
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
      <td className="px-4 py-2 text-sm font-medium text-gray-900">${formatCurrency(totalValue)}</td>
    </tr>
  );
};

export default TradeInItemRow;
