
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface TradeInItemRowProps {
  item: any; 
}

const TradeInItemRow: React.FC<TradeInItemRowProps> = ({ item }) => {
  const isShopifySynced = !!item.shopify_product_id || item.shopify_sync_status === 'synced';
  const paymentType = item.attributes?.paymentType || 'trade';
  const value = paymentType === 'cash' 
    ? (item.attributes?.cashValue || 0) 
    : (item.attributes?.tradeValue || 0);
  const totalValue = value * item.quantity;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2 border-b">
        <div className="flex items-center">
          <div>
            <p className="text-sm font-medium text-gray-900">{item.card_name}</p>
            <p className="text-xs text-gray-500">
              {item.attributes?.setName || ''}
              {item.attributes?.cardNumber ? ` • ${item.attributes.cardNumber}` : ''}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-2 border-b">
        <p className="text-sm text-gray-700">
          {item.condition.replace(/_/g, ' ')}
        </p>
      </td>
      <td className="px-4 py-2 border-b">
        <p className="text-sm text-gray-700">{item.quantity}</p>
      </td>
      <td className="px-4 py-2 border-b">
        <p className="text-sm text-gray-700">${formatCurrency(item.price)}</p>
      </td>
      <td className="px-4 py-2 border-b">
        <p className="text-sm text-gray-700">${formatCurrency(value)}</p>
      </td>
      <td className="px-4 py-2 border-b">
        <span className={`px-2 py-1 text-xs rounded-full ${
          paymentType === 'cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {paymentType === 'cash' ? 'Cash' : 'Trade'}
        </span>
      </td>
      <td className="px-4 py-2 border-b">
        <p className="text-sm text-gray-700">${formatCurrency(totalValue)}</p>
      </td>
      <td className="px-4 py-2 border-b">
        {isShopifySynced ? (
          <span 
            className="inline-flex items-center text-green-600" 
            title={`Synced to Shopify${item.shopify_synced_at ? ` on ${new Date(item.shopify_synced_at).toLocaleString()}` : ''}`}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            <span className="text-xs">Synced</span>
          </span>
        ) : (
          <span className="text-xs text-gray-500">Not synced</span>
        )}
      </td>
    </tr>
  );
};

export default TradeInItemRow;
