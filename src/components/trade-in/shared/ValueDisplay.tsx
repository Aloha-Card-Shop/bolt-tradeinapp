
import React, { useState, useEffect } from 'react';
import { Loader2, Edit, Check, X, AlertCircle } from 'lucide-react';

interface ValueDisplayProps {
  label: string;
  value: number;
  isLoading?: boolean;
  error?: string;
  onValueChange?: (value: number) => void;
  editable?: boolean;
}

const ValueDisplay: React.FC<ValueDisplayProps> = ({ 
  label, 
  value, 
  isLoading, 
  error,
  onValueChange,
  editable = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  
  // Update edit value when prop value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);
  
  const handleEditClick = () => {
    setEditValue(value);
    setIsEditing(true);
  };
  
  const handleSaveClick = () => {
    if (onValueChange) {
      onValueChange(editValue);
    }
    setIsEditing(false);
  };
  
  const handleCancelClick = () => {
    setIsEditing(false);
    setEditValue(value); // Reset to original value
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(parseFloat(e.target.value) || 0);
  };

  if (isEditing && editable) {
    return (
      <div className="rounded-md border border-gray-300 p-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            value={editValue}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            className="block w-full pl-7 pr-12 py-1 border-0 text-right focus:ring-2 focus:ring-blue-500 sm:text-sm"
            placeholder="0.00"
            autoFocus
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button 
              onClick={handleSaveClick} 
              className="p-1 text-green-600 hover:text-green-800"
              title="Save"
            >
              <Check size={16} />
            </button>
            <button 
              onClick={handleCancelClick} 
              className="p-1 text-red-600 hover:text-red-800"
              title="Cancel"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="rounded-md border border-gray-300 p-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative mt-1 rounded-md">
        <div className="flex justify-between items-center">
          <span className="text-xl font-medium">
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="animate-spin h-4 w-4 mr-2 text-gray-500" />
                <span className="text-gray-500">Calculating...</span>
              </div>
            ) : (
              <span className={error ? 'text-red-500' : value > 0 ? 'text-gray-900' : 'text-yellow-600'}>
                ${value.toFixed(2)}
              </span>
            )}
          </span>
          
          {editable && !isLoading && (
            <button
              onClick={handleEditClick}
              className="p-1 text-gray-500 hover:text-blue-500"
              title="Edit value"
            >
              <Edit size={16} />
            </button>
          )}
        </div>
        
        {error && !isLoading && (
          <div className="flex items-center mt-1 text-xs text-red-500">
            <AlertCircle size={12} className="mr-1 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {!error && !isLoading && value === 0 && (
          <div className="flex items-center mt-1 text-xs text-yellow-600">
            <AlertCircle size={12} className="mr-1 flex-shrink-0" />
            <span>No value available</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValueDisplay;
