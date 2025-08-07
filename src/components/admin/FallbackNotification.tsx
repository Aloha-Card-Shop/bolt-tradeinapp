
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, TrendingDown, Database, Bug, Network, FileQuestion } from 'lucide-react';
import { useTradeValue } from '../../hooks/useTradeValue';

interface FallbackNotificationProps {
  game: string;
  baseValue: number;
  compact?: boolean;
}

const FallbackNotification: React.FC<FallbackNotificationProps> = ({ 
  game, 
  baseValue,
  compact = false 
}) => {
  // Use the hook to get trade values
  const { usedFallback, fallbackReason, error, cashValue, tradeValue } = useTradeValue(game, baseValue);
  
  if (!usedFallback) return null;

  const getFallbackIcon = () => {
    switch (fallbackReason) {
      case 'NO_SETTINGS_FOUND':
        return <FileQuestion className="h-5 w-5 text-yellow-500" />;
      case 'NO_PRICE_RANGE_MATCH':
        return <TrendingDown className="h-5 w-5 text-yellow-500" />;
      case 'DATABASE_ERROR':
        return <Database className="h-5 w-5 text-yellow-500" />;
      case 'CALCULATION_ERROR':
        return <Bug className="h-5 w-5 text-yellow-500" />;
      case 'API_ERROR':
        return <Network className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };
  
  const getFallbackReasonText = () => {
    switch (fallbackReason) {
      case 'NO_SETTINGS_FOUND':
        return 'No trade settings found for this game';
      case 'NO_PRICE_RANGE_MATCH':
        return 'No matching price range configured for this value';
      case 'DATABASE_ERROR':
        return 'Database error occurred during calculation';
      case 'CALCULATION_ERROR':
        return 'Error during calculation process';
      case 'API_ERROR':
        return 'API communication error';
      case 'INVALID_INPUT':
        return 'Invalid input values provided';
      case 'METHOD_NOT_ALLOWED':
        return 'Invalid API method used';
      default:
        return 'Unknown reason';
    }
  };

  // Compact version for inline displays
  if (compact) {
    return (
      <div className="inline-flex items-center px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-700">
        <AlertTriangle className="h-3 w-3 text-yellow-500 mr-1" />
        <span>Fallback: {getFallbackReasonText()}</span>
      </div>
    );
  }
  
  // Full version with details
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-2">
      <div className="flex">
        <div className="flex-shrink-0">
          {getFallbackIcon()}
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            <span className="font-medium">Trade value fallback used!</span> Calculation for {game} value ${baseValue.toFixed(2)} 
            used default fallback values.
          </p>
          <p className="mt-1 text-xs text-yellow-700">
            Reason: {getFallbackReasonText()}
          </p>
          {error && (
            <p className="mt-1 text-xs text-yellow-600">
              Error details: {error}
            </p>
          )}
          <p className="mt-2 text-xs text-yellow-700">
            Fallback values: Cash: ${cashValue.toFixed(2)}, Trade: ${tradeValue.toFixed(2)}
          </p>
          <p className="mt-2 text-xs text-yellow-700">
            <Link to="/admin/trade-values" className="font-medium underline">
              Check trade value settings
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FallbackNotification;
