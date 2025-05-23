
import React from 'react';
import { useCertificateLookup } from '../../hooks/useCertificateLookup';
import CertificateSearchInput from './certificate/CertificateSearchInput';
import CertificateResultCard from './certificate/CertificateResultCard';
import CertificateError from './certificate/CertificateError';
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
    result,
    handleCertLookup,
    handleAddToTradeIn,
    handleKeyDown
  } = useCertificateLookup(onCardFound);

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
      
      {result && <CertificateResultCard result={result} onAddToTradeIn={handleAddToTradeIn} />}
      
      <p className="text-xs text-gray-500 mt-2">
        Enter a PSA certification number to look up graded cards
      </p>
    </div>
  );
};

export default CertificateLookup;
