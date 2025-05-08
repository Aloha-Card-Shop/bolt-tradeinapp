import React from 'react';
import { ArrowLeft, ShoppingCart, ImageOff, DollarSign, Loader2 } from 'lucide-react';
import { TradeInItem } from '../hooks/useTradeInList';

interface TradeInReviewPageProps {
  items: TradeInItem[];
  onBack: () => void;
  onProceed: () => void;
  onUpdateItem: (index: number, item: TradeInItem) => void;
}

const TradeInReviewPage: React.FC<TradeInReviewPageProps> = ({
  items,
  onBack,
  onProceed,
  onUpdateItem
}) => {
  const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to List
        </button>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <ShoppingCart className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Review Trade-In</h2>
            <p className="text-sm text-gray-600 mt-1">
              Total Value: ${totalValue.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                {item.card.imageUrl ? (
                  <img 
                    src={item.card.imageUrl} 
                    alt={item.card.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/80x112?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {item.card.name}
                  {item.card.number && (
                    <span className="ml-2 text-sm text-gray-500">#{item.card.number}</span>
                  )}
                </h3>
                {item.card.set && (
                  <p className="text-sm text-gray-600 mt-1">{item.card.set}</p>
                )}

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition
                    </label>
                    <select
                      value={item.condition}
                      onChange={(e) => onUpdateItem(index, { ...item, condition: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select condition</option>
                      <option value="near_mint">Near Mint</option>
                      <option value="lightly_played">Lightly Played</option>
                      <option value="moderately_played">Moderately Played</option>
                      <option value="heavily_played">Heavily Played</option>
                      <option value="damaged">Damaged</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => onUpdateItem(index, { ...item, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {item.isLoadingPrice ? (
                          <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-gray-400" />
                        )}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.price}
                        onChange={(e) => onUpdateItem(index, { ...item, price: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={item.isLoadingPrice}
                      />
                    </div>
                    {item.error && (
                      <p className="mt-1 text-sm text-red-600">{item.error}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateItem(index, { ...item, isFirstEdition: !item.isFirstEdition })}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                          item.isFirstEdition
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {item.isFirstEdition ? '1st Edition' : 'Unlimited'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateItem(index, { ...item, isHolo: !item.isHolo })}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                          item.isHolo
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {item.isHolo ? 'Holo' : 'Non-Holo'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            onClick={onProceed}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"
          >
            Select Customer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeInReviewPage;