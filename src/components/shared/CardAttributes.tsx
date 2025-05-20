
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
        {/* First Edition toggle */}
        <div 
          onClick={isLoading ? undefined : onToggleFirstEdition}
          className={`flex items-center justify-between p-2 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'
          } bg-gray-50 rounded-lg transition-colors duration-200`}
        >
          <span className="text-sm font-medium">
            1st Edition
          </span>
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          ) : isFirstEdition ? (
            <ToggleRight className="h-5 w-5 text-purple-600" />
          ) : (
            <ToggleLeft className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        {/* Holo toggle */}
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
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          ) : isHolo && !isReverseHolo ? (
            <ToggleRight className="h-5 w-5 text-purple-600" />
          ) : (
            <ToggleLeft className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        {/* Reverse Holo toggle */}
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
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          ) : isReverseHolo ? (
            <ToggleRight className="h-5 w-5 text-yellow-600" />
          ) : (
            <ToggleLeft className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
};

export default CardAttributes;
