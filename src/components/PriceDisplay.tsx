
import React from 'react';
import { TrendingUp, AlertCircle, ArrowUpRight, Heart, Loader2, DollarSign, TrendingDown, ExternalLink } from 'lucide-react';
import { PriceData, CardDetails, CardNumberObject } from '../types/card';

interface PriceDisplayProps {
  priceData: PriceData;
  cardDetails: CardDetails;
  onSave: () => void;
  getTcgPlayerUrl: () => string;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  priceData, 
  cardDetails,
  onSave,
  getTcgPlayerUrl
}) => {
  if (priceData.isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Fetching latest prices...</p>
        </div>
      </div>
    );
  }

  // Show error message with direct link to 130point if available
  if (priceData.error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error Fetching Prices</h3>
            <p className="mt-1 text-sm text-red-700">{priceData.error}</p>
            
            {priceData.directUrl && (
              <div className="mt-3">
                {priceData.manualSearchSuggested && (
                  <p className="text-sm text-amber-600 mb-2">
                    <strong>Try searching manually</strong> - Results may be available when searched directly!
                  </p>
                )}
                <a 
                  href={priceData.directUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Search on 130point.com
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!priceData.marketPrice) {
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

  // Get string representation of card number
  const cardNumber = getCardNumberString(cardDetails.number);

  // Calculate price trends (mock data for demonstration)
  const priceTrend = Math.random() > 0.5 ? 'up' : 'down';
  const trendPercentage = ((Math.random() * 5) + 1).toFixed(1);

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {cardDetails.name}
            {cardNumber && (
              <span className="ml-2 text-lg text-gray-500">#{cardNumber}</span>
            )}
          </h2>
          {cardDetails.set && (
            <p className="text-gray-600 mt-1">{cardDetails.set}</p>
          )}
        </div>
        <button 
          onClick={onSave}
          className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
          title="Save to favorites"
        >
          <Heart className="h-6 w-6" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-blue-100">Market Price</span>
            <div className={`flex items-center ${priceTrend === 'up' ? 'text-green-300' : 'text-red-300'}`}>
              {priceTrend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              {trendPercentage}%
            </div>
          </div>
          <div className="text-4xl font-bold mb-4">{priceData.marketPrice}</div>
          <div className="text-sm text-blue-100">
            Updated {new Date(priceData.lastUpdated || '').toLocaleDateString()}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-gray-600">Low</span>
            </div>
            <span className="text-lg font-semibold text-gray-800">{priceData.lowPrice}</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-gray-600">Mid</span>
            </div>
            <span className="text-lg font-semibold text-gray-800">{priceData.midPrice}</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-purple-500 mr-2" />
              <span className="text-gray-600">High</span>
            </div>
            <span className="text-lg font-semibold text-gray-800">{priceData.highPrice}</span>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-100 pt-6 flex flex-wrap gap-3">
        <a 
          href={getTcgPlayerUrl()} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200"
        >
          View on TCGPlayer
          <ArrowUpRight className="h-4 w-4 ml-2" />
        </a>

        {priceData.directUrl && (
          <a 
            href={priceData.directUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition duration-200"
          >
            Check on 130point.com
            <ExternalLink className="h-4 w-4 ml-2" />
          </a>
        )}
      </div>
    </div>
  );
};

export default PriceDisplay;
