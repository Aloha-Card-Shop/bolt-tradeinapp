import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, ImageOff, DollarSign, Loader2 } from 'lucide-react';
import { TradeInItem } from '../hooks/useTradeInList';

const TradeInReviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const items = location.state?.items || [];
  const totalValue = items.reduce((sum: number, item: TradeInItem) => sum + (item.price * item.quantity), 0);

  const handleBack = () => {
    navigate('/app');
  };

  const handleProceed = () => {
    navigate('/trade-in/customer', { state: { items } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
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
          {items.map((item: TradeInItem, index: number) => (
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
                      <label className="block text-sm font-medium text-gray-700">
                        Condition
                      </label>
                      <p className="mt-1 text-gray-900">{item.condition}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Quantity
                      </label>
                      <p className="mt-1 text-gray-900">{item.quantity}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Price
                      </label>
                      <p className="mt-1 text-gray-900">${item.price.toFixed(2)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Total
                      </label>
                      <p className="mt-1 text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Card Type
                      </label>
                      <div className="mt-1 flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          item.isFirstEdition
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.isFirstEdition ? '1st Edition' : 'Unlimited'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          item.isHolo
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.isHolo ? 'Holo' : 'Non-Holo'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <button
              onClick={handleProceed}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"
            >
              Select Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeInReviewPage;