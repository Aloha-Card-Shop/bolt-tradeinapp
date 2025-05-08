
import React from 'react';
import { Loader2, ImageOff, PlusCircle } from 'lucide-react';
import { CardDetails, SavedCard } from '../types/card';

interface CardResultsProps {
  results: CardDetails[];
  isLoading: boolean;
  onSave?: (card: CardDetails) => void;
  onAddToList: (card: CardDetails | SavedCard, price: number) => void;
}

const CardResults: React.FC<CardResultsProps> = ({ results, isLoading, onAddToList }) => {
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Searching cards...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Start typing to search for cards</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Search Results</h2>
      <div className="grid grid-cols-1 gap-4">
        {results.map((card, index) => (
          <div 
            key={`${card.name}-${index}`}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 hover:shadow-md transition duration-200"
          >
            <div className="flex items-start space-x-4">
              <div className="w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                {card.imageUrl ? (
                  <img 
                    src={card.imageUrl} 
                    alt={card.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/96x128?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <ImageOff className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {card.name}
                      {card.number && (
                        <span className="ml-2 text-sm text-gray-500">#{card.number}</span>
                      )}
                    </h3>
                    {card.set && (
                      <p className="text-sm text-gray-600 mt-1">{card.set}</p>
                    )}
                    {card.productId && (
                      <p className="text-xs text-gray-400 mt-1">ID: {card.productId}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onAddToList(card, 0)}
                    className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors duration-200"
                    title="Add to trade-in list"
                    disabled={!card.productId}
                  >
                    <PlusCircle className="h-5 w-5" />
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

export default CardResults;
