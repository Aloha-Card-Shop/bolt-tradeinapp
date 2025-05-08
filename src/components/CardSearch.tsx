import React, { useState, useEffect } from 'react';
import { useCardSearch } from '../hooks/useCardSearch';
import { CardDetails } from '../types/card';

interface CardSearchProps {
  onCardSelect: (card: CardDetails) => void;
}

const CardSearch: React.FC<CardSearchProps> = ({ onCardSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { cards, isLoading, error, searchCards } = useCardSearch();

  useEffect(() => {
    if (searchTerm) {
      searchCards(searchTerm);
    }
  }, [searchTerm, searchCards]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCardSelect = (card: CardDetails) => {
    onCardSelect(card);
    setSearchTerm(''); // Clear the search term after selecting a card
  };

  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder="Search for a card..."
        value={searchTerm}
        onChange={handleInputChange}
        className="w-full px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {cards && cards.length > 0 && (
        <ul className="mt-2">
          {cards.map((card) => (
            <li
              key={card.id}
              className="py-2 px-4 border-b cursor-pointer hover:bg-gray-100"
              onClick={() => handleCardSelect(card)}
            >
              {card.name} ({card.set})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CardSearch;
