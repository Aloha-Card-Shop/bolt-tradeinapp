
import React from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';

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
      <div className="space-y-2">
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium">Edition</div>
          <div className="flex items-center p-1 bg-gray-200 rounded-lg">
            <button 
              className={`px-3 py-1 text-sm transition-colors ${!isFirstEdition 
                ? 'bg-white text-gray-800 shadow rounded' 
                : 'text-gray-600'}`}
              onClick={!isFirstEdition ? undefined : onToggleFirstEdition}
            >
              Unlimited
            </button>
            <button
              className={`px-3 py-1 text-sm transition-colors ${isFirstEdition 
                ? 'bg-white text-gray-800 shadow rounded' 
                : 'text-gray-600'}`}
              onClick={isFirstEdition ? undefined : onToggleFirstEdition}
            >
              1st Edition
            </button>
          </div>
        </div>
        
        <div 
          onClick={onToggleHolo}
          className={`flex items-center justify-between p-2 ${isReverseHolo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'} bg-gray-50 rounded-lg transition-colors duration-200`}
          aria-disabled={isReverseHolo}
        >
          <span className="text-sm font-medium">
            Holo
          </span>
          {isHolo && !isReverseHolo ? (
            <ToggleRight className="h-6 w-6 text-purple-600" />
          ) : (
            <ToggleLeft className="h-6 w-6 text-gray-400" />
          )}
        </div>
        
        {onToggleReverseHolo && (
          <div 
            onClick={isHolo ? undefined : onToggleReverseHolo}
            className={`flex items-center justify-between p-2 ${isHolo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'} bg-gray-50 rounded-lg transition-colors duration-200`}
            aria-disabled={isHolo}
          >
            <span className="text-sm font-medium">
              Reverse Holo
            </span>
            {isReverseHolo ? (
              <ToggleRight className="h-6 w-6 text-yellow-600" />
            ) : (
              <ToggleLeft className="h-6 w-6 text-gray-400" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemTypeToggle;
