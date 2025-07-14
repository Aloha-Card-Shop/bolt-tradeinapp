import React from 'react';
import { Loader2, DollarSign } from 'lucide-react';
import { CardDetails } from '../../types/card';
import { useCardVariantAvailability } from '../../hooks/useCardVariantAvailability';
import { buildAvailableVariants } from '../shared/card-attributes/buildAvailableVariants';
import { VariantOption } from '../shared/card-attributes/types';

interface CardVariantSelectorsProps {
  card: CardDetails;
  selectedCondition: string;
  fetchedPrice: number | undefined;
  isLoadingPrice: boolean;
  firstEditionState: boolean;
  holoState: boolean;
  reverseHoloState: boolean;
  unlimitedState: boolean;
  firstEditionHoloState: boolean;
  unlimitedHoloState: boolean;
  onVariantToggle: (variantKey: string) => void;
}

const CardVariantSelectors: React.FC<CardVariantSelectorsProps> = ({
  card,
  selectedCondition,
  fetchedPrice,
  isLoadingPrice,
  firstEditionState,
  holoState,
  reverseHoloState,
  unlimitedState,
  firstEditionHoloState,
  unlimitedHoloState,
  onVariantToggle
}) => {
  const { availability, isLoading: isLoadingAvailability } = useCardVariantAvailability(card);

  // Build available variants based on availability data
  const availableVariants: VariantOption[] = buildAvailableVariants({
    availability,
    isFirstEdition: firstEditionState,
    isHolo: holoState,
    isReverseHolo: reverseHoloState,
    isUnlimited: unlimitedState,
    isFirstEditionHolo: firstEditionHoloState,
    isUnlimitedHolo: unlimitedHoloState,
    handleNormalToggle: () => {},
    onToggleFirstEdition: () => onVariantToggle('firstEdition'),
    onToggleHolo: () => onVariantToggle('holo'),
    onToggleReverseHolo: () => onVariantToggle('reverseHolo'),
    onToggleUnlimited: () => onVariantToggle('unlimited'),
    onToggleFirstEditionHolo: () => onVariantToggle('firstEditionHolo'),
    onToggleUnlimitedHolo: () => onVariantToggle('unlimitedHolo')
  });

  // Show loading state while fetching availability
  if (isLoadingAvailability) {
    return (
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Type
        </label>
        <div className="flex items-center text-sm text-gray-600">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Loading variants...
        </div>
      </div>
    );
  }

  // Don't show anything if no variants are available
  if (availableVariants.length === 0) {
    return null;
  }

  const getVariantColor = (key: string, isActive: boolean) => {
    const colorMap: Record<string, { active: string; inactive: string }> = {
      firstEdition: {
        active: 'bg-blue-100 text-blue-700 border-blue-300',
        inactive: 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
      },
      holo: {
        active: 'bg-purple-100 text-purple-700 border-purple-300',
        inactive: 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
      },
      reverseHolo: {
        active: 'bg-green-100 text-green-700 border-green-300',
        inactive: 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
      },
      unlimited: {
        active: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        inactive: 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
      },
      firstEditionHolo: {
        active: 'bg-indigo-100 text-indigo-700 border-indigo-300',
        inactive: 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
      },
      unlimitedHolo: {
        active: 'bg-pink-100 text-pink-700 border-pink-300',
        inactive: 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
      }
    };

    return colorMap[key] ? colorMap[key][isActive ? 'active' : 'inactive'] : 'bg-gray-100 text-gray-600 border-gray-300';
  };

  const getActiveVariantLabels = () => {
    const activeLabels: string[] = [];
    availableVariants.forEach(variant => {
      if (variant.isActive) {
        activeLabels.push(variant.label);
      }
    });
    return activeLabels;
  };

  return (
    <div className="mt-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Card Type
      </label>
      <div className="flex flex-wrap gap-2">
        {availableVariants.map((variant) => (
          <button
            key={variant.key}
            onClick={() => onVariantToggle(variant.key)}
            className={`px-3 py-1 text-xs rounded-full transition-colors border ${getVariantColor(variant.key, variant.isActive)}`}
            disabled={isLoadingPrice}
            title={`Toggle ${variant.label}`}
          >
            {variant.label}
          </button>
        ))}
      </div>
      
      {/* Show fetched price for selected condition and variants */}
      <div className="mt-2">
        {isLoadingPrice ? (
          <div className="flex items-center text-sm text-gray-600">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Fetching price...
          </div>
        ) : fetchedPrice && fetchedPrice > 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-2 text-green-700">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              <span className="font-medium">Market Price: ${fetchedPrice.toFixed(2)}</span>
            </div>
            <p className="text-xs mt-1">
              {selectedCondition.replace('_', ' ')}
              {getActiveVariantLabels().length > 0 && `, ${getActiveVariantLabels().join(', ')}`}
            </p>
          </div>
        ) : selectedCondition && !isLoadingPrice ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 text-yellow-700">
            <p className="text-sm">No price available for this variant</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CardVariantSelectors;