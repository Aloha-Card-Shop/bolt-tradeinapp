
import React from 'react';
import { Gamepad2 } from 'lucide-react';

interface GameSelectorProps {
  selectedGame: string;
  onGameChange: (game: string) => void;
}

const GameSelector: React.FC<GameSelectorProps> = ({ 
  selectedGame, 
  onGameChange
}) => {
  const handleGameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(`[FRONTEND] Changing game from ${selectedGame} to ${e.target.value}`);
    onGameChange(e.target.value);
  };

  const gameOptions = [
    { value: 'pokemon', label: 'Pokemon Cards', emoji: '🎮' },
    { value: 'japanese-pokemon', label: 'Japanese Pokemon Cards', emoji: '🇯🇵' },
    { value: 'magic', label: 'Magic: The Gathering', emoji: '🔮' }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Gamepad2 className="h-4 w-4 text-gray-600" />
        <label htmlFor="game" className="text-sm font-medium text-gray-700">
          Select Game Type
        </label>
      </div>
      <select 
        id="game"
        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-colors"
        value={selectedGame}
        onChange={handleGameChange}
      >
        {gameOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.emoji} {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default GameSelector;
