
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
  // Add new props for additional variants
  isUnlimited?: boolean;
  isFirstEditionHolo?: boolean;
  isUnlimitedHolo?: boolean;
  onToggleUnlimited?: () => void;
  onToggleFirstEditionHolo?: () => void;
  onToggleUnlimitedHolo?: () => void;
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
  isLoadingAvailability = false,
  isUnlimited = false,
  isFirstEditionHolo = false,
  isUnlimitedHolo = false,
  onToggleUnlimited = () => {},
  onToggleFirstEditionHolo = () => {},
  onToggleUnlimitedHolo = () => {}
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

  // Debug logging for availability
  console.log('Trade-in CardAttributes: availability data received:', availability);
  console.log('Trade-in CardAttributes: isLoadingAvailability:', isLoadingAvailability);

  const isFirstEditionAvailable = availability?.firstEdition || false;
  const isHoloAvailable = availability?.holo || false;
  const isReverseHoloAvailable = availability?.reverseHolo || false;
  const isUnlimitedAvailable = availability?.unlimited || false;
  const isFirstEditionHoloAvailable = availability?.firstEditionHolo || false;
  const isUnlimitedHoloAvailable = availability?.unlimitedHolo || false;

  console.log('Trade-in CardAttributes: computed availability values:', {
    isFirstEditionAvailable,
    isHoloAvailable,
    isReverseHoloAvailable,
    isUnlimitedAvailable,
    isFirstEditionHoloAvailable,
    isUnlimitedHoloAvailable
  });

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
        
        {/* Unlimited toggle */}
        <div 
          onClick={isLoading || !isUnlimitedAvailable ? undefined : onToggleUnlimited}
          className={`flex items-center justify-between p-2 ${
            getToggleClassName(isUnlimitedAvailable, isLoading)
          } bg-gray-50 rounded-lg transition-colors duration-200`}
          title={getToggleTitle('Unlimited', isUnlimitedAvailable)}
        >
          <span className={`text-sm font-medium ${!isUnlimitedAvailable ? 'text-gray-400' : ''}`}>
            Unlimited
          </span>
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          ) : isUnlimited && isUnlimitedAvailable ? (
            <ToggleRight className="h-5 w-5 text-blue-600" />
          ) : (
            <ToggleLeft className={`h-5 w-5 ${isUnlimitedAvailable ? 'text-gray-400' : 'text-gray-300'}`} />
          )}
        </div>
        
        {/* Holo toggle */}
        <div 
          onClick={isLoading || !isHoloAvailable ? undefined : onToggleHolo}
          className={`flex items-center justify-between p-2 ${
            getToggleClassName(isHoloAvailable, isLoading)
          } bg-gray-50 rounded-lg transition-colors duration-200`}
          title={getToggleTitle('Holo', isHoloAvailable)}
        >
          <span className={`text-sm font-medium ${!isHoloAvailable ? 'text-gray-400' : ''}`}>
            Holo
          </span>
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          ) : isHolo && isHoloAvailable ? (
            <ToggleRight className="h-5 w-5 text-purple-600" />
          ) : (
            <ToggleLeft className={`h-5 w-5 ${isHoloAvailable ? 'text-gray-400' : 'text-gray-300'}`} />
          )}
        </div>
        
        {/* Reverse Holo toggle */}
        <div 
          onClick={isLoading || !isReverseHoloAvailable ? undefined : onToggleReverseHolo}
          className={`flex items-center justify-between p-2 ${
            getToggleClassName(isReverseHoloAvailable, isLoading)
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
            <ToggleLeft className={`h-5 w-5 ${isReverseHoloAvailable ? 'text-gray-400' : 'text-gray-300'}`} />
          )}
        </div>

        {/* First Edition Holo toggle */}
        <div 
          onClick={isLoading || !isFirstEditionHoloAvailable ? undefined : onToggleFirstEditionHolo}
          className={`flex items-center justify-between p-2 ${
            getToggleClassName(isFirstEditionHoloAvailable, isLoading)
          } bg-gray-50 rounded-lg transition-colors duration-200`}
          title={getToggleTitle('1st Edition Holo', isFirstEditionHoloAvailable)}
        >
          <span className={`text-sm font-medium ${!isFirstEditionHoloAvailable ? 'text-gray-400' : ''}`}>
            1st Edition Holo
          </span>
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          ) : isFirstEditionHolo && isFirstEditionHoloAvailable ? (
            <ToggleRight className="h-5 w-5 text-pink-600" />
          ) : (
            <ToggleLeft className={`h-5 w-5 ${isFirstEditionHoloAvailable ? 'text-gray-400' : 'text-gray-300'}`} />
          )}
        </div>

        {/* Unlimited Holo toggle */}
        <div 
          onClick={isLoading || !isUnlimitedHoloAvailable ? undefined : onToggleUnlimitedHolo}
          className={`flex items-center justify-between p-2 ${
            getToggleClassName(isUnlimitedHoloAvailable, isLoading)
          } bg-gray-50 rounded-lg transition-colors duration-200`}
          title={getToggleTitle('Unlimited Holo', isUnlimitedHoloAvailable)}
        >
          <span className={`text-sm font-medium ${!isUnlimitedHoloAvailable ? 'text-gray-400' : ''}`}>
            Unlimited Holo
          </span>
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          ) : isUnlimitedHolo && isUnlimitedHoloAvailable ? (
            <ToggleRight className="h-5 w-5 text-green-600" />
          ) : (
            <ToggleLeft className={`h-5 w-5 ${isUnlimitedHoloAvailable ? 'text-gray-400' : 'text-gray-300'}`} />
          )}
        </div>
      </div>
    </div>
  );
};

export default CardAttributes;
