
import { useState, useMemo } from 'react';

interface SoldItem {
  title: string;
  price: number;
  url: string;
  isOutlier?: boolean;
}

export const useSalesSelection = (soldItems: SoldItem[]) => {
  // Track which items are manually excluded by their index
  // Initialize with outliers excluded by default
  const [excludedItems, setExcludedItems] = useState<Set<number>>(() => {
    const outlierIndices = soldItems
      .map((item, index) => item.isOutlier ? index : -1)
      .filter(index => index !== -1);
    return new Set(outlierIndices);
  });

  // Calculate adjusted average based on user selections
  const adjustedCalculation = useMemo(() => {
    const itemsToInclude = soldItems.filter((_, index) => {
      // Exclude manually excluded items
      return !excludedItems.has(index);
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
  }, [soldItems, excludedItems]);

  // Toggle item inclusion/exclusion
  const toggleItemInclusion = (itemIndex: number) => {
    setExcludedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemIndex)) {
        newSet.delete(itemIndex);
      } else {
        newSet.add(itemIndex);
      }
      return newSet;
    });
  };

  // Include all items
  const includeAllItems = () => {
    setExcludedItems(new Set());
  };

  // Exclude all items
  const excludeAllItems = () => {
    const allIndices = soldItems.map((_, index) => index);
    setExcludedItems(new Set(allIndices));
  };

  // Reset to original calculation (exclude outliers by default)
  const resetToOriginal = () => {
    const outlierIndices = soldItems
      .map((item, index) => item.isOutlier ? index : -1)
      .filter(index => index !== -1);
    setExcludedItems(new Set(outlierIndices));
  };

  // Check if calculation has been adjusted from original
  const isAdjusted = () => {
    const originallyExcludedOutliers = new Set(
      soldItems
        .map((item, index) => item.isOutlier ? index : -1)
        .filter(index => index !== -1)
    );
    
    // Compare current exclusions with original outlier exclusions
    if (excludedItems.size !== originallyExcludedOutliers.size) return true;
    
    for (const index of excludedItems) {
      if (!originallyExcludedOutliers.has(index)) return true;
    }
    
    return false;
  };

  // Check if an item is included
  const isItemIncluded = (itemIndex: number) => {
    return !excludedItems.has(itemIndex);
  };

  return {
    adjustedCalculation,
    toggleItemInclusion,
    includeAllItems,
    excludeAllItems,
    resetToOriginal,
    isAdjusted: isAdjusted(),
    isItemIncluded
  };
};
