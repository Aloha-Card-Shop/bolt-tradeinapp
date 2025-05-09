
import React from 'react';
import { ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

interface CardAttributesProps {
  isFirstEdition: boolean;
  isHolo: boolean;
  isReverseHolo: boolean;
  onToggleFirstEdition: () => void;
  onToggleHolo: () => void;
  onToggleReverseHolo: () => void;
  isLoading?: boolean;
}

const CardAttributes: React.FC<CardAttributesProps> = ({
  isFirstEdition,
  isHolo,
  isReverseHolo,
  onToggleFirstEdition,
  onToggleHolo,
  onToggleReverseHolo,
  isLoading = false
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Card Type
      </label>
      <div className="space-y-2">
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium">Edition</div>
          <div className="flex items-center p-1 bg-gray-200 rounded-lg">
            <button 
              className={`px-3 py-1 text-sm transition-colors ${
                !isFirstEdition
                  ? 'bg-white text-gray-800 shadow rounded' 
                  : 'text-gray-600'
              }`}
              onClick={onToggleFirstEdition}
              disabled={isLoading}
              type="button"
            >
              Unlimited
            </button>
            <button
              className={`px-3 py-1 text-sm transition-colors ${
                isFirstEdition
                  ? 'bg-white text-gray-800 shadow rounded' 
                  : 'text-gray-600'
              }`}
              onClick={onToggleFirstEdition}
              disabled={isLoading}
              type="button"
            >
              1st Edition
            </button>
          </div>
        </div>
        
        <div 
          onClick={isLoading || isReverseHolo ? undefined : onToggleHolo}
          className={`flex items-center justify-between p-2 ${
            isReverseHolo || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'
          } bg-gray-50 rounded-lg transition-colors duration-200`}
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
        
        <div 
          onClick={isLoading || isHolo ? undefined : onToggleReverseHolo}
          className={`flex items-center justify-between p-2 ${
            isHolo || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'
          } bg-gray-50 rounded-lg transition-colors duration-200`}
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
      </div>
    </div>
  );
};

export default CardAttributes;
