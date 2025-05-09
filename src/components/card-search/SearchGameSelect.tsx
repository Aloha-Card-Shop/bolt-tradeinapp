
import React from 'react';
import { GameType, GAME_OPTIONS } from '../../types/card';

interface SearchGameSelectProps {
  selectedGame: GameType;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const SearchGameSelect: React.FC<SearchGameSelectProps> = ({ selectedGame, onChange }) => {
  return (
    <div>
      <label htmlFor="game-select" className="block mb-1 text-sm font-medium text-gray-700">
        Game <span className="text-red-500">*</span>
      </label>
      <select
        id="game-select"
        name="game"
        value={selectedGame}
        onChange={onChange}
        className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {GAME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SearchGameSelect;
