
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import PaymentTypeBadge from './PaymentTypeBadge';

interface TradeInItemCardProps {
  item: any;
}

const TradeInItemCard: React.FC<TradeInItemCardProps> = ({ item }) => {
  const isShopifySynced = !!item.shopify_product_id || item.shopify_sync_status === 'synced';
  const paymentType = item.attributes?.paymentType || 'trade';
  const value = paymentType === 'cash' 
    ? (item.attributes?.cashValue || 0) 
    : (item.attributes?.tradeValue || 0);
  const totalValue = value * item.quantity;

  // Get card background color based on sync status
  const getCardBackgroundColor = () => {
    if (isShopifySynced) return 'bg-green-50';
    return '';
  };

  return (
    <div className={`border border-gray-200 rounded-lg p-3 ${getCardBackgroundColor()}`}>
      {/* Card Name and Set */}
      <div className="mb-2">
        <h3 className="font-medium text-gray-900">{item.card_name}</h3>
        <p className="text-xs text-gray-500">
          {item.attributes?.setName || ''}
          {item.attributes?.cardNumber ? ` • ${item.attributes.cardNumber}` : ''}
        </p>
      </div>

      {/* Card Details - 2 columns on mobile */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <p className="text-xs text-gray-500">Condition</p>
          <p className="text-sm">
            {item.condition.replace(/_/g, ' ')}
            {item.usedFallback && <span className="text-amber-600 ml-1" title="Price found using fallback condition">*</span>}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Quantity</p>
          <p className="text-sm">{item.quantity}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Market Price</p>
          <p className="text-sm">${formatCurrency(item.price)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Value</p>
          <p className="text-sm">${formatCurrency(value)}</p>
        </div>
      </div>

      {/* Payment Type and Total */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <div>
          <PaymentTypeBadge paymentType={paymentType} />
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-sm font-medium">${formatCurrency(totalValue)}</p>
        </div>
      </div>

      {/* Shopify Status */}
      {isShopifySynced && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center text-green-600">
          <ShoppingCart className="h-3 w-3 mr-1" />
          <span className="text-xs">Synced to Shopify</span>
        </div>
      )}
    </div>
  );
};

export default TradeInItemCard;
