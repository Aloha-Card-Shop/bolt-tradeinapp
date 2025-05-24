
import React from 'react';
import { useCertificateLookup } from '../../hooks/useCertificateLookup';
import CertificateSearchInput from './certificate/CertificateSearchInput';
import CertificateError from './certificate/CertificateError';
import { AlertCircle, ExternalLink } from 'lucide-react';

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
      
      {/* Only show certificate lookup errors, not price lookup errors */}
      {error && <CertificateError error={error} />}
      
      {/* Show 130point.com search link if available even when no price found */}
      {priceData && priceData.searchUrl && !priceData.filteredSalesCount && (
        <div className="mt-3 text-sm">
          <a 
            href={priceData.searchUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>View prices on 130point.com</span>
            <ExternalLink className="ml-1 h-3.5 w-3.5" />
          </a>
          <p className="text-xs text-gray-500 mt-1">
            No recent sales found through automatic search, but you can check manually
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
