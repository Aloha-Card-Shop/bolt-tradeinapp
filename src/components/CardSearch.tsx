
import React, { useState, useEffect } from 'react';
import { CardDetails } from '../types/card';

interface SetOption {
  id: number;
  name: string;
}

interface CardSearchProps {
  cardDetails: CardDetails;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setOptions: SetOption[];
  isLoadingSets: boolean;
}

const CardSearch: React.FC<CardSearchProps> = ({ 
  cardDetails, 
  onInputChange, 
  setOptions, 
  isLoadingSets 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    setSearchTerm(cardDetails.name || '');
  }, [cardDetails.name]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    
    const event = {
      ...e,
      target: {
        ...e.target,
        name: 'name',
        value: e.target.value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onInputChange(event);
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
      
      {isLoadingSets && <p>Loading sets...</p>}
      
      {setOptions && setOptions.length > 0 && cardDetails.name && (
        <div className="mt-2">
          <label className="block mb-1 text-sm font-medium">Set:</label>
          <select 
            name="set"
            value={cardDetails.set || ''}
            onChange={onInputChange}
            className="w-full px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sets</option>
            {setOptions.map((set) => (
              <option key={set.id} value={set.name}>
                {set.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Card number input */}
      {cardDetails.name && (
        <div className="mt-2">
          <label className="block mb-1 text-sm font-medium">Card Number:</label>
          <input
            type="text"
            name="number"
            value={cardDetails.number || ''}
            onChange={onInputChange}
            placeholder="Enter card number..."
            className="w-full px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
};

export default CardSearch;
