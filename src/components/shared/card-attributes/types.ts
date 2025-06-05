
export interface VariantOption {
  key: string;
  label: string;
  isActive: boolean;
  onToggle: () => void;
  color: string;
}

export interface CardAttributesProps {
  isFirstEdition: boolean;
  isHolo: boolean;
  isReverseHolo: boolean;
  onToggleFirstEdition: () => void;
  onToggleHolo: () => void;
  onToggleReverseHolo: () => void;
  isLoading?: boolean;
  availability?: import('../../../services/variantAvailabilityService').VariantAvailability;
  isLoadingAvailability?: boolean;
  isUnlimited?: boolean;
  isFirstEditionHolo?: boolean;
  isUnlimitedHolo?: boolean;
  onToggleUnlimited?: () => void;
  onToggleFirstEditionHolo?: () => void;
  onToggleUnlimitedHolo?: () => void;
}
