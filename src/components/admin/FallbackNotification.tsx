
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTradeValue } from '../../hooks/useTradeValue';

interface FallbackNotificationProps {
  game: string;
  baseValue: number;
}

const FallbackNotification: React.FC<FallbackNotificationProps> = ({ game, baseValue }) => {
  // Use the hook but disable automatic toasts
  const { usedFallback, fallbackReason } = useTradeValue(game, baseValue, false);
  
  if (!usedFallback) return null;
  
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
      default:
        return 'Unknown reason';
    }
  };
  
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-2">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            <span className="font-medium">Trade value fallback used!</span> Calculation for {game} value ${baseValue} 
            used default fallback values.
          </p>
          <p className="mt-1 text-xs text-yellow-700">
            Reason: {getFallbackReasonText()}
          </p>
          <p className="mt-2 text-xs text-yellow-700">
            <a href="/admin/trade-values" className="font-medium underline">
              Check trade value settings
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FallbackNotification;
