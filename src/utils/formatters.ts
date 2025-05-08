
// Format number as currency
export const formatCurrency = (value: number): string => {
  return value.toFixed(2);
};

// Parse currency string back to number
export const parseCurrency = (value: string): number => {
  // Remove all non-numeric characters except decimal point
  const cleaned = value.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
};
