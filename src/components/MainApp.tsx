import React from 'react';
import { DatabaseIcon, Sparkles, Menu } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import CardSearch from './CardSearch';
import CardResults from './CardResults';
import GradedCardResults from './GradedCardResults';
import SavedCards from './SavedCards';
import TradeInList from './trade-in/TradeInList';
import { useCardSearch } from '../hooks/useCardSearch';
import { useGradedCardSearch } from '../hooks/useGradedCardSearch';
import { useSavedCards } from '../hooks/useSavedCards';
import { useTradeInListWithCustomer } from '../hooks/useTradeInListWithCustomer';
import { useCustomers } from '../hooks/useCustomers';
import TradeInListWithCustomer from './trade-in/TradeInListWithCustomer';
import { CardDetails, SavedCard } from '../types/card';
import { toast } from 'react-hot-toast';
import { useMediaQuery } from '../hooks/useMediaQuery';

function MainApp() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activeSection, setActiveSection] = React.useState<'search' | 'results' | 'tradein'>('search');
  
  // Raw card search hook
  const { 
    cardDetails, 
    cardType,
    setCardType,
    searchResults, 
    setOptions, 
    isLoadingSets, 
    isSearching, 
    potentialCardNumber,
    handleInputChange, 
    resetSearch,
    searchInputRef,
    hasMoreResults,
    loadMoreResults,
    totalResults,
    handleUseAsCardNumber,
    performSearch,
    isSetFiltered,
    handleShowAllSets,
    clearSearchResults
  } = useCardSearch();

  // Graded card search hook
  const {
    gradedResults,
    isSearching: isGradedSearching,
    addCertificateToResults,
    clearGradedResults
  } = useGradedCardSearch();
  
  const { savedCards, removeCard } = useSavedCards();
  const { items, selectedCustomer, addItem, removeItem, updateItem, clearList, selectCustomer } = useTradeInListWithCustomer();
  const { customers, isLoading: isLoadingCustomers, createCustomer } = useCustomers();

  const handleCheckSavedCard = (card: SavedCard) => {
    const event = {
      target: { name: 'name', value: card.name }
    } as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(event);
    
    // Also trigger a search when clicking a saved card
    setTimeout(performSearch, 100);
    
    // On mobile, switch to results view after search
    if (isMobile) {
      setActiveSection('results');
    }
  };

  const handleAddToList = (card: CardDetails | SavedCard, price: number) => {
    // Enhanced productId validation
    if (!card.productId) {
      console.error(`Cannot add ${card.name} - Card has no productId`, card);
      toast.error(`Cannot add ${card.name || 'card'} - Missing product ID`);
      return;
    }
    
    // Additional validation to ensure productId is a valid string
    const productId = String(card.productId);
    if (productId === 'undefined' || productId === 'null' || productId === '') {
      console.error(`Invalid product ID for ${card.name}:`, productId);
      toast.error(`Cannot add ${card.name || 'card'} - Invalid product ID`);
      return;
    }
    
    // Create a new card object with the validated productId
    const cardToAdd = {
      ...card,
      productId: productId,
    };
    
    addItem(cardToAdd, price);
    resetSearch(); // Reset search after adding card
    toast.success(`Added ${card.name} to trade-in list`);
    
    // On mobile, switch to trade-in view after adding card
    if (isMobile) {
      setActiveSection('tradein');
    }
  };

  // Determine which clear function to use based on card type
  const handleClearResults = () => {
    if (cardType === 'graded') {
      clearGradedResults();
    } else {
      clearSearchResults();
    }
  };

  // Mobile navigation tabs
  const renderMobileNavigation = () => {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30">
        <button 
          className={`flex-1 py-3 flex flex-col items-center ${activeSection === 'search' ? 'text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveSection('search')}
        >
          <DatabaseIcon className="h-5 w-5 mb-1" />
          <span className="text-xs">Search</span>
        </button>
        <button 
          className={`flex-1 py-3 flex flex-col items-center ${activeSection === 'results' ? 'text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveSection('results')}
        >
          <Menu className="h-5 w-5 mb-1" />
          <span className="text-xs">Results</span>
        </button>
        <button 
          className={`flex-1 py-3 flex flex-col items-center ${activeSection === 'tradein' ? 'text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveSection('tradein')}
        >
          <Sparkles className="h-5 w-5 mb-1" />
          <span className="text-xs">Trade-In</span>
          {items.length > 0 && (
            <span className="absolute top-2 right-1/3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {items.length}
            </span>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-16 md:pb-0">
      <Toaster position="top-center" />
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg relative overflow-hidden mt-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none"></div>
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <div className="p-2 md:p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <DatabaseIcon className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold tracking-tight">Aloha Card Shop</h1>
                <p className="text-sm md:text-base text-blue-100 mt-1">Trading Card Price Tracker</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-yellow-300" />
              <span className="text-sm font-medium">Real-time Market Prices</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-12">
        {/* Desktop Layout */}
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
              {/* Conditionally render results based on card type */}
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
                />
              )}
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 overflow-hidden sticky top-8">
              <TradeInListWithCustomer 
                items={items}
                selectedCustomer={selectedCustomer}
                customers={customers}
                isLoadingCustomers={isLoadingCustomers}
                onRemoveItem={removeItem}
                onUpdateItem={updateItem}
                onCustomerSelect={selectCustomer}
                onCustomerCreate={createCustomer}
                clearList={clearList}
              />
            </div>
          </div>
        </div>
        
        {/* Mobile Layout - Show active section only */}
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
              {/* Conditionally render results based on card type */}
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
                />
              )}
            </div>
          )}
          
          {activeSection === 'tradein' && (
            <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <TradeInListWithCustomer 
                items={items}
                selectedCustomer={selectedCustomer}
                customers={customers}
                isLoadingCustomers={isLoadingCustomers}
                onRemoveItem={removeItem}
                onUpdateItem={updateItem}
                onCustomerSelect={selectCustomer}
                onCustomerCreate={createCustomer}
                clearList={clearList}
              />
            </div>
          )}
          
          {renderMobileNavigation()}
        </div>
      </main>

      <footer className="mt-auto py-6 md:py-8 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gray-400 text-xs md:text-sm">
              Aloha Card Shop Trade In is not affiliated with TCGPlayer. All prices are scraped from publicly available data.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              © {new Date().getFullYear()} Aloha Card Shop | For educational purposes only
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MainApp;
