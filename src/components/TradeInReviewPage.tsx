
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TradeInItem } from '../hooks/useTradeInList';
import { formatCurrency } from '../utils/formatters';

const TradeInReviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const items = location.state?.items || [];
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    navigate('/app', { state: { items } });
  };

  const handleContinue = () => {
    if (items.length === 0) {
      setError('No items in trade-in list');
      return;
    }
    
    navigate('/customer-select', { state: { items } });
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
            Back to App
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Review Trade-In Items</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="space-y-4">
            {items.map((item: TradeInItem, index: number) => (
              <div 
                key={index}
                className="border border-gray-200 rounded-xl p-4"
              >
                <h3 className="font-medium text-gray-900">{item.card.name}</h3>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <p>Quantity: {item.quantity}</p>
                  <p>Condition: {item.condition || 'Not specified'}</p>
                  <p>Price: ${formatCurrency(item.price)}</p>
                  <p>Type: {item.paymentType}</p>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No items in trade-in list
              </p>
            )}
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={handleContinue}
              disabled={items.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl disabled:opacity-50"
            >
              Continue to Customer Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeInReviewPage;
