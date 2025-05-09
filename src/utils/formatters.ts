
// Format number as currency
export const formatCurrency = (value: number | string): string => {
  if (value === null || value === undefined) {
    return '0.00';
  }
  
  // Handle empty strings
  if (typeof value === 'string' && value.trim() === '') {
    return '0.00';
  }
  
  // Convert string to number if needed
  let numValue: number;
  if (typeof value === 'string') {
    // Remove any currency symbols, commas, and other non-numeric characters except decimal points
    const cleanedValue = value.trim().replace(/[^\d.-]/g, '');
    
    // Handle strings that only contain non-numeric characters
    if (cleanedValue === '' || cleanedValue === '.') {
      return '0.00';
    }
    
    // Parse the cleaned value
    numValue = parseFloat(cleanedValue);
    
    // Return 0.00 if parsing fails
    if (isNaN(numValue)) {
      console.warn('Could not parse currency value:', value);
      return '0.00';
    }
  } else {
    numValue = value;
  }
  
  // Check for invalid numbers after conversion
  if (isNaN(numValue) || !isFinite(numValue)) {
    console.warn('Invalid currency value after conversion:', value);
    return '0.00';
  }
  
  // Format with 2 decimal places
  return numValue.toFixed(2);
};

// Parse currency string back to number
export const parseCurrency = (value: string): number => {
  if (!value || typeof value !== 'string') return 0;
  
  try {
    // Remove all currency symbols, commas, and other non-numeric characters except decimal point
    const cleaned = value.trim().replace(/[^\d.-]/g, '');
    
    // Handle empty string or just a decimal point
    if (cleaned === '' || cleaned === '.') {
      return 0;
    }
    
    const result = parseFloat(cleaned);
    return isNaN(result) || !isFinite(result) ? 0 : result;
  } catch (error) {
    console.warn('Error parsing currency:', error, value);
    return 0;
  }
};
