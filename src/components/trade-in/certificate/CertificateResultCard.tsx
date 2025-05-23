
import React from 'react';
import { CertificateData } from '../../../hooks/useCertificateLookup';

interface CertificateResultCardProps {
  result: CertificateData;
  onAddToTradeIn: () => void;
}

const CertificateResultCard: React.FC<CertificateResultCardProps> = ({ result, onAddToTradeIn }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-3">
      <h4 className="font-medium">{result.cardName}</h4>
      <div className="text-sm text-gray-600 mt-1">
        <p>Certificate: <span className="font-medium">{result.certNumber}</span></p>
        <p>Grade: <span className="font-medium">{result.grade}</span></p>
        {result.set && <p>Set: {result.set}</p>}
        {result.year && <p>Year: {result.year}</p>}
        {result.game && <p>Game: {result.game.charAt(0).toUpperCase() + result.game.slice(1)}</p>}
      </div>
      <button
        onClick={onAddToTradeIn}
        className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full"
      >
        Add to Trade-In
      </button>
    </div>
  );
};

export default CertificateResultCard;
