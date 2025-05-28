
import React from 'react';

interface TradeValueSettings {
  game: string;
  min_value: number;
  max_value: number;
  cash_percentage: number;
  trade_percentage: number;
  fixed_cash_value: number | null;
  fixed_trade_value: number | null;
}

interface SettingCardProps {
  setting: TradeValueSettings;
  index: number;
  onSettingChange: (index: number, field: string, value: string | number | null) => void;
  onDelete: (index: number) => void;
}

const SettingCard: React.FC<SettingCardProps> = ({ 
  setting, 
  index, 
  onSettingChange, 
  onDelete 
}) => {
  return (
    <div className="border rounded p-4 mb-2">
      <div className="grid grid-cols-6 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Min Value:</label>
          <input 
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={setting.min_value}
            onChange={(e) => onSettingChange(index, 'min_value', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Max Value:</label>
          <input 
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={setting.max_value}
            onChange={(e) => onSettingChange(index, 'max_value', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Cash %:</label>
          <input 
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={setting.cash_percentage}
            onChange={(e) => onSettingChange(index, 'cash_percentage', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Trade %:</label>
          <input 
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={setting.trade_percentage}
            onChange={(e) => onSettingChange(index, 'trade_percentage', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fixed Cash:</label>
          <input 
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={setting.fixed_cash_value === null ? '' : setting.fixed_cash_value}
            onChange={(e) => onSettingChange(index, 'fixed_cash_value', e.target.value)}
            placeholder="Null"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fixed Trade:</label>
          <input 
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={setting.fixed_trade_value === null ? '' : setting.fixed_trade_value}
            onChange={(e) => onSettingChange(index, 'fixed_trade_value', e.target.value)}
            placeholder="Null"
          />
        </div>
      </div>
      <button
        type="button"
        className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => onDelete(index)}
      >
        Delete
      </button>
    </div>
  );
};

export default SettingCard;
