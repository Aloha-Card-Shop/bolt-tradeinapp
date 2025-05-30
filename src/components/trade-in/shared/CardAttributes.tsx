
import React from 'react';
import { ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { VariantAvailability } from '../../../services/variantAvailabilityService';

interface CardAttributesProps {
  isFirstEdition: boolean;
  isHolo: boolean;
  isReverseHolo: boolean;
  onToggleFirstEdition: () => void;
  onToggleHolo: () => void;
  onToggleReverseHolo: () => void;
  isLoading?: boolean;
  availability?: VariantAvailability;
  isLoadingAvailability?: boolean;
}

const CardAttributes: React.FC<CardAttributesProps> = ({
  isFirstEdition,
  isHolo,
  isReverseHolo,
  onToggleFirstEdition,
  onToggleHolo,
  onToggleReverseHolo,
  isLoading = false,
  availability,
  isLoadingAvailability = false
}) => {
  const getToggleClassName = (isAvailable: boolean, isDisabled: boolean) => {
    if (isDisabled) {
      return 'opacity-50 cursor-not-allowed';
    }
    if (!isAvailable) {
      return 'opacity-30 cursor-not-allowed bg-gray-100';
    }
    return 'hover:bg-gray-100 cursor-pointer';
  };

  const getToggleTitle = (label: string, isAvailable: boolean) => {
    if (!isAvailable) {
      return `${label} variant not available for this card`;
    }
    return `Toggle ${label}`;
  };

  const isFirstEditionAvailable = availability?.firstEdition || false;
  const isHoloAvailable = availability?.holo || false;
  const isReverseHoloAvailable = availability?.reverseHolo || false;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Card Type
        {isLoadingAvailability && (
          <Loader2 className="inline h-3 w-3 animate-spin ml-1 text-blue-600" />
        )}
      </label>
      <div className="space-y-2">
        {/* First Edition toggle */}
        <div 
          onClick={isLoading || !isFirstEditionAvailable ? undefined : onToggleFirstEdition}
          className={`flex items-center justify-between p-2 ${
            getToggleClassName(isFirstEditionAvailable, isLoading)
          } bg-gray-50 rounded-lg transition-colors duration-200`}
          title={getToggleTitle('1st Edition', isFirstEditionAvailable)}
        >
          <span className={`text-sm font-medium ${!isFirstEditionAvailable ? 'text-gray-400' : ''}`}>
            1st Edition
          </span>
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          ) : isFirstEdition && isFirstEditionAvailable ? (
            <ToggleRight className="h-5 w-5 text-purple-600" />
          ) : (
            <ToggleLeft className={`h-5 w-5 ${isFirstEditionAvailable ? 'text-gray-400' : 'text-gray-300'}`} />
          )}
        </div>
        
        {/* Holo toggle */}
        <div 
          onClick={isLoading || isReverseHolo || !isHoloAvailable ? undefined : onToggleHolo}
          className={`flex items-center justify-between p-2 ${
            getToggleClassName(isHoloAvailable, isReverseHolo || isLoading)
          } bg-gray-50 rounded-lg transition-colors duration-200`}
          title={getToggleTitle('Holo', isHoloAvailable)}
        >
          <span className={`text-sm font-medium ${!isHoloAvailable ? 'text-gray-400' : ''}`}>
            Holo
          </span>
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          ) : isHolo && !isReverseHolo && isHoloAvailable ? (
            <ToggleRight className="h-5 w-5 text-purple-600" />
          ) : (
            <ToggleLeft className={`h-5 w-5 ${isHoloAvailable && !isReverseHolo ? 'text-gray-400' : 'text-gray-300'}`} />
          )}
        </div>
        
        {/* Reverse Holo toggle */}
        <div 
          onClick={isLoading || isHolo || !isReverseHoloAvailable ? undefined : onToggleReverseHolo}
          className={`flex items-center justify-between p-2 ${
            getToggleClassName(isReverseHoloAvailable, isHolo || isLoading)
          } bg-gray-50 rounded-lg transition-colors duration-200`}
          title={getToggleTitle('Reverse Holo', isReverseHoloAvailable)}
        >
          <span className={`text-sm font-medium ${!isReverseHoloAvailable ? 'text-gray-400' : ''}`}>
            Reverse Holo
          </span>
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          ) : isReverseHolo && isReverseHoloAvailable ? (
            <ToggleRight className="h-5 w-5 text-yellow-600" />
          ) : (
            <ToggleLeft className={`h-5 w-5 ${isReverseHoloAvailable && !isHolo ? 'text-gray-400' : 'text-gray-300'}`} />
          )}
        </div>
      </div>
    </div>
  );
};

export default CardAttributes;
