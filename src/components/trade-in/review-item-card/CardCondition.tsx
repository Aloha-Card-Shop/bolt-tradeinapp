
import React from 'react';
import { CONDITIONS } from '../../../constants/tradeInConstants';

interface CardConditionProps {
  condition: string;
  onChange: (condition: string) => void;
}

const CardCondition: React.FC<CardConditionProps> = ({ condition, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Condition
      </label>
      <select
        value={condition}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

export default CardCondition;
