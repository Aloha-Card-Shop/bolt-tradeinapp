
import React from 'react';
import { CONDITIONS } from '../../constants/tradeInConstants';

interface ItemConditionSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  id: string;
  usedFallback?: boolean;
}

const ItemConditionSelect: React.FC<ItemConditionSelectProps> = ({ value, onChange, id, usedFallback = false }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-700 mb-1">
        Condition {usedFallback && <span className="text-amber-600" title="Price found using fallback condition">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      >
        {CONDITIONS.map(condition => (
          <option key={condition.value} value={condition.value}>
            {condition.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ItemConditionSelect;
