
import React, { useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppHeader } from './main-app/AppHeader';
import { DesktopLayout } from './main-app/DesktopLayout';
import { MobileLayout } from './main-app/MobileLayout';
import { useCardSearch } from '../hooks/useCardSearch';
import { useGradedCardSearch } from '../hooks/useGradedCardSearch';
import { useSavedCards } from '../hooks/useSavedCards';
import { useTradeInListWithCustomer } from '../hooks/useTradeInListWithCustomer';
import { useCustomers } from '../hooks/useCustomers';
import { CardDetails, SavedCard } from '../types/card';
import { toast } from 'react-hot-toast';
import { useMediaQuery } from '../hooks/useMediaQuery';

function MainApp() {
  console.log('MainApp rendering...');
  
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
    removeCardFromResults,
    clearGradedResults
  } = useGradedCardSearch();
  
  const { savedCards, removeCard } = useSavedCards();
  const { items, selectedCustomer, addItem, removeItem, updateItem, handleValueAdjustment, clearList, selectCustomer } = useTradeInListWithCustomer();
  const { customers, isLoading: isLoadingCustomers, createCustomer } = useCustomers();

  // Wrapper function to handle the return type mismatch
  const handleCustomerCreate = useCallback(async (firstName: string, lastName: string, email?: string, phone?: string): Promise<void> => {
    try {
      await createCustomer(firstName, lastName, email, phone);
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
    }
  }, [createCustomer]);

  const handleCheckSavedCard = useCallback((card: SavedCard) => {
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
  }, [handleInputChange, performSearch, isMobile]);

  const handleAddToList = useCallback((card: CardDetails | SavedCard, price: number) => {
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
  }, [addItem, resetSearch, isMobile]);

  // Determine which clear function to use based on card type
  const handleClearResults = useCallback(() => {
    if (cardType === 'graded') {
      clearGradedResults();
    } else {
      clearSearchResults();
    }
  }, [cardType, clearGradedResults, clearSearchResults]);

  const commonProps = {
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
    items,
    selectedCustomer,
    customers,
    isLoadingCustomers,
    removeItem,
    updateItem,
    handleValueAdjustment,
    selectCustomer,
    handleCustomerCreate,
    clearList,
    handleAddToList
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-16 md:pb-0">
      <Toaster position="top-center" />
      <AppHeader />

      <main className="container mx-auto px-4 py-6 md:py-12">
        {/* Desktop Layout */}
        <DesktopLayout {...commonProps} />
        
        {/* Mobile Layout */}
        <MobileLayout 
          {...commonProps}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
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
