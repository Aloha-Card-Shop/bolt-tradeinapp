
import React from 'react';

interface ItemTypeToggleProps {
  isFirstEdition: boolean;
  isHolo: boolean;
  onToggleFirstEdition: () => void;
  onToggleHolo: () => void;
}

const ItemTypeToggle: React.FC<ItemTypeToggleProps> = ({ 
  isFirstEdition, 
  isHolo, 
  onToggleFirstEdition, 
  onToggleHolo 
}) => {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={onToggleFirstEdition}
          className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
            isFirstEdition
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isFirstEdition ? '1st Edition' : 'Unlimited'}
        </button>
        <button
          type="button"
          onClick={onToggleHolo}
          className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
            isHolo
              ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isHolo ? 'Holo' : 'Non-Holo'}
        </button>
      </div>
    </div>
  );
};

export default ItemTypeToggle;
