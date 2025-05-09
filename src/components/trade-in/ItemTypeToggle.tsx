
import React from 'react';

interface ItemTypeToggleProps {
  isFirstEdition: boolean;
  isHolo: boolean;
  isReverseHolo?: boolean;
  onToggleFirstEdition: () => void;
  onToggleHolo: () => void;
  onToggleReverseHolo?: () => void;
}

const ItemTypeToggle: React.FC<ItemTypeToggleProps> = ({
  isFirstEdition,
  isHolo,
  isReverseHolo = false,
  onToggleFirstEdition,
  onToggleHolo,
  onToggleReverseHolo
}) => {
  return (
    <div className="col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Card Type
      </label>
      <div className="grid grid-cols-3 gap-2">
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
            isHolo && !isReverseHolo
              ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          disabled={isReverseHolo}
        >
          {isHolo && !isReverseHolo ? 'Holo' : 'Non-Holo'}
        </button>
        {onToggleReverseHolo && (
          <button
            type="button"
            onClick={onToggleReverseHolo}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
              isReverseHolo
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={isHolo && !isReverseHolo}
          >
            {isReverseHolo ? 'Reverse Holo' : 'Standard'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ItemTypeToggle;
