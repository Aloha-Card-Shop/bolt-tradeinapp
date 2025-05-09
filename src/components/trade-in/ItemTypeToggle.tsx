
import React from 'react';
import { ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

interface ItemTypeToggleProps {
  isFirstEdition: boolean;
  isHolo: boolean;
  isReverseHolo?: boolean;
  onToggleFirstEdition: () => void;
  onToggleHolo: () => void;
  onToggleReverseHolo?: () => void;
  isLoading?: boolean;
}

const ItemTypeToggle: React.FC<ItemTypeToggleProps> = ({
  isFirstEdition,
  isHolo,
  isReverseHolo = false,
  onToggleFirstEdition,
  onToggleHolo,
  onToggleReverseHolo,
  isLoading = false
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
              className={`px-3 py-1 text-sm transition-colors ${!isFirstEdition && isFirstEdition !== undefined
                ? 'bg-white text-gray-800 shadow rounded' 
                : 'text-gray-600'}`}
              onClick={onToggleFirstEdition}
              disabled={isLoading}
            >
              Unlimited
            </button>
            <button
              className={`px-3 py-1 text-sm transition-colors ${isFirstEdition 
                ? 'bg-white text-gray-800 shadow rounded' 
                : 'text-gray-600'}`}
              onClick={onToggleFirstEdition}
              disabled={isLoading}
            >
              1st Edition
            </button>
          </div>
        </div>
        
        <div 
          onClick={!isLoading && !isReverseHolo ? onToggleHolo : undefined}
          className={`flex items-center justify-between p-2 ${
            isReverseHolo || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'
          } bg-gray-50 rounded-lg transition-colors duration-200`}
          aria-disabled={isReverseHolo || isLoading}
        >
          <span className="text-sm font-medium">
            Holo
          </span>
          {isLoading ? (
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          ) : isHolo && !isReverseHolo ? (
            <ToggleRight className="h-6 w-6 text-purple-600" />
          ) : (
            <ToggleLeft className="h-6 w-6 text-gray-400" />
          )}
        </div>
        
        {onToggleReverseHolo && (
          <div 
            onClick={!isLoading && !isHolo ? onToggleReverseHolo : undefined}
            className={`flex items-center justify-between p-2 ${
              isHolo || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'
            } bg-gray-50 rounded-lg transition-colors duration-200`}
            aria-disabled={isHolo || isLoading}
          >
            <span className="text-sm font-medium">
              Reverse Holo
            </span>
            {isLoading ? (
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            ) : isReverseHolo ? (
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
