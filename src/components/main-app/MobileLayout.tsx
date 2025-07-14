
import React from 'react';
import CardSearch from '../CardSearch';
import CardResults from '../CardResults';
import GradedCardResults from '../GradedCardResults';
import SavedCards from '../SavedCards';
import { TradeInSheet } from '../trade-in/TradeInSheet';
import { MobileNavigation } from './MobileNavigation';
import { CardDetails, SavedCard } from '../../types/card';
import { TradeInSheetItem } from '../../hooks/useTradeInSheet';
import { Customer } from '../../hooks/useCustomers';
import { SetOption } from '../../hooks/useSetOptions';

interface MobileLayoutProps {
  activeSection: 'search' | 'results' | 'tradein';
  setActiveSection: (section: 'search' | 'results' | 'tradein') => void;
  
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
  
  // Sheet props
  sheetItems: TradeInSheetItem[];
  selectedCustomer: Customer | null;
  removeItemFromSheet: (index: number) => void;
  updateSheetItem: (index: number, updates: Partial<TradeInSheetItem>) => void;
  updateMarketPrice: (index: number, price: number) => void;
  handleAddToList: (card: CardDetails | SavedCard, condition: string, price: number) => void;
  clearSheet: () => void;
  selectCustomer: (customer: Customer | null) => void;
  
  // Customer props
  customers: Customer[];
  isLoadingCustomers: boolean;
  handleCustomerCreate: (firstName: string, lastName: string, email?: string, phone?: string) => Promise<Customer>;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  activeSection,
  setActiveSection,
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
  sheetItems,
  selectedCustomer,
  removeItemFromSheet,
  updateSheetItem,
  updateMarketPrice,
  handleAddToList,
  clearSheet,
  selectCustomer,
  customers,
  isLoadingCustomers,
  handleCustomerCreate
}) => {
  return (
    <div className="md:hidden">
      {activeSection === 'search' && (
        <div className="space-y-6">
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
      )}
      
      {activeSection === 'results' && (
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
      )}
      
      {activeSection === 'tradein' && (
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-4">
            <TradeInSheet
              items={sheetItems}
              selectedCustomer={selectedCustomer}
              customers={customers}
              isLoadingCustomers={isLoadingCustomers}
              onUpdateItem={updateSheetItem}
              onRemoveItem={removeItemFromSheet}
              onMarketPriceChange={updateMarketPrice}
              onCustomerSelect={selectCustomer}
              onCustomerCreate={handleCustomerCreate}
              clearSheet={clearSheet}
            />
          </div>
        </div>
      )}
      
      <MobileNavigation 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        itemsCount={sheetItems.length}
      />
    </div>
  );
};
