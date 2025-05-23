
import React from 'react';
import { useCertificateLookup } from '../../hooks/useCertificateLookup';
import CertificateSearchInput from './certificate/CertificateSearchInput';
import CertificateError from './certificate/CertificateError';
import { AlertCircle, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface CertificateLookupProps {
  onCertificateFound: (card: any) => void;
}

const CertificateLookup: React.FC<CertificateLookupProps> = ({ onCertificateFound }) => {
  const {
    certNumber,
    setCertNumber,
    isLoading,
    error,
    handleCertLookup,
    handleKeyDown,
    certifiedCard,
    priceData
  } = useCertificateLookup();

  // Effect to add the certified card to search results when found
  React.useEffect(() => {
    if (certifiedCard) {
      // Send the certificate card to search results instead of directly to trade-in list
      onCertificateFound(certifiedCard);
    }
  }, [certifiedCard, onCertificateFound]);

  return (
    <div className="p-4 border border-gray-200 bg-white rounded-lg shadow-sm mb-4">
      <h3 className="text-lg font-medium mb-3">Certificate Lookup</h3>
      
      <CertificateSearchInput
        certNumber={certNumber}
        onCertNumberChange={setCertNumber}
        onSearch={handleCertLookup}
        onKeyDown={handleKeyDown}
        isLoading={isLoading}
      />
      
      {error && <CertificateError error={error} />}
      
      {priceData && priceData.averagePrice > 0 && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 flex items-center">
          <DollarSign className="h-4 w-4 mr-1 flex-shrink-0" />
          <div>
            <p className="font-medium">Average selling price: ${formatCurrency(priceData.averagePrice)}</p>
            <p className="text-xs">Based on {priceData.filteredSalesCount} recent sales on 130point.com</p>
          </div>
        </div>
      )}
      
      {priceData && priceData.averagePrice === 0 && priceData.searchUrl && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
          <p className="font-medium">No recent sales data found</p>
          <p className="text-xs">
            <a 
              href={priceData.searchUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View on 130point.com for more information
            </a>
          </p>
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-2 flex items-start gap-1">
        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <span>
          Enter a PSA certification number to look up graded cards. 
          Example numbers: 49392223, 82674292, 25777273
        </span>
      </div>
    </div>
  );
};

export default CertificateLookup;
