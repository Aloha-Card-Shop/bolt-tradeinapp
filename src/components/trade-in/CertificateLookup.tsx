
import React, { useState } from 'react';
import { Search, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface CertificateData {
  certNumber: string;
  cardName: string;
  grade: string;
  year?: string;
  set?: string;
  cardNumber?: string;
  imageUrl?: string | null;
  game: string;
}

interface CertificateLookupProps {
  onCardFound: (card: any, price: number) => void;
}

const CertificateLookup: React.FC<CertificateLookupProps> = ({ onCardFound }) => {
  const [certNumber, setCertNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CertificateData | null>(null);

  const handleCertLookup = async () => {
    if (!certNumber.trim()) {
      toast.error('Please enter a certificate number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Looking up certificate:', certNumber.trim());
      const { data, error } = await supabase.functions.invoke('psa-scraper', {
        body: { certNumber: certNumber.trim() }
      });

      if (error) {
        console.error('Certificate lookup error:', error);
        setError(error.message || 'Failed to look up certificate');
        toast.error('Certificate lookup failed');
        return;
      }

      if (!data || !data.data) {
        setError('Certificate not found or invalid response');
        toast.error('Certificate not found');
        return;
      }

      setResult(data.data);
      toast.success('Certificate found!');
    } catch (err) {
      console.error('Certificate lookup error:', err);
      setError('An unexpected error occurred');
      toast.error('Certificate lookup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleCertLookup();
    }
  };

  const handleAddToTradeIn = () => {
    if (!result) return;
    
    // Convert the certificate result to the format expected by the trade-in functionality
    const cardDetails = {
      id: result.certNumber,
      name: result.cardName,
      productId: result.certNumber, // Using cert number as product ID for uniqueness
      game: result.game,
      set: result.set || 'Unknown Set',
      number: result.cardNumber || '',
      rarity: 'Certified',
      certification: {
        certNumber: result.certNumber,
        grade: result.grade
      },
      isCertified: true
    };

    // Use a default estimated price based on grade
    const gradeValue = parseFloat(result.grade) || 0;
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
    
    onCardFound(cardDetails, defaultPrice);
    toast.success('Added certified card to trade-in list');
    setResult(null);
    setCertNumber('');
  };

  return (
    <div className="p-4 border border-gray-200 bg-white rounded-lg shadow-sm mb-4">
      <h3 className="text-lg font-medium mb-3">Certificate Lookup</h3>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={certNumber}
          onChange={(e) => setCertNumber(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter PSA certificate number..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          onClick={handleCertLookup}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </button>
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center mb-3">
          <span>{error}</span>
        </div>
      )}
      
      {result && (
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
            onClick={handleAddToTradeIn}
            className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full"
          >
            Add to Trade-In
          </button>
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-2">
        Enter a PSA certification number to look up graded cards
      </p>
    </div>
  );
};

export default CertificateLookup;
