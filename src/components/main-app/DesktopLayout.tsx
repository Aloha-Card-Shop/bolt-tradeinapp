
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
  clearSheet: () => void;
  selectCustomer: (customer: Customer | null) => void;
  
  // Customer props
  customers: Customer[];
  isLoadingCustomers: boolean;
  handleCustomerCreate: (firstName: string, lastName: string, email?: string, phone?: string) => Promise<Customer>;
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
  updateMarketPrice,
  clearSheet,
  selectCustomer,
  // Customer props
  customers,
  isLoadingCustomers,
  handleCustomerCreate
}) => {
  return (
    <div className="hidden md:block space-y-8">
      {/* Top Row: Search and Results */}
      <div className="grid grid-cols-12 gap-8">
        {/* Search Column - 4 cols */}
        <div className="col-span-4">
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
        </div>
        
        {/* Results Column - 8 cols */}
        <div className="col-span-8">
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
      </div>

      {/* Bottom Row: Customer Section and Trade-in Sheet */}
      <div className="grid grid-cols-12 gap-8">
        {savedCards.length > 0 && (
          <>
            {/* Customer + Saved Cards Column - 4 cols */}
            <div className="col-span-4 space-y-8">
              <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <SavedCards 
                  savedCards={savedCards}
                  onRemove={removeCard}
                  onCheck={handleCheckSavedCard}
                />
              </div>
            </div>
            
            {/* Trade-in Sheet Column - 8 cols */}
            <div className="col-span-8">
              <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20">
                <div className="p-6 pb-0">
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
            </div>
          </>
        )}
        
        {/* Trade-in Sheet Full Width when no saved cards */}
        {savedCards.length === 0 && (
          <div className="col-span-12">
            <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20">
              <div className="p-6 pb-0">
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
          </div>
        )}
      </div>
    </div>
  );
};
