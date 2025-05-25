
import React, { useState, useEffect } from 'react';
import { CardDetails } from '../types/card';
import { Package } from 'lucide-react';
import { SetOption } from '../hooks/useSetOptions';
import CertificateLookup from './trade-in/CertificateLookup';

// Import the smaller component pieces
import SearchGameSelect from './card-search/SearchGameSelect';
import SearchNameInput from './card-search/SearchNameInput';
import CardNumberSuggestion from './card-search/CardNumberSuggestion';
import SearchSetSelect from './card-search/SearchSetSelect';
import CardNumberInput from './card-search/CardNumberInput';
import ClearSearchButton from './card-search/ClearSearchButton';
import CardTypeSelector from './card-search/CardTypeSelector';

interface CardSearchProps {
  cardDetails: CardDetails;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setOptions: SetOption[];
  isLoadingSets: boolean;
  isSearching?: boolean;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  potentialCardNumber?: string | null;
  onUseAsCardNumber?: () => void;
  performSearch?: () => void;
  isFiltered?: boolean;
  onShowAllSets?: () => void;
  onAddCertificateToResults?: (card: CardDetails) => void;
  onClearResults?: () => void;
  cardType?: 'raw' | 'graded';
  onCardTypeChange?: (type: 'raw' | 'graded') => void;
}

const CardSearch: React.FC<CardSearchProps> = ({ 
  cardDetails, 
  onInputChange, 
  setOptions, 
  isLoadingSets,
  isSearching = false,
  searchInputRef,
  potentialCardNumber = null,
  onUseAsCardNumber = () => {},
  performSearch = () => {},
  isFiltered = false,
  onShowAllSets,
  onAddCertificateToResults,
  onClearResults,
  cardType = 'raw',
  onCardTypeChange = () => {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    setSearchTerm(cardDetails.name || '');
  }, [cardDetails.name]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    
    const event = {
      ...e,
      target: {
        ...e.target,
        name: 'name',
        value: e.target.value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(event);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  // Determine if clear button should be enabled
  const hasSearchCriteria = Boolean(
    cardDetails.name || cardDetails.number || cardDetails.set
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="ml-3 text-xl font-semibold text-gray-800">Find Cards</h2>
        </div>
        
        {onClearResults && (
          <ClearSearchButton 
            onClear={onClearResults} 
            isDisabled={!hasSearchCriteria && !isSearching}
          />
        )}
      </div>

      {/* Card Type Selector */}
      <CardTypeSelector 
        cardType={cardType} 
        onCardTypeChange={onCardTypeChange} 
      />
      
      {/* Graded Card Mode - Show Certificate Lookup */}
      {cardType === 'graded' && onAddCertificateToResults && (
        <div className="mb-6">
          <CertificateLookup onCertificateFound={onAddCertificateToResults} />
        </div>
      )}
      
      {/* Raw Card Mode - Show Traditional Search Fields */}
      {cardType === 'raw' && (
        <div className="space-y-4">
          {/* Game Selection */}
          <SearchGameSelect 
            selectedGame={cardDetails.game} 
            onChange={onInputChange} 
          />

          {/* Card Name Input - Auto-searches as user types */}
          <div className="relative">
            <SearchNameInput 
              value={searchTerm}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              inputRef={searchInputRef}
              isSearching={isSearching}
            />
            
            {/* Card number suggestion - now with enhanced detection */}
            {potentialCardNumber && (
              <CardNumberSuggestion 
                potentialCardNumber={potentialCardNumber}
                onUseAsCardNumber={onUseAsCardNumber}
                isDetecting={isSearching}
              />
            )}
          </div>
          
          {/* Set Selection */}
          <SearchSetSelect 
            selectedSet={cardDetails.set || ''}
            setOptions={setOptions}
            isLoading={isLoadingSets}
            onChange={onInputChange}
            isFiltered={isFiltered}
            onShowAllSets={onShowAllSets}
          />

          {/* Card Number Input - with improved placeholder and help text */}
          <CardNumberInput 
            cardNumber={cardDetails.number} 
            onChange={onInputChange}
            onKeyDown={handleKeyDown}
            isSearching={isSearching}
          />
        </div>
      )}
    </div>
  );
};

export default CardSearch;
