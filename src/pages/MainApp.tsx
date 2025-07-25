import React, { useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppHeader } from '../components/main-app/AppHeader';
import { DesktopLayout } from '../components/main-app/DesktopLayout';
import { MobileLayout } from '../components/main-app/MobileLayout';
import { useCardSearch } from '../hooks/useCardSearch';
import { useGradedCardSearch } from '../hooks/useGradedCardSearch';
import { useSavedCards } from '../hooks/useSavedCards';
import { useTradeInSheet } from '../hooks/useTradeInSheet';
import { useCustomers, Customer } from '../hooks/useCustomers';
import { CardDetails, SavedCard } from '../types/card';
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
  const { 
    sheetItems, 
    selectedCustomer, 
    addItemToSheet, 
    removeItemFromSheet, 
    updateSheetItem, 
    updateMarketPrice,
    clearSheet,
    selectCustomer
  } = useTradeInSheet();
  const { customers, isLoading: isLoadingCustomers, createCustomer } = useCustomers();

  // Wrapper function to handle customer creation and return the created customer
  const handleCustomerCreate = async (firstName: string, lastName: string, email?: string, phone?: string): Promise<Customer> => {
    return await createCustomer(firstName, lastName, email, phone);
  };

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

  const handleAddToList = useCallback((card: CardDetails | SavedCard, condition: string, price: number) => {
    // Add to the new sheet instead of old list
    addItemToSheet(card, condition, price);
    resetSearch(); // Reset search after adding card
    
    // On mobile, switch to trade-in view after adding card
    if (isMobile) {
      setActiveSection('tradein');
    }
  }, [addItemToSheet, resetSearch, isMobile]);

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
    // Sheet props
    sheetItems,
    selectedCustomer,
    removeItemFromSheet,
    updateSheetItem,
    updateMarketPrice,
    clearSheet,
    selectCustomer,
    handleAddToList,
    // Customer props
    customers,
    isLoadingCustomers,
    handleCustomerCreate
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
