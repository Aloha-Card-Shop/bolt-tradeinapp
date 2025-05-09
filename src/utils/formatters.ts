
// Format number as currency
export const formatCurrency = (value: number | string): string => {
  if (value === null || value === undefined) {
    return '0.00';
  }
  
  // Convert string to number if needed
  let numValue: number;
  if (typeof value === 'string') {
    // Remove non-numeric characters except decimal points
    const cleanedValue = value.replace(/[^\d.-]/g, '');
    numValue = parseFloat(cleanedValue);
    
    // Return 0.00 if parsing fails
    if (isNaN(numValue)) {
      return '0.00';
    }
  } else {
    numValue = value;
  }
  
  return numValue.toFixed(2);
};

// Parse currency string back to number
export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  
  // Remove all non-numeric characters except decimal point
  const cleaned = value.replace(/[^\d.-]/g, '');
  const result = parseFloat(cleaned);
  
  return isNaN(result) ? 0 : result;
};
