
import { useState, useCallback } from 'react';
import { fetchCardPrices } from '../utils/scraper';
import { toast } from 'react-hot-toast';

interface UsePriceFetcherProps {
  productId?: string;
  condition: string;
  isFirstEdition: boolean;
  isHolo: boolean;
  game?: string;
  isReverseHolo?: boolean;
}

export const usePriceFetcher = ({ 
  productId, 
  condition, 
  isFirstEdition, 
  isHolo, 
  game,
  isReverseHolo 
}: UsePriceFetcherProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [price, setPrice] = useState<number>(0);
  const [isPriceUnavailable, setIsPriceUnavailable] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);
  
  const fetchPrice = useCallback(async () => {
    if (!productId || !condition) {
      return;
    }

    setIsLoading(true);
    setError(undefined);
    setIsPriceUnavailable(false);
    
    try {
      const data = await fetchCardPrices(
        productId,
        condition,
        isFirstEdition,
        isHolo,
        game,
        isReverseHolo
      );
      
      if (data.unavailable) {
        setPrice(0);
        setIsPriceUnavailable(true);
        setUsedFallback(false);
        toast.error("No price available for this card configuration");
      } else {
        setPrice(parseFloat(data.price));
        setIsPriceUnavailable(false);
        setUsedFallback(data.usedFallback || false);
        
        // Show notification if fallback condition was used
        if (data.usedFallback && data.actualCondition) {
          toast.success(`Price found using ${data.actualCondition} condition`);
        }
      }
    } catch (e) {
      setError((e as Error).message);
      setIsPriceUnavailable(false);
    } finally {
      setIsLoading(false);
    }
  }, [productId, condition, isFirstEdition, isHolo, game, isReverseHolo]);

  const updatePrice = (newPrice: number) => {
    setPrice(newPrice);
    setIsPriceUnavailable(false);
    setUsedFallback(false);
  };

  return {
    isLoading,
    error,
    price,
    isPriceUnavailable,
    usedFallback,
    fetchPrice,
    updatePrice
  };
};
