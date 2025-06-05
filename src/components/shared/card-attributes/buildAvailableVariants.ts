
import { VariantAvailability } from '../../../services/variantAvailabilityService';
import { VariantOption } from './types';

interface BuildAvailableVariantsProps {
  availability?: VariantAvailability;
  isFirstEdition: boolean;
  isHolo: boolean;
  isReverseHolo: boolean;
  isUnlimited: boolean;
  isFirstEditionHolo: boolean;
  isUnlimitedHolo: boolean;
  onToggleFirstEdition: () => void;
  onToggleHolo: () => void;
  onToggleReverseHolo: () => void;
  onToggleUnlimited: () => void;
  onToggleFirstEditionHolo: () => void;
  onToggleUnlimitedHolo: () => void;
  handleNormalToggle: () => void;
}

export const buildAvailableVariants = ({
  availability,
  isFirstEdition,
  isHolo,
  isReverseHolo,
  isUnlimited,
  isFirstEditionHolo,
  isUnlimitedHolo,
  onToggleFirstEdition,
  onToggleHolo,
  onToggleReverseHolo,
  onToggleUnlimited,
  onToggleFirstEditionHolo,
  onToggleUnlimitedHolo,
  handleNormalToggle
}: BuildAvailableVariantsProps): VariantOption[] => {
  const availableVariants: VariantOption[] = [];
  
  const isNormal = !isFirstEdition && !isHolo && !isReverseHolo && !isUnlimited && !isFirstEditionHolo && !isUnlimitedHolo;
  
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

  return availableVariants;
};
