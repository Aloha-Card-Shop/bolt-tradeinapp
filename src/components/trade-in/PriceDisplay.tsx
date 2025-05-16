
import React from 'react';
import ValueDisplay from './shared/ValueDisplay';

interface PriceDisplayProps {
  label: string;
  isLoading: boolean;
  error?: string;
  value: number | string;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ label, isLoading, error, value }) => {
  // Convert value to number if it's a string
  let numericValue: number;
  
  try {
    if (typeof value === 'number') {
      numericValue = value;
    } else if (typeof value === 'string') {
      if (value.startsWith('Error:') || value.includes('error')) {
        console.error('Price display received error value:', value);
        numericValue = 0;
      } else {
        const parsed = parseFloat(value);
        if (isNaN(parsed)) {
          console.error('Failed to parse price value:', value);
          numericValue = 0;
        } else {
          numericValue = parsed;
        }
      }
    } else {
      console.error('Price display received invalid value type:', typeof value);
      numericValue = 0;
    }
  } catch (e) {
    console.error('Error formatting price display value:', e, value);
    numericValue = 0;
  }

  return (
    <ValueDisplay
      label={label}
      value={numericValue}
      isLoading={isLoading}
      error={error}
    />
  );
};

export default PriceDisplay;
