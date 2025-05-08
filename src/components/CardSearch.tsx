import React from 'react';
import { Package } from 'lucide-react';
import { CardDetails, GameType, GAME_OPTIONS } from '../types/card';

interface CardSearchProps {
  cardDetails: CardDetails;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setOptions: { id: number; name: string; }[];
  isLoadingSets: boolean;
}

const CardSearch: React.FC<CardSearchProps> = ({ 
  cardDetails, 
  onInputChange,
  setOptions,
  isLoadingSets
}) => {
  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Package className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Find Cards</h2>
      </div>
      
      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="game" className="block text-sm font-medium text-gray-700">
            Game <span className="text-red-500">*</span>
          </label>
          <select
            id="game"
            name="game"
            value={cardDetails.game}
            onChange={onInputChange}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            required
          >
            {GAME_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Card Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={cardDetails.name}
            onChange={onInputChange}
            placeholder="Start typing to search..."
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="set" className="block text-sm font-medium text-gray-700">
              Set Name
            </label>
            <select
              id="set"
              name="set"
              value={cardDetails.set}
              onChange={onInputChange}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
              disabled={isLoadingSets}
            >
              <option value="">Select a set</option>
              {setOptions.map(set => (
                <option key={set.id} value={set.name}>
                  {set.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="number" className="block text-sm font-medium text-gray-700">
              Card Number
            </label>
            <input
              type="text"
              id="number"
              name="number"
              value={cardDetails.number}
              onChange={onInputChange}
              placeholder="e.g. 269/193"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardSearch;