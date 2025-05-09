
import React, { useEffect, useRef, useCallback } from 'react';
import { Loader2, ImageOff, PlusCircle, Search } from 'lucide-react';
import { CardDetails, SavedCard, CardNumberObject } from '../types/card';
import { extractNumberBeforeSlash, getCardNumberString } from '../utils/cardSearchUtils';
import { toast } from 'react-hot-toast';

interface CardResultsProps {
  results: CardDetails[];
  isLoading: boolean;
  onAddToList: (card: CardDetails | SavedCard, price: number) => void;
  hasMoreResults?: boolean;
  loadMoreResults?: () => void;
  totalResults?: number;
}

const CardResults: React.FC<CardResultsProps> = ({ 
  results, 
  isLoading, 
  onAddToList,
  hasMoreResults = false,
  loadMoreResults = () => {},
  totalResults = 0
}) => {
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Setup intersection observer for infinite scrolling
  const lastCardElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver(entries => {
        if (entries[0]?.isIntersecting && hasMoreResults) {
          loadMoreResults();
        }
      }, { threshold: 0.5 });
      
      if (node) observer.current.observe(node);
    },
    [isLoading, hasMoreResults, loadMoreResults]
  );

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  // Helper function to display card number with pre-slash highlight
  const renderCardNumber = (cardNumber: string | CardNumberObject | undefined) => {
    if (!cardNumber) return null;
    
    const fullNumber = getCardNumberString(cardNumber);
    const beforeSlash = extractNumberBeforeSlash(cardNumber);
    
    // If there's no slash, just show the number
    if (fullNumber === beforeSlash || !fullNumber.includes('/')) {
      return <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">#{fullNumber}</span>;
    }
    
    // Otherwise, highlight the part before the slash
    return (
      <span className="text-sm bg-gray-100 px-2 py-0.5 rounded flex items-center">
        #<span className="font-medium text-blue-600">{beforeSlash}</span>
        <span className="text-gray-500">{fullNumber.substring(beforeSlash.length)}</span>
      </span>
    );
  };

  // Function to handle adding card to the trade-in list
  const handleAddToList = (card: CardDetails) => {
    if (!card.productId) {
      console.error("Card missing productId:", card);
      toast.error("Cannot add card without a product ID");
      return;
    }
    
    console.log("Adding card with productId:", card.productId, card);
    onAddToList(card, 0);
    toast.success(`Added ${card.name} to list`);
  };

  if (isLoading && results.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Searching cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Search className="h-5 w-5 text-indigo-600" />
          </div>
          <h2 className="ml-3 text-xl font-semibold text-gray-800">
            Search Results
            {results.length > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({results.length}{totalResults > results.length ? ` of ${totalResults}` : ''})
              </span>
            )}
          </h2>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">Start typing to search for cards</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {results.map((card, index) => {
            // Add ref to last element for infinite scrolling
            const isLastElement = index === results.length - 1;
              
            return (
              <div 
                key={`${card.name}-${index}`}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 hover:shadow-md transition duration-200"
                ref={isLastElement ? lastCardElementRef : null}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {card.imageUrl ? (
                      <img 
                        src={card.imageUrl} 
                        alt={card.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
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
                            <span className="ml-2">
                              {renderCardNumber(card.number)}
                            </span>
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
                        onClick={() => handleAddToList(card)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          card.productId 
                            ? 'text-gray-400 hover:text-green-500 hover:bg-green-50' 
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        disabled={!card.productId}
                        title={card.productId ? "Add to trade-in list" : "Cannot add - missing product ID"}
                      >
                        <PlusCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Loading indicator for infinite scrolling */}
          {hasMoreResults && (
            <div 
              ref={loadMoreRef} 
              className="py-4 flex justify-center"
            >
              {isLoading && results.length > 0 ? (
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
              ) : (
                <p className="text-sm text-gray-500">Scroll for more results</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CardResults;
