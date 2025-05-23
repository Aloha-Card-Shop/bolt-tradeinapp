
import React from 'react';
import { CertificateData } from '../../../hooks/useCertificateLookup';
import { ExternalLink } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

interface CertificateResultCardProps {
  result: CertificateData;
  priceData?: {
    averagePrice: number;
    salesCount: number;
    filteredSalesCount: number;
    searchUrl: string;
  };
}

const CertificateResultCard: React.FC<CertificateResultCardProps> = ({ result, priceData }) => {
  return (
    <div className="mt-4 mb-2 p-4 border border-blue-200 bg-blue-50 rounded-lg">
      <h4 className="font-semibold text-blue-800">{result.cardName}</h4>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
        <div>
          <p className="text-xs text-blue-700">Certificate Number</p>
          <p className="font-mono">{result.certNumber}</p>
        </div>
        
        <div>
          <p className="text-xs text-blue-700">Grade</p>
          <p className="font-semibold">{result.grade}</p>
        </div>
        
        {result.set && (
          <div>
            <p className="text-xs text-blue-700">Set</p>
            <p>{result.set}</p>
          </div>
        )}
        
        {result.cardNumber && (
          <div>
            <p className="text-xs text-blue-700">Card Number</p>
            <p>{result.cardNumber}</p>
          </div>
        )}
        
        {result.year && (
          <div>
            <p className="text-xs text-blue-700">Year</p>
            <p>{result.year}</p>
          </div>
        )}
        
        {result.game && (
          <div>
            <p className="text-xs text-blue-700">Game</p>
            <p>{result.game}</p>
          </div>
        )}
      </div>
      
      {result.imageUrl && (
        <div className="mt-3">
          <img 
            src={result.imageUrl} 
            alt={`PSA ${result.grade} ${result.cardName}`}
            className="max-h-40 mx-auto object-contain"
          />
        </div>
      )}
      
      {priceData && (
        <div className="mt-3">
          {priceData.averagePrice > 0 ? (
            <div className="flex flex-col">
              <p className="font-medium text-green-700">
                Average Price: ${formatCurrency(priceData.averagePrice)}
              </p>
              <p className="text-xs text-blue-700">
                Based on {priceData.filteredSalesCount} recent sales
              </p>
              <a
                href={priceData.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center mt-1"
              >
                View on 130point.com <ExternalLink className="h-3 w-3 ml-0.5" />
              </a>
            </div>
          ) : (
            <div className="mt-2">
              <a
                href={priceData.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center"
              >
                Check prices on 130point.com <ExternalLink className="h-4 w-4 ml-0.5" />
              </a>
            </div>
          )}
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-3">
        This card has been verified as a PSA graded card.
      </p>
    </div>
  );
};

export default CertificateResultCard;
