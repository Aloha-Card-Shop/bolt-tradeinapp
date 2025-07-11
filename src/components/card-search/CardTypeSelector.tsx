
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
  const getOptionClass = (type: 'raw' | 'graded') => {
    const isSelected = cardType === type;
    return `
      toggle-option
      ${isSelected ? 'toggle-option-active' : 'toggle-option-inactive'}
      focus:ring-2 focus:ring-primary/20 focus:outline-none
    `;
  };

  return (
    <div className="mb-6 space-y-3">
      <h3 className="text-sm font-medium text-foreground">Search Mode</h3>
      <div className="grid grid-cols-2 gap-3 animate-fade-in">
        <label className="cursor-pointer">
          <input
            type="radio"
            name="cardType"
            value="raw"
            checked={cardType === 'raw'}
            onChange={() => onCardTypeChange('raw')}
            className="sr-only"
          />
          <div className={getOptionClass('raw')}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                cardType === 'raw' ? 'bg-primary/10' : 'bg-muted'
              }`}>
                <Package className={`h-5 w-5 ${
                  cardType === 'raw' ? 'text-primary' : 'text-muted-foreground'
                }`} />
              </div>
              <div>
                <span className={`font-medium ${
                  cardType === 'raw' ? 'text-primary' : 'text-foreground'
                }`}>
                  Raw Card
                </span>
                <p className="text-xs text-muted-foreground">
                  Ungraded cards
                </p>
              </div>
            </div>
            {cardType === 'raw' && (
              <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
            )}
          </div>
        </label>
        
        <label className="cursor-pointer">
          <input
            type="radio"
            name="cardType"
            value="graded"
            checked={cardType === 'graded'}
            onChange={() => onCardTypeChange('graded')}
            className="sr-only"
          />
          <div className={getOptionClass('graded')}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                cardType === 'graded' ? 'bg-primary/10' : 'bg-muted'
              }`}>
                <Award className={`h-5 w-5 ${
                  cardType === 'graded' ? 'text-primary' : 'text-muted-foreground'
                }`} />
              </div>
              <div>
                <span className={`font-medium ${
                  cardType === 'graded' ? 'text-primary' : 'text-foreground'
                }`}>
                  Graded Card
                </span>
                <p className="text-xs text-muted-foreground">
                  PSA, BGS, etc.
                </p>
              </div>
            </div>
            {cardType === 'graded' && (
              <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
            )}
          </div>
        </label>
      </div>
    </div>
  );
};

export default CardTypeSelector;
