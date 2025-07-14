
import React from 'react';
import CardSearch from '../CardSearch';
import CardResults from '../CardResults';
import GradedCardResults from '../GradedCardResults';
import SavedCards from '../SavedCards';
import { TradeInSheet } from '../trade-in/TradeInSheet';
import { TradeInSheetItem } from '../../hooks/useTradeInSheet';
import { CardDetails, SavedCard } from '../../types/card';
import { Customer } from '../../hooks/useCustomers';
import { SetOption } from '../../hooks/useSetOptions';

interface DesktopLayoutProps {
  // Card search props
  cardDetails: CardDetails;
  cardType: 'raw' | 'graded';
  setCardType: (type: 'raw' | 'graded') => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setOptions: SetOption[];
  isLoadingSets: boolean;
  isSearching: boolean;
  searchInputRef: React.RefObject<HTMLInputElement>;
  potentialCardNumber: string | null;
  handleUseAsCardNumber: () => void;
  performSearch: () => void;
  isSetFiltered: boolean;
  handleShowAllSets: () => void;
  addCertificateToResults: (card: CardDetails) => void;
  handleClearResults: () => void;
  
  // Search results props
  searchResults: any[];
  gradedResults: any[];
  isGradedSearching: boolean;
  hasMoreResults: boolean;
  loadMoreResults: () => void;
  totalResults: number;
  removeCardFromResults: (cardToRemove: CardDetails) => void;
  
  // Saved cards props
  savedCards: SavedCard[];
  removeCard: (id: string) => void;
  handleCheckSavedCard: (card: SavedCard) => void;
  
  handleAddToList: (card: CardDetails | SavedCard, condition: string, price: number) => void;
  
  // Sheet props
  sheetItems: TradeInSheetItem[];
  selectedCustomer: Customer | null;
  removeItemFromSheet: (index: number) => void;
  updateSheetItem: (index: number, updates: Partial<TradeInSheetItem>) => void;
  updateMarketPrice: (index: number, price: number) => void;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  cardDetails,
  cardType,
  setCardType,
  handleInputChange,
  setOptions,
  isLoadingSets,
  isSearching,
  searchInputRef,
  potentialCardNumber,
  handleUseAsCardNumber,
  performSearch,
  isSetFiltered,
  handleShowAllSets,
  addCertificateToResults,
  handleClearResults,
  searchResults,
  gradedResults,
  isGradedSearching,
  hasMoreResults,
  loadMoreResults,
  totalResults,
  removeCardFromResults,
  savedCards,
  removeCard,
  handleCheckSavedCard,
  handleAddToList,
  // Sheet props
  sheetItems,
  selectedCustomer,
  removeItemFromSheet,
  updateSheetItem,
  updateMarketPrice
}) => {
  return (
    <div className="hidden md:grid md:grid-cols-12 md:gap-8">
      <div className="md:col-span-3 space-y-8">
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <CardSearch 
            cardDetails={cardDetails}
            onInputChange={handleInputChange}
            setOptions={setOptions}
            isLoadingSets={isLoadingSets}
            isSearching={isSearching}
            searchInputRef={searchInputRef}
            potentialCardNumber={potentialCardNumber}
            onUseAsCardNumber={handleUseAsCardNumber}
            performSearch={performSearch}
            isFiltered={isSetFiltered}
            onShowAllSets={handleShowAllSets}
            onAddCertificateToResults={addCertificateToResults}
            onClearResults={handleClearResults}
            cardType={cardType}
            onCardTypeChange={setCardType}
          />
        </div>
        
        {savedCards.length > 0 && (
          <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <SavedCards 
              savedCards={savedCards}
              onRemove={removeCard}
              onCheck={handleCheckSavedCard}
            />
          </div>
        )}
      </div>
      
      <div className="md:col-span-5">
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {cardType === 'raw' ? (
            <CardResults 
              results={searchResults}
              isLoading={isSearching}
              onAddToList={handleAddToList}
              hasMoreResults={hasMoreResults}
              loadMoreResults={loadMoreResults}
              totalResults={totalResults}
            />
          ) : (
            <GradedCardResults 
              results={gradedResults}
              isLoading={isGradedSearching}
              onAddToList={handleAddToList}
              onRemoveCard={removeCardFromResults}
            />
          )}
        </div>
      </div>

      <div className="md:col-span-4">
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 overflow-hidden sticky top-8">
          <div className="p-6">
            <TradeInSheet
              items={sheetItems}
              selectedCustomer={selectedCustomer}
              onUpdateItem={updateSheetItem}
              onRemoveItem={removeItemFromSheet}
              onMarketPriceChange={updateMarketPrice}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
