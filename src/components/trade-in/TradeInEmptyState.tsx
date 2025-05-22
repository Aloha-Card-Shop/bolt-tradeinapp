
import React, { useState } from 'react';
import CertificateLookup from './CertificateLookup';

interface TradeInEmptyStateProps {
  onCertCardFound?: (card: any, price: number) => void;
}

const TradeInEmptyState: React.FC<TradeInEmptyStateProps> = ({ onCertCardFound }) => {
  const [showCertLookup, setShowCertLookup] = useState(false);
  
  return (
    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
      <div className="max-w-md mx-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No items in trade-in list</h3>
        <p className="text-gray-600 mb-4">
          Search for cards using the search panel and add them to your trade-in list.
        </p>
        
        {!showCertLookup && onCertCardFound && (
          <button 
            onClick={() => setShowCertLookup(true)}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Have a certified card? Look it up by certificate number
          </button>
        )}
        
        {showCertLookup && onCertCardFound && (
          <div className="mt-4">
            <CertificateLookup onCardFound={onCertCardFound} />
            <button
              onClick={() => setShowCertLookup(false)}
              className="text-gray-600 hover:text-gray-800 text-sm mt-2"
            >
              Hide certificate lookup
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeInEmptyState;
