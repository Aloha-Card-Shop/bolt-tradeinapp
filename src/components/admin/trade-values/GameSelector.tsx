
import React from 'react';

interface GameSelectorProps {
  selectedGame: string;
  onGameChange: (game: string) => void;
  isModified: boolean;
}

const GameSelector: React.FC<GameSelectorProps> = ({ 
  selectedGame, 
  onGameChange, 
  isModified 
}) => {
  const handleGameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(`[FRONTEND] Changing game from ${selectedGame} to ${e.target.value}`);
    onGameChange(e.target.value);
  };

  return (
    <div className="mb-4">
      <label htmlFor="game" className="block text-sm font-medium text-gray-700">Select Game:</label>
      <select 
        id="game"
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        value={selectedGame}
        onChange={handleGameChange}
      >
        <option value="pokemon">Pokemon</option>
        <option value="japanese-pokemon">Japanese Pokemon</option>
        <option value="magic">Magic: The Gathering</option>
      </select>
    </div>
  );
};

export default GameSelector;
