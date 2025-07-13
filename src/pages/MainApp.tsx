import React from 'react';
import { DatabaseIcon, Sparkles } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import CardSearch from '../components/CardSearch';
import CardResults from '../components/CardResults';
import GradedCardResults from '../components/GradedCardResults';
import SavedCards from '../components/SavedCards';
import TradeInListWithCustomer from '../components/trade-in/TradeInListWithCustomer';
import { useCardSearch } from '../hooks/useCardSearch';
import { useGradedCardSearch } from '../hooks/useGradedCardSearch';
import { useSavedCards } from '../hooks/useSavedCards';
import { useTradeInListWithCustomer } from '../hooks/useTradeInListWithCustomer';
import { useCustomers } from '../hooks/useCustomers';
import { CardDetails, SavedCard } from '../types/card';
import { toast } from 'react-hot-toast';

function MainApp() {
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
    removeCardFromResults,
    clearGradedResults
  } = useGradedCardSearch();
  
  const { savedCards, removeCard } = useSavedCards();
  const { items, selectedCustomer, addItem, removeItem, updateItem, clearList, selectCustomer } = useTradeInListWithCustomer();
  const { customers, isLoading: isLoadingCustomers, createCustomer } = useCustomers();

  // Wrapper function to handle the return type mismatch
  const handleCustomerCreate = async (firstName: string, lastName: string, email?: string, phone?: string): Promise<void> => {
    await createCustomer(firstName, lastName, email, phone);
  };

  const handleCheckSavedCard = (card: SavedCard) => {
    const event = {
      target: { name: 'name', value: card.name }
    } as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(event);
    
    // Also trigger a search when clicking a saved card
    setTimeout(performSearch, 100);
  };

  const handleAddToList = (card: CardDetails | SavedCard, condition: string, price: number) => {
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
    
    // Create a new card object with the validated productId and condition info
    const cardToAdd = {
      ...card,
      productId: productId,
    };
    
    // Pass the card and price to addItem 
    addItem(cardToAdd, price);
    resetSearch(); // Reset search after adding card
    toast.success(`Added ${card.name} (${condition.replace('_', ' ')}) to trade-in list`);
  };

  // Determine which clear function to use based on card type
  const handleClearResults = () => {
    if (cardType === 'graded') {
      clearGradedResults();
    } else {
      clearSearchResults();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Toaster position="top-center" />
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg relative overflow-hidden mt-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none"></div>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <DatabaseIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Aloha Card Shop</h1>
                <p className="text-blue-100 mt-1">Trading Card Price Tracker</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-yellow-300" />
              <span className="text-sm font-medium">Real-time Market Prices</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 space-y-8">
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
          
          <div className="lg:col-span-5">
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
                  onRemoveCard={removeCardFromResults}
                />
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 overflow-hidden sticky top-8">
              <TradeInListWithCustomer 
                items={items}
                selectedCustomer={selectedCustomer}
                customers={customers}
                isLoadingCustomers={isLoadingCustomers}
                onRemoveItem={removeItem}
                onUpdateItem={updateItem}
                onCustomerSelect={selectCustomer}
                onCustomerCreate={handleCustomerCreate}
                clearList={clearList}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto py-8 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gray-400 text-sm">
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
