
import { useState, useEffect } from 'react';
import { getCardVariantAvailability, VariantAvailability } from '../services/variantAvailabilityService';
import { CardDetails } from '../types/card';

export const useCardVariantAvailability = (card: CardDetails) => {
  const [availability, setAvailability] = useState<VariantAvailability>({
    firstEdition: false,
    holo: false,
    reverseHolo: false,
    unlimited: false,
    firstEditionHolo: false,
    unlimitedHolo: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAvailability = async () => {
      console.log('useCardVariantAvailability: fetching for card:', {
        name: card.name,
        productId: card.productId,
        set: card.set,
        number: card.number
      });
      
      setIsLoading(true);
      try {
        const variantData = await getCardVariantAvailability(
          card.productId,
          card.name,
          card.set
        );
        console.log('useCardVariantAvailability: received data:', variantData);
        setAvailability(variantData);
      } catch (error) {
        console.error('Error fetching variant availability:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (card.name) {
      fetchAvailability();
    }
  }, [card.productId, card.name, card.set]);

  return { availability, isLoading };
};
