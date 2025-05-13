
import React from 'react';
import { Info } from 'lucide-react';

const ProductIdWarning: React.FC = () => {
  return (
    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 flex items-center">
      <Info className="h-4 w-4 mr-2 flex-shrink-0" />
      <p className="text-xs">
        Some cards are missing product IDs and cannot be added to your trade-in list. 
        Try searching by card number instead.
      </p>
    </div>
  );
};

export default ProductIdWarning;
