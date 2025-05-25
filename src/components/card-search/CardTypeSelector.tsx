
import React from 'react';
import { Award, Package } from 'lucide-react';

interface CardTypeSelectorProps {
  cardType: 'raw' | 'graded';
  onCardTypeChange: (type: 'raw' | 'graded') => void;
}

const CardTypeSelector: React.FC<CardTypeSelectorProps> = ({
  cardType,
  onCardTypeChange
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Search Mode</h3>
      <div className="flex gap-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="cardType"
            value="raw"
            checked={cardType === 'raw'}
            onChange={() => onCardTypeChange('raw')}
            className="sr-only"
          />
          <div className={`flex items-center px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
            cardType === 'raw' 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}>
            <Package className="h-5 w-5 mr-2" />
            <span className="font-medium">Raw Card</span>
          </div>
        </label>
        
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="cardType"
            value="graded"
            checked={cardType === 'graded'}
            onChange={() => onCardTypeChange('graded')}
            className="sr-only"
          />
          <div className={`flex items-center px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
            cardType === 'graded' 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}>
            <Award className="h-5 w-5 mr-2" />
            <span className="font-medium">Graded Card</span>
          </div>
        </label>
      </div>
    </div>
  );
};

export default CardTypeSelector;
