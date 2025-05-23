
import React from 'react';
import { ShoppingBagIcon, XCircleIcon } from 'lucide-react';
import { TradeInItem } from '../../hooks/useTradeInList';
import TradeInItemsList from './TradeInItemsList';
import CertificateLookup from './CertificateLookup';

interface TradeInListProps {
  items: TradeInItem[];
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, item: TradeInItem) => void;
  clearList: () => void;
}

const TradeInList: React.FC<TradeInListProps> = ({
  items,
  onRemoveItem,
  onUpdateItem,
  clearList,
}) => {
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate totals for the trade-in list
  const tradeTotalValue = items.reduce((sum, item) => {
    if (item.paymentType === 'trade' && item.tradeValue !== undefined) {
      return sum + (item.tradeValue * item.quantity);
    }
    return sum;
  }, 0);
  
  const cashTotalValue = items.reduce((sum, item) => {
    if (item.paymentType === 'cash' && item.cashValue !== undefined) {
      return sum + (item.cashValue * item.quantity);
    }
    return sum;
  }, 0);
  
  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-5">
        <div className="p-2 bg-green-100 rounded-lg">
          <ShoppingBagIcon className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Trade-In List</h2>
      </div>

      {/* Add the certificate lookup component */}
      <CertificateLookup 
        onCardFound={(card, price) => {
          // Create a new item and add it at the end of the items array
          const newItem: TradeInItem = {
            card,
            quantity: 1,
            condition: 'near_mint',
            isFirstEdition: false,
            isHolo: false,
            price,
            paymentType: null,
          };
          onUpdateItem(items.length, newItem);
        }}
      />

      {items.length > 0 ? (
        <div className="mb-6 bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-200 flex justify-between items-center">
            <div className="font-medium text-gray-700">
              {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
            </div>
            <button
              onClick={clearList}
              className="text-sm text-red-600 hover:text-red-800 flex items-center"
            >
              <XCircleIcon className="h-4 w-4 mr-1" />
              Clear all
            </button>
          </div>
          
          <TradeInItemsList 
            items={items}
            onRemoveItem={onRemoveItem}
            onUpdateItem={onUpdateItem}
            onValueChange={() => {}} // Add this empty function to satisfy the prop type
          />
          
          <div className="p-5 border-t border-gray-200">
            <div className="flex justify-between mb-2">
              <span className="text-gray-700">Cash Value:</span>
              <span className="font-semibold">${cashTotalValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Trade Value:</span>
              <span className="font-semibold">${tradeTotalValue.toFixed(2)}</span>
            </div>
            
            {items.length > 0 && (
              <div className="mt-4">
                <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="mx-auto h-16 w-16 flex items-center justify-center bg-gray-100 rounded-full mb-4">
            <ShoppingBagIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No cards added</h3>
          <p className="text-gray-500">
            Search for cards and add them to your trade-in list
          </p>
        </div>
      )}
    </div>
  );
};

export default TradeInList;
