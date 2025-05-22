
import React, { useState } from 'react';
import { Search, Loader, AlertCircle, CheckCircle, KeySquare, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';

interface CertificateData {
  certNumber: string;
  cardName: string;
  grade: string;
  year?: string;
  set?: string;
  cardNumber?: string;
  playerName?: string;
  imageUrl?: string | null;
  certificationDate?: string | null;
  game: string;
}

interface CertificateLookupProps {
  onCardFound: (card: any, price: number) => void;
}

const CertificateLookup: React.FC<CertificateLookupProps> = ({ onCardFound }) => {
  const [certNumber, setCertNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);
  const [result, setResult] = useState<CertificateData | null>(null);
  const { user } = useSession();
  const userRole = user?.user_metadata?.role || 'user';

  const handleCertLookup = async () => {
    if (!certNumber.trim()) {
      toast.error('Please enter a certificate number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setConfigError(false);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('cert-lookup', {
        body: { certNumber: certNumber.trim() }
      });

      if (error) {
        console.error('Cert lookup error:', error);
        setError(error.message || 'Failed to look up certificate');
        toast.error('Certificate lookup failed');
        return;
      }

      // Handle server error response
      if (data && data.error) {
        console.error('Cert lookup API error:', data.error);
        
        // Handle configuration errors
        if (data.error === 'Configuration Error' || 
            data.error === 'Server Error' && 
            (data.message?.includes('API key not configured') || 
             data.message?.includes('not found in database') || 
             data.message?.includes('PSA API key'))) {
          setConfigError(true);
          setError(data.message || 'Certificate lookup API is not configured properly');
          toast.error('Certificate service not configured');
        } else {
          setError(data.message || data.error || 'Certificate lookup failed');
          toast.error(data.message || 'Certificate lookup failed');
        }
        return;
      }

      if (!data || !data.data) {
        setError('Certificate not found or invalid response');
        toast.error('Certificate not found');
        return;
      }

      setResult(data.data);
      
      if (data.isMockData) {
        toast.success('Certificate found (using mock data)');
      } else {
        toast.success('Certificate found!');
      }
    } catch (err) {
      console.error('Certificate lookup error:', err);
      setError('An unexpected error occurred');
      toast.error('Certificate lookup failed');
    } finally {
      setIsLoading(false);
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
        grade: result.grade,
        certificationDate: result.certificationDate
      },
      isCertified: true
    };

    // Use a default price since we don't have pricing info yet
    const defaultPrice = 0;
    
    onCardFound(cardDetails, defaultPrice);
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
          placeholder="Enter certificate number..."
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
      
      {configError && (
        <div className="p-3 bg-yellow-50 text-amber-700 rounded-lg flex items-start mb-3">
          <KeySquare className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">API Key Missing</p>
            <p className="text-sm mt-1">The PSA certificate lookup service requires configuration.</p>
            {userRole === 'admin' && (
              <Link 
                to="/admin/api-settings" 
                className="mt-2 text-sm inline-flex items-center text-amber-800 font-medium hover:text-amber-900"
              >
                Configure PSA API key 
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            )}
            {userRole !== 'admin' && (
              <p className="text-sm mt-1">Please contact your administrator.</p>
            )}
          </div>
        </div>
      )}
      
      {error && !configError && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center mb-3">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {result && (
        <div className="border border-gray-200 rounded-lg p-4 mb-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium">{result.cardName}</h4>
              <div className="text-sm text-gray-600 mt-1">
                <p>Certificate: <span className="font-medium">{result.certNumber}</span></p>
                <p>Grade: <span className="font-medium">{result.grade}</span></p>
                {result.set && <p>Set: {result.set}</p>}
                {result.year && <p>Year: {result.year}</p>}
                {result.cardNumber && <p>Card #: {result.cardNumber}</p>}
              </div>
            </div>
            {result.imageUrl && (
              <img 
                src={result.imageUrl} 
                alt={result.cardName} 
                className="w-16 h-16 object-contain rounded" 
              />
            )}
          </div>
          <button
            onClick={handleAddToTradeIn}
            className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full flex items-center justify-center"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Add to Trade-In
          </button>
        </div>
      )}
      
      <p className="text-xs text-gray-500">
        Enter a PSA certification number to look up graded cards
      </p>
    </div>
  );
};

export default CertificateLookup;
