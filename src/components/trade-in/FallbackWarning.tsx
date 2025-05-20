
import React from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { ERROR_MESSAGES } from '../../constants/fallbackValues';

interface FallbackWarningProps {
  showWarning: boolean;
  fallbackReason?: string;
  className?: string;
  compact?: boolean;
}

const FallbackWarning: React.FC<FallbackWarningProps> = ({
  showWarning,
  fallbackReason,
  className = '',
  compact = false
}) => {
  if (!showWarning) return null;

  const getMessage = () => {
    if (!fallbackReason) return ERROR_MESSAGES.CALCULATION_FAILED;
    return ERROR_MESSAGES[fallbackReason as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.CALCULATION_FAILED;
  };

  if (compact) {
    return (
      <div className={`flex items-center text-xs text-amber-600 ${className}`}>
        <Info className="h-3 w-3 mr-1" />
        <span>Estimated value (using fallback pricing)</span>
      </div>
    );
  }

  return (
    <div className={`bg-amber-50 border border-amber-100 rounded p-2 text-amber-700 text-sm ${className}`}>
      <div className="flex items-center">
        <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
        <div>
          <p>{getMessage()}</p>
          <p className="text-xs mt-1">The displayed value is an estimate based on our standard rates.</p>
        </div>
      </div>
    </div>
  );
};

export default FallbackWarning;
