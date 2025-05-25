
import { useState, useMemo } from 'react';

interface SoldItem {
  title: string;
  price: number;
  url: string;
  isOutlier?: boolean;
}

export const useOutlierSelection = (soldItems: SoldItem[], originalAverage: number) => {
  // Track which outliers are manually included by their index
  const [includedOutliers, setIncludedOutliers] = useState<Set<number>>(new Set());

  // Calculate adjusted average based on user selections
  const adjustedCalculation = useMemo(() => {
    const itemsToInclude = soldItems.filter((item, index) => {
      // Include non-outliers and manually selected outliers
      return !item.isOutlier || includedOutliers.has(index);
    });

    if (itemsToInclude.length === 0) {
      return {
        averagePrice: 0,
        includedCount: 0,
        excludedCount: soldItems.length
      };
    }

    const sum = itemsToInclude.reduce((acc, item) => acc + item.price, 0);
    const averagePrice = +(sum / itemsToInclude.length).toFixed(2);

    return {
      averagePrice,
      includedCount: itemsToInclude.length,
      excludedCount: soldItems.length - itemsToInclude.length
    };
  }, [soldItems, includedOutliers]);

  // Toggle outlier inclusion
  const toggleOutlierInclusion = (itemIndex: number) => {
    setIncludedOutliers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemIndex)) {
        newSet.delete(itemIndex);
      } else {
        newSet.add(itemIndex);
      }
      return newSet;
    });
  };

  // Reset to original calculation
  const resetToOriginal = () => {
    setIncludedOutliers(new Set());
  };

  // Check if calculation has been adjusted
  const isAdjusted = includedOutliers.size > 0;

  return {
    includedOutliers,
    adjustedCalculation,
    toggleOutlierInclusion,
    resetToOriginal,
    isAdjusted
  };
};
