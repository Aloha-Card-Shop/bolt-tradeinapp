
import React from 'react';
import { DollarSign, Tag } from 'lucide-react';

interface GlobalPaymentTypeSelectorProps {
  paymentType: 'cash' | 'trade';
  onSelect: (type: 'cash' | 'trade') => void;
  totalItems: number;
}

const GlobalPaymentTypeSelector: React.FC<GlobalPaymentTypeSelectorProps> = ({ 
  paymentType, 
  onSelect, 
  totalItems 
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Payment Type for All Items</h3>
        <span className="text-xs text-gray-500">{totalItems} items</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onSelect('cash')}
          className={`flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
            paymentType === 'cash'
              ? 'bg-green-100 text-green-700 border-2 border-green-300 shadow-sm'
              : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Cash Payment
        </button>
        
        <button
          type="button"
          onClick={() => onSelect('trade')}
          className={`flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
            paymentType === 'trade'
              ? 'bg-amber-100 text-amber-700 border-2 border-amber-300 shadow-sm'
              : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          <Tag className="h-4 w-4 mr-2" />
          Trade Credit
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        This will apply to all items. You can still change individual items below.
      </p>
    </div>
  );
};

export default GlobalPaymentTypeSelector;
