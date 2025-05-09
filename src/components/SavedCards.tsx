
import React from 'react';
import { Trash2, RefreshCw, BookmarkIcon } from 'lucide-react';
import { SavedCard, CardNumberObject } from '../types/card';

interface SavedCardsProps {
  savedCards: SavedCard[];
  onRemove: (id: string) => void;
  onCheck: (card: SavedCard) => void;
}

const SavedCards: React.FC<SavedCardsProps> = ({ 
  savedCards, 
  onRemove, 
  onCheck 
}) => {
  if (savedCards.length === 0) {
    return null;
  }

  // Helper function to safely get string from card number
  const getCardNumberString = (cardNumber: string | CardNumberObject | undefined): string => {
    if (!cardNumber) return '';
    
    if (typeof cardNumber === 'object') {
      return cardNumber.displayName || cardNumber.value || '';
    }
    
    return cardNumber;
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <BookmarkIcon className="h-6 w-6 text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Saved Cards</h2>
      </div>
      
      <div className="space-y-4">
        {savedCards.map(card => (
          <div 
            key={card.id} 
            className="group relative bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-md transition duration-200"
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {card.name}
                    {card.number && (
                      <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        #{getCardNumberString(card.number)}
                      </span>
                    )}
                  </h3>
                  {card.set && (
                    <p className="text-sm text-gray-600 truncate mt-1">{card.set}</p>
                  )}
                  <div className="mt-2 flex items-baseline">
                    <span className="text-sm text-gray-500">Last Price:</span>
                    <span className="ml-2 text-base font-semibold text-blue-600">
                      {card.lastPrice || 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onCheck(card)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    title="Check current price"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={() => onRemove(card.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    title="Remove from saved cards"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedCards;
