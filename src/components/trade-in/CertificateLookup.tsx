
import React from 'react';
import { useCertificateLookup } from '../../hooks/useCertificateLookup';
import CertificateSearchInput from './certificate/CertificateSearchInput';
import CertificateError from './certificate/CertificateError';
import { AlertCircle } from 'lucide-react';
import { CardDetails } from '../../types/card';

interface CertificateLookupProps {
  onCardFound: (card: CardDetails, price: number) => void;
}

const CertificateLookup: React.FC<CertificateLookupProps> = ({ onCardFound }) => {
  const {
    certNumber,
    setCertNumber,
    isLoading,
    error,
    handleCertLookup,
    handleKeyDown,
    certifiedCard
  } = useCertificateLookup();

  // Effect to add the certified card to the results when found
  React.useEffect(() => {
    if (certifiedCard) {
      // Estimate a default price based on grade
      const gradeValue = parseFloat(certifiedCard.certification?.grade || '0');
      let defaultPrice = 0;
      
      if (gradeValue >= 9.5) {
        defaultPrice = 100; // Gem Mint estimate
      } else if (gradeValue >= 9) {
        defaultPrice = 50;  // Mint estimate
      } else if (gradeValue >= 8) {
        defaultPrice = 25;  // Near Mint estimate
      } else {
        defaultPrice = 10;  // Lower grades estimate
      }
      
      // Add the certified card to the search results
      onCardFound(certifiedCard, defaultPrice);
    }
  }, [certifiedCard, onCardFound]);

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
