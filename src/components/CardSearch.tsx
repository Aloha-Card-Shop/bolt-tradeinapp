
import React, { useState, useEffect } from 'react';
import { CardDetails, GAME_OPTIONS } from '../types/card';
import { Package } from 'lucide-react';
import { SetOption } from '../hooks/useSetOptions';

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

  // All sorted set options are now handled in useSetOptions
  return (
    <div className="p-6">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Package className="h-5 w-5 text-blue-600" />
        </div>
        <h2 className="ml-3 text-xl font-semibold text-gray-800">Find Cards</h2>
      </div>
      
      <div className="space-y-4">
        {/* Game Selection */}
        <div>
          <label htmlFor="game-select" className="block mb-1 text-sm font-medium text-gray-700">
            Game <span className="text-red-500">*</span>
          </label>
          <select
            id="game-select"
            name="game"
            value={cardDetails.game}
            onChange={onInputChange}
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {GAME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Card Name Input */}
        <div>
          <label htmlFor="card-name" className="block mb-1 text-sm font-medium text-gray-700">
            Card Name <span className="text-red-500">*</span>
          </label>
          <input
            id="card-name"
            type="text"
            placeholder="Start typing to search..."
            value={searchTerm}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Set Selection */}
        <div>
          <label htmlFor="set-select" className="block mb-1 text-sm font-medium text-gray-700">
            Set Name
          </label>
          {isLoadingSets ? (
            <div className="py-2 text-sm text-gray-500">Loading sets...</div>
          ) : (
            <select 
              id="set-select"
              name="set"
              value={cardDetails.set || ''}
              onChange={onInputChange}
              disabled={!cardDetails.name || setOptions.length === 0}
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:opacity-70"
            >
              <option value="">Select a set</option>
              {setOptions.map((set) => (
                <option key={set.id} value={set.name}>
                  {set.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Card Number Input */}
        <div>
          <label htmlFor="card-number" className="block mb-1 text-sm font-medium text-gray-700">
            Card Number
          </label>
          <input
            id="card-number"
            type="text"
            name="number"
            value={cardDetails.number || ''}
            onChange={onInputChange}
            placeholder="e.g. 12 or 12/107"
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter full or partial card number (with or without set number)
          </p>
        </div>
      </div>
    </div>
  );
};

export default CardSearch;
