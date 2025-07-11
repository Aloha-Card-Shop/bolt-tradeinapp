
import React from 'react';
import { CardAttributesProps } from './card-attributes/types';
import { useVariantHandlers } from './card-attributes/useVariantHandlers';
import { buildAvailableVariants } from './card-attributes/buildAvailableVariants';
import VariantOption from './card-attributes/VariantOption';
import LoadingState from './card-attributes/LoadingState';
import EmptyState from './card-attributes/EmptyState';

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
  const { handleNormalToggle, handleVariantToggle } = useVariantHandlers({
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
    availableVariants: [],
    isLoading
  });

  const availableVariants = buildAvailableVariants({
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
  });

  if (isLoadingAvailability) {
    return <LoadingState />;
  }

  if (availableVariants.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        Card Type
      </label>
      <div className="space-y-2 animate-fade-in">
        {availableVariants.map((variant) => (
          <VariantOption 
            key={variant.key}
            variant={variant}
            isLoading={isLoading}
            onToggle={handleVariantToggle}
          />
        ))}
      </div>
    </div>
  );
};

export default CardAttributes;
