
import React from 'react';
import { useCardDetails } from '../../hooks/useCardDetails';
import { Loader2 } from 'lucide-react';

interface CharizardDetailsProps {
  setName?: string;
}

const CharizardDetails: React.FC<CharizardDetailsProps> = ({ setName }) => {
  const { cardDetails, isLoading, error } = useCardDetails('Charizard', setName);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 border rounded-lg bg-gray-50">
        <Loader2 className="h-6 w-6 text-blue-600 animate-spin mr-2" />
        <span>Loading Charizard details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 text-red-600">
        <p>Error loading Charizard details: {error}</p>
      </div>
    );
  }

  if (!cardDetails) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <p>No Charizard card found in your trade-in list.</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-red-50">
      <h3 className="text-xl font-bold text-orange-600 mb-3">{cardDetails.name}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Set: {cardDetails.set_name || 'Unknown'}</p>
          <p className="text-sm font-medium text-gray-700">Number: {cardDetails.card_number || 'Unknown'}</p>
          <p className="text-sm font-medium text-gray-700">Rarity: {cardDetails.rarity || 'Unknown'}</p>
          <p className="text-sm font-medium text-gray-700">TCG URL: {cardDetails.tcgplayer_url ? 'Available' : 'Not available'}</p>
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700">Market Price: ${cardDetails.market_price?.toFixed(2) || 'N/A'}</p>
            <p className="text-sm font-medium text-gray-700">Low Price: ${cardDetails.low_price?.toFixed(2) || 'N/A'}</p>
            <p className="text-sm font-medium text-gray-700">Mid Price: ${cardDetails.mid_price?.toFixed(2) || 'N/A'}</p>
            <p className="text-sm font-medium text-gray-700">High Price: ${cardDetails.high_price?.toFixed(2) || 'N/A'}</p>
          </div>
        </div>
        <div>
          {cardDetails.image_url ? (
            <img 
              src={cardDetails.image_url} 
              alt={cardDetails.name}
              className="w-full h-auto rounded-lg shadow-md" 
            />
          ) : (
            <div className="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">No image available</span>
            </div>
          )}
        </div>
      </div>

      {cardDetails.attributes && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Additional Attributes:</h4>
          <pre className="bg-gray-100 p-2 rounded-md text-xs overflow-x-auto">
            {JSON.stringify(cardDetails.attributes, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-4 text-center">
        <button 
          onClick={() => window.open(cardDetails.tcgplayer_url, '_blank')}
          disabled={!cardDetails.tcgplayer_url}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          View on TCGPlayer
        </button>
      </div>
    </div>
  );
};

export default CharizardDetails;
