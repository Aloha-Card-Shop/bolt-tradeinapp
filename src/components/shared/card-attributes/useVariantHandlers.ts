
import { useCallback } from 'react';
import { VariantOption } from './types';

interface UseVariantHandlersProps {
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
  availableVariants: VariantOption[];
  isLoading: boolean;
}

export const useVariantHandlers = ({
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
  availableVariants,
  isLoading
}: UseVariantHandlersProps) => {
  const handleNormalToggle = useCallback(() => {
    if (isFirstEdition) onToggleFirstEdition();
    if (isHolo) onToggleHolo();
    if (isReverseHolo) onToggleReverseHolo();
    if (isUnlimited) onToggleUnlimited();
    if (isFirstEditionHolo) onToggleFirstEditionHolo();
    if (isUnlimitedHolo) onToggleUnlimitedHolo();
  }, [
    isFirstEdition, isHolo, isReverseHolo, isUnlimited, isFirstEditionHolo, isUnlimitedHolo,
    onToggleFirstEdition, onToggleHolo, onToggleReverseHolo, onToggleUnlimited, onToggleFirstEditionHolo, onToggleUnlimitedHolo
  ]);

  const handleVariantToggle = useCallback((targetKey: string, onToggle: () => void) => {
    if (isLoading) return;
    
    const targetVariant = availableVariants.find(v => v.key === targetKey);
    if (targetVariant?.isActive) return;
    
    if (targetKey !== 'normal') {
      if (isFirstEdition && targetKey !== 'firstEdition') onToggleFirstEdition();
      if (isHolo && targetKey !== 'holo') onToggleHolo();
      if (isReverseHolo && targetKey !== 'reverseHolo') onToggleReverseHolo();
      if (isUnlimited && targetKey !== 'unlimited') onToggleUnlimited();
      if (isFirstEditionHolo && targetKey !== 'firstEditionHolo') onToggleFirstEditionHolo();
      if (isUnlimitedHolo && targetKey !== 'unlimitedHolo') onToggleUnlimitedHolo();
      
      setTimeout(() => {
        onToggle();
      }, 50);
    } else {
      onToggle();
    }
  }, [
    isLoading, availableVariants, isFirstEdition, isHolo, isReverseHolo, isUnlimited, isFirstEditionHolo, isUnlimitedHolo,
    onToggleFirstEdition, onToggleHolo, onToggleReverseHolo, onToggleUnlimited, onToggleFirstEditionHolo, onToggleUnlimitedHolo
  ]);

  return { handleNormalToggle, handleVariantToggle };
};
