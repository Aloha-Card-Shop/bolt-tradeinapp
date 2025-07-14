
import React from 'react';

interface ConditionSelectProps {
  condition: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  usedFallback?: boolean;
}

const ConditionSelect: React.FC<ConditionSelectProps> = ({
  condition,
  onChange,
  disabled = false,
  usedFallback = false
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Condition {usedFallback && <span className="text-amber-600" title="Price found using fallback condition">*</span>}
      </label>
      <select
        value={condition}
        onChange={onChange}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
      >
        <option value="">Select Condition</option>
        <option value="near_mint">Near Mint</option>
        <option value="lightly_played">Lightly Played</option>
        <option value="moderately_played">Moderately Played</option>
        <option value="heavily_played">Heavily Played</option>
        <option value="damaged">Damaged</option>
      </select>
    </div>
  );
};

export default ConditionSelect;
