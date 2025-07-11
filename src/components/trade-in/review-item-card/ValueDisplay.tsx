
import React, { useState } from 'react';
import { DollarSign, Edit, Check } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

interface ValueDisplayProps {
  value?: number;
  quantity: number;
  onValueChange?: (value: number) => void;
}

const ValueDisplay: React.FC<ValueDisplayProps> = ({ 
  value = 0, 
  quantity,
  onValueChange 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  
  // Update internal state when prop changes and not editing
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(value || 0);
    }
  }, [value, isEditing]);
  
  const handleEditClick = () => {
    setEditValue(value || 0);
    setIsEditing(true);
  };
  
  const handleSaveClick = () => {
    console.log('ValueDisplay: Save clicked with editValue:', editValue, 'onValueChange:', !!onValueChange);
    if (onValueChange) {
      onValueChange(editValue || 0);
    }
    setIsEditing(false);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    setEditValue(newValue);
  };

  // Format the final display value
  const displayValue = (value || 0) * quantity;
  
  console.log('ValueDisplay rendering with:', { value, quantity, displayValue });

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
        <span>Value</span>
        {onValueChange && !isEditing && (
          <button
            onClick={handleEditClick}
            className="text-blue-600 hover:text-blue-800 p-0.5 rounded"
            title="Edit value"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
        )}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <DollarSign className="h-4 w-4 text-gray-400" />
        </span>
        {isEditing ? (
          <div className="flex gap-2">
            <input
              type="number"
              value={editValue}
              onChange={handleChange}
              className="flex-1 pl-8 pr-3 py-2 border border-blue-300 rounded-lg text-gray-700 focus:ring-blue-500 focus:border-blue-500"
              step="0.01"
              min="0"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveClick();
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditValue(value);
                }
              }}
            />
            <button
              onClick={handleSaveClick}
              className="bg-green-600 text-white rounded-lg px-3 py-2 flex items-center hover:bg-green-700 transition-colors"
              title="Save"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditValue(value);
              }}
              className="bg-gray-500 text-white rounded-lg px-3 py-2 flex items-center hover:bg-gray-600 transition-colors"
              title="Cancel"
            >
              ×
            </button>
          </div>
        ) : (
          <input
            type="text"
            value={displayValue > 0 ? formatCurrency(displayValue) : '0.00'}
            readOnly
            className={`w-full pl-8 pr-3 py-2 ${
              displayValue > 0 ? 'bg-gray-50' : 'bg-yellow-50'
            } border border-gray-300 rounded-lg text-gray-700`}
          />
        )}
      </div>
      {onValueChange && !isEditing && (
        <div className="text-xs text-gray-500 mt-1">
          {displayValue > 0 
            ? 'Click edit icon to adjust this value' 
            : 'No value calculated or payment type not selected'}
        </div>
      )}
    </div>
  );
};

export default ValueDisplay;
