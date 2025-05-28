
import React from 'react';
import { Trash2, DollarSign, Percent } from 'lucide-react';

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
    <div className="border border-gray-200 rounded-lg p-6 mb-4 bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Value Range: ${setting.min_value} - ${setting.max_value}
        </h3>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
          onClick={() => onDelete(index)}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Value Range */}
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <DollarSign className="h-4 w-4" />
            Value Range
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min Value ($)</label>
              <input 
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={setting.min_value}
                onChange={(e) => onSettingChange(index, 'min_value', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Value ($)</label>
              <input 
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={setting.max_value}
                onChange={(e) => onSettingChange(index, 'max_value', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Percentages */}
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Percent className="h-4 w-4" />
            Percentages
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cash Percentage (%)</label>
              <input 
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={setting.cash_percentage}
                onChange={(e) => onSettingChange(index, 'cash_percentage', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Trade Percentage (%)</label>
              <input 
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={setting.trade_percentage}
                onChange={(e) => onSettingChange(index, 'trade_percentage', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Fixed Values */}
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <DollarSign className="h-4 w-4" />
            Fixed Values (Optional)
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fixed Cash Value ($)</label>
              <input 
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={setting.fixed_cash_value === null ? '' : setting.fixed_cash_value}
                onChange={(e) => onSettingChange(index, 'fixed_cash_value', e.target.value)}
                placeholder="Leave empty for percentage"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fixed Trade Value ($)</label>
              <input 
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={setting.fixed_trade_value === null ? '' : setting.fixed_trade_value}
                onChange={(e) => onSettingChange(index, 'fixed_trade_value', e.target.value)}
                placeholder="Leave empty for percentage"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingCard;
