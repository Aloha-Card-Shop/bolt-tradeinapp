import { useState, useEffect } from 'react';
import { SavedCard, CardDetails } from '../types/card';

export const useSavedCards = () => {
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);

  // Load saved cards from localStorage on component mount
  useEffect(() => {
    const storedCards = localStorage.getItem('savedCards');
    if (storedCards) {
      try {
        setSavedCards(JSON.parse(storedCards));
      } catch (error) {
        console.error('Failed to parse saved cards:', error);
      }
    }
  }, []);

  // Save cards to localStorage whenever the savedCards state changes
  useEffect(() => {
    localStorage.setItem('savedCards', JSON.stringify(savedCards));
  }, [savedCards]);

  const saveCard = (card: CardDetails, price: string | null) => {
    // Generate a unique ID if one doesn't exist
    const id = Math.random().toString(36).substring(2, 11);
    
    setSavedCards(prev => {
      // Check if card already exists
      const existingCardIndex = prev.findIndex(c => 
        c.name === card.name && c.set === card.set && c.number === card.number
      );
      
      if (existingCardIndex >= 0) {
        // Update existing card
        const updatedCards = [...prev];
        updatedCards[existingCardIndex] = {
          ...updatedCards[existingCardIndex],
          lastChecked: new Date().toISOString(),
          lastPrice: price
        };
        return updatedCards;
      } else {
        // Add new card
        return [...prev, {
          ...card,
          id,
          lastChecked: new Date().toISOString(),
          lastPrice: price
        }];
      }
    });
  };

  const removeCard = (id: string) => {
    setSavedCards(prev => prev.filter(card => card.id !== id));
  };

  return {
    savedCards,
    saveCard,
    removeCard
  };
};