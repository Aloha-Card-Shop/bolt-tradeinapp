
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

// Define the variant type
interface VariantOption {
  key: string;
  label: string;
  isActive: boolean;
  onToggle: () => void;
  color: string;
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
  // Create a function to handle "Normal" variant selection
  const handleNormalToggle = () => {
    // Set all variants to false to make it "normal"
    if (isFirstEdition) onToggleFirstEdition();
    if (isHolo) onToggleHolo();
    if (isReverseHolo) onToggleReverseHolo();
    if (isUnlimited) onToggleUnlimited();
    if (isFirstEditionHolo) onToggleFirstEditionHolo();
    if (isUnlimitedHolo) onToggleUnlimitedHolo();
  };

  // Check if current state is "normal" (no special attributes)
  const isNormal = !isFirstEdition && !isHolo && !isReverseHolo && !isUnlimited && !isFirstEditionHolo && !isUnlimitedHolo;

  // Only show variants that are available - with proper typing
  const availableVariants: VariantOption[] = [];
  
  // Only add "Normal" variant if it's available in the variant data
  if (availability?.normal) {
    availableVariants.push({
      key: 'normal',
      label: 'Normal',
      isActive: isNormal,
      onToggle: handleNormalToggle,
      color: 'gray-600'
    });
  }
  
  if (availability?.firstEdition) {
    availableVariants.push({
      key: 'firstEdition',
      label: '1st Edition',
      isActive: isFirstEdition,
      onToggle: onToggleFirstEdition,
      color: 'purple-600'
    });
  }
  
  if (availability?.unlimited) {
    availableVariants.push({
      key: 'unlimited',
      label: 'Unlimited',
      isActive: isUnlimited,
      onToggle: onToggleUnlimited,
      color: 'blue-600'
    });
  }
  
  if (availability?.holo) {
    availableVariants.push({
      key: 'holo',
      label: 'Holo',
      isActive: isHolo,
      onToggle: onToggleHolo,
      color: 'purple-600'
    });
  }
  
  if (availability?.reverseHolo) {
    availableVariants.push({
      key: 'reverseHolo',
      label: 'Reverse Holo',
      isActive: isReverseHolo,
      onToggle: onToggleReverseHolo,
      color: 'yellow-600'
    });
  }
  
  if (availability?.firstEditionHolo) {
    availableVariants.push({
      key: 'firstEditionHolo',
      label: '1st Edition Holo',
      isActive: isFirstEditionHolo,
      onToggle: onToggleFirstEditionHolo,
      color: 'pink-600'
    });
  }
  
  if (availability?.unlimitedHolo) {
    availableVariants.push({
      key: 'unlimitedHolo',
      label: 'Unlimited Holo',
      isActive: isUnlimitedHolo,
      onToggle: onToggleUnlimitedHolo,
      color: 'green-600'
    });
  }

  // Handle variant selection - only one can be active at a time
  const handleVariantToggle = (targetKey: string, onToggle: () => void) => {
    if (isLoading) return;
    
    // If this variant is already active, don't do anything (keep it selected)
    const targetVariant = availableVariants.find(v => v.key === targetKey);
    if (targetVariant?.isActive) return;
    
    // For non-normal variants, we need to turn off all other variants first
    if (targetKey !== 'normal') {
      // Turn off all current variants
      if (isFirstEdition && targetKey !== 'firstEdition') onToggleFirstEdition();
      if (isHolo && targetKey !== 'holo') onToggleHolo();
      if (isReverseHolo && targetKey !== 'reverseHolo') onToggleReverseHolo();
      if (isUnlimited && targetKey !== 'unlimited') onToggleUnlimited();
      if (isFirstEditionHolo && targetKey !== 'firstEditionHolo') onToggleFirstEditionHolo();
      if (isUnlimitedHolo && targetKey !== 'unlimitedHolo') onToggleUnlimitedHolo();
      
      // Small delay to ensure state updates, then toggle the target
      setTimeout(() => {
        onToggle();
      }, 50);
    } else {
      // For normal, just call the toggle function which handles turning everything off
      onToggle();
    }
  };

  if (isLoadingAvailability) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Card Type
          <Loader2 className="inline h-3 w-3 animate-spin ml-1 text-blue-600" />
        </label>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Loading variants...</span>
          </div>
        </div>
      </div>
    );
  }

  // If no variants are available, show a message
  if (availableVariants.length === 0) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Card Type
        </label>
        <div className="p-4 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-500">No variants available for this card</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Card Type
      </label>
      <div className="space-y-2">
        {availableVariants.map((variant) => (
          <div 
            key={variant.key}
            onClick={() => handleVariantToggle(variant.key, variant.onToggle)}
            className={`flex items-center justify-between p-2 rounded-lg transition-all duration-200 cursor-pointer ${
              variant.isActive 
                ? 'bg-blue-50 border-2 border-blue-200' 
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={`Select ${variant.label}`}
          >
            <span className={`text-sm font-medium ${
              variant.isActive ? 'text-blue-700' : 'text-gray-700'
            }`}>
              {variant.label}
            </span>
            {isLoading ? (
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            ) : variant.isActive ? (
              <ToggleRight className={`h-5 w-5 text-${variant.color}`} />
            ) : (
              <ToggleLeft className="h-5 w-5 text-gray-400" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardAttributes;
