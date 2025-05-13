import React from 'react';
import { ImageOff, PlusCircle, AlertCircle } from 'lucide-react';
import { CardDetails, SavedCard, CardNumberObject } from '../../types/card';
import { extractNumberBeforeSlash, getCardNumberString } from '../../utils/cardSearchUtils';
import { toast } from 'react-hot-toast';

interface CardResultItemProps {
  card: CardDetails;
  onAddToList: (card: CardDetails | SavedCard, price: number) => void;
  isLastElement?: boolean;
  lastCardElementRef?: (node: HTMLDivElement | null) => void;
}

const CardResultItem: React.FC<CardResultItemProps> = ({
  card,
  onAddToList,
  isLastElement = false,
  lastCardElementRef
}) => {
  const hasProductId = Boolean(card.productId);

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
  const handleAddToList = () => {
    // Enhanced product ID checking with better error messages
    if (!card.productId) {
      console.error("Card missing productId:", card);
      toast.error(`Cannot add "${card.name}" - Missing product ID`);
      return;
    }
    
    console.log("Adding card with productId:", card.productId, card);
    onAddToList(card, 0);
  };

  return (
    <div 
      className={`bg-white rounded-xl border ${hasProductId ? 'border-gray-200' : 'border-red-200'} p-4 hover:border-blue-200 hover:shadow-md transition duration-200`}
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
              {card.productId ? (
                <p className="text-xs text-gray-400 mt-1">ID: {card.productId}</p>
              ) : (
                <div className="flex items-center text-xs text-red-600 mt-1 font-medium">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Missing product ID
                </div>
              )}
            </div>
            <button
              onClick={handleAddToList}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                hasProductId 
                  ? 'text-gray-400 hover:text-green-500 hover:bg-green-50' 
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              disabled={!hasProductId}
              title={hasProductId ? "Add to trade-in list" : "Cannot add - missing product ID"}
            >
              <PlusCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardResultItem;
