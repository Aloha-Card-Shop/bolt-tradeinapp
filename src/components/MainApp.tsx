
import React from 'react';
import { DatabaseIcon, Sparkles } from 'lucide-react';
import { Toaster } from 'react-hot-toast'; // Import Toaster for notifications
import CardSearch from './CardSearch';
import CardResults from './CardResults';
import SavedCards from './SavedCards';
import TradeInList from './TradeInList';
import { useCardSearch } from '../hooks/useCardSearch';
import { useSavedCards } from '../hooks/useSavedCards';
import { useTradeInList } from '../hooks/useTradeInList';
import { CardDetails, SavedCard } from '../types/card';

function MainApp() {
  const { 
    cardDetails, 
    searchResults, 
    setOptions, 
    isLoadingSets, 
    isSearching, 
    suggestions,
    isLoadingSuggestions,
    showSuggestions,
    setShowSuggestions,
    searchHistory,
    potentialCardNumber,
    handleInputChange, 
    selectSuggestion,
    selectHistoryItem,
    clearSearchHistory,
    resetSearch,
    searchInputRef,
    hasMoreResults,
    loadMoreResults,
    totalResults,
    handleUseAsCardNumber,
    performSearch
  } = useCardSearch();
  
  const { savedCards, removeCard } = useSavedCards();
  const { items, addItem, removeItem, updateItem, clearList } = useTradeInList();

  const handleCheckSavedCard = (card: SavedCard) => {
    const event = {
      target: { name: 'name', value: card.name }
    } as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(event);
    
    // Also trigger a search when clicking a saved card
    setTimeout(performSearch, 100);
  };

  const handleAddToList = (card: CardDetails | SavedCard, price: number) => {
    console.log('Adding card to trade-in list:', card);
    addItem(card, price);
    resetSearch(); // Reset search after adding card
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Toaster position="top-center" /> {/* Add Toast notification container */}
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
                suggestions={suggestions}
                isLoadingSuggestions={isLoadingSuggestions}
                showSuggestions={showSuggestions}
                setShowSuggestions={setShowSuggestions}
                onSelectSuggestion={selectSuggestion}
                searchHistory={searchHistory}
                onSelectHistoryItem={selectHistoryItem}
                onClearHistory={clearSearchHistory}
                searchInputRef={searchInputRef}
                potentialCardNumber={potentialCardNumber}
                onUseAsCardNumber={handleUseAsCardNumber}
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
              <CardResults 
                results={searchResults}
                isLoading={isSearching}
                onAddToList={handleAddToList}
                hasMoreResults={hasMoreResults}
                loadMoreResults={loadMoreResults}
                totalResults={totalResults}
              />
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 overflow-hidden sticky top-8">
              <TradeInList 
                items={items}
                onRemoveItem={removeItem}
                onUpdateItem={updateItem}
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
