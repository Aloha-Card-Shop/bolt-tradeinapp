
import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/formatters';
import { Pencil } from 'lucide-react';
import FallbackWarning from '../FallbackWarning';

interface ValueDisplayProps {
  label: string;
  value: number;
  isLoading: boolean;
  error?: string;
  onValueChange?: (value: number) => void;
  editable?: boolean;
  usedFallback?: boolean;
  fallbackReason?: string;
}

const ValueDisplay: React.FC<ValueDisplayProps> = ({
  label,
  value,
  isLoading,
  error,
  onValueChange,
  editable = false,
  usedFallback = false,
  fallbackReason
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const handleStartEdit = () => {
    if (editable) {
      setEditValue(value.toFixed(2));
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    try {
      const numValue = parseFloat(editValue);
      if (!isNaN(numValue) && numValue >= 0 && onValueChange) {
        onValueChange(numValue);
      } else if (isNaN(numValue)) {
        console.warn('Invalid value entered:', editValue);
        // Reset to original value if invalid
        setEditValue(value.toString());
      }
    } catch (error) {
      console.error('Error saving value:', error);
      setEditValue(value.toString());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    try {
      if (e.key === 'Enter') {
        handleSaveEdit();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
        setEditValue(value.toString());
      }
    } catch (error) {
      console.error('Error handling key down:', error);
      setIsEditing(false);
      setEditValue(value.toString());
    }
  };

  return (
    <div className="rounded-md border border-gray-300 p-2 relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      
      {isEditing ? (
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            className="w-full p-1 border border-blue-300 rounded focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        </div>
      ) : (
        <div 
          className={`flex justify-between items-center ${editable ? 'cursor-pointer hover:bg-gray-50' : ''}`} 
          onClick={handleStartEdit}
        >
          <div className="text-lg font-semibold">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
            ) : (
              <span className={error ? 'text-red-500' : ''}>{formatCurrency(value)}</span>
            )}
          </div>
          
          {editable && !isLoading && (
            <Pencil className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          )}
        </div>
      )}
      
      {usedFallback && !error && !isLoading && (
        <FallbackWarning 
          showWarning={true}
          fallbackReason={fallbackReason}
          compact={true}
          className="absolute bottom-[-20px] left-0"
        />
      )}
    </div>
  );
};

export default ValueDisplay;
